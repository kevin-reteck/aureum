import { OR_LINK, OR_PORTAL } from "./or.config.js";

const API = "https://api.tcgdex.net/v2/fr";
const FAV_KEY = "aureum.favoris";
const OR_KEY = "aureum.or";
const CTX_KEY = "aureum.contexte";
const FREE_FAVS = 3;
const TABS = ["galerie", "extensions", "etb", "univers", "cotes", "favoris", "or"];
const PAGE_SIZE = 18;
const HERO_IDS = ["swsh7-215", "base1-4", "base1-2"];
const ICONIC_IDS = ["swsh7-215", "base1-4", "base1-2", "base1-15", "base1-10", "base1-6", "sv03.5-205", "base1-58"];
const SERIES_ORDER = ["me", "sv", "swsh", "sm", "xy", "bw", "hgss", "dp", "pl", "col", "pop", "ex", "neo", "ecard", "base", "tcgp", "mc", "tk", "misc"];

const TYPE_COLOR = {
  Feu: "#e07a45",
  Eau: "#67aed4",
  Plante: "#7da86a",
  Électrik: "#e2c15a",
  Electrik: "#e2c15a",
  Lightning: "#e2c15a",
  Psy: "#c58bb8",
  Combat: "#c4845a",
  Obscurité: "#8b7eaa",
  Ténèbres: "#8b7eaa",
  Métal: "#aeb6bd",
  Dragon: "#8d86c4",
  Fée: "#e4a8c6",
  Incolore: "#c9c1b4",
};

const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const usdFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const cache = new Map();
const inflight = new Map();
const setsCache = new Map();

let epoch = 0;
let favEpoch = 0;
let quoteToken = 0;
let searchTimer = 0;
const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  tab: "galerie",
  view: "set",
  series: [],
  gallerySeriesId: "me",
  setId: "me05",
  gallerySets: [],
  setDetail: null,
  setCards: [],
  searchCards: [],
  searchTotal: 0,
  query: "",
  sort: "numero",
  page: 1,
  loading: true,
  error: "",
  iconics: [],
  iconicsReady: false,
  favorites: loadFavs(),
  browseSeriesId: "me",
  browseSets: [],
  browseLoading: false,
  quote: null,
  sealed: null,
  sealedAsOf: "",
  sealedLoading: false,
  sealedError: "",
  sealedKind: "tous",
  sealedSort: "recent",
  sealedQuery: "",
  sealedPage: 1,
  univers: null,
  universAsOf: "",
  universLoading: false,
  universError: "",
  universKind: "tous",
  universSort: "ancien",
  universQuery: "",
  universPage: 1,
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function prettyName(name) {
  return String(name || "").replace(/(\p{L})(\p{N})/gu, "$1 $2");
}

function cleanId(value, fallback) {
  return typeof value === "string" && /^[\w.-]+$/.test(value) ? value : fallback;
}

function eur(amount) {
  return eurFmt.format(amount);
}

function formatDay(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dayFmt.format(date);
}

function formatPct(pct) {
  const body = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(Math.abs(pct));
  if (pct > 0) return `+${body} %`;
  if (pct < 0) return `−${body} %`;
  return `${body} %`;
}

function trendOf(card) {
  const trend = card?.pricing?.cardmarket?.trend;
  return typeof trend === "number" ? trend : -1;
}

function deltaInfo(card) {
  const prices = card?.pricing?.cardmarket;
  if (!prices || typeof prices.trend !== "number" || typeof prices.avg30 !== "number" || prices.avg30 === 0) {
    return null;
  }
  const pct = ((prices.trend - prices.avg30) / prices.avg30) * 100;
  const dir = pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat";
  return { pct, dir };
}

function subscribed() {
  try {
    const raw = JSON.parse(localStorage.getItem(OR_KEY) || "null");
    return raw?.actif === true;
  } catch {
    return false;
  }
}

function stripeHref(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    const host = url.hostname;
    if (host !== "buy.stripe.com" && host !== "checkout.stripe.com" && host !== "billing.stripe.com") return "";
    return url.href;
  } catch {
    return "";
  }
}

function isOr() {
  return subscribed() || !stripeHref(OR_LINK);
}

function grantOr() {
  localStorage.setItem(OR_KEY, JSON.stringify({ actif: true, depuis: new Date().toISOString() }));
}

function lockHTML() {
  return `<span class="price-lock">Or</span>`;
}

function priceHTML(card, options = {}) {
  const prices = card?.pricing?.cardmarket;
  const amount = typeof prices?.trend === "number" ? prices.trend : typeof prices?.avg === "number" ? prices.avg : null;
  if (amount == null) return `<span class="price-missing">Cote indisponible</span>`;
  if (!options.apercu && !isOr()) return lockHTML();
  const delta = deltaInfo(card);
  const move = delta
    ? `<span class="delta ${delta.dir}">${esc(formatPct(delta.pct))}<span class="delta-hint"> vs 30 j</span></span>`
    : "";
  return `<span class="price">${esc(eur(amount))}</span>${move}`;
}

function usdHTML(amount) {
  if (typeof amount !== "number") return `<span class="price-missing">Cote indisponible</span>`;
  if (!isOr()) return lockHTML();
  return `<span class="price">${esc(usdFmt.format(amount))}</span>`;
}

function localNum(card) {
  const num = parseInt(String(card.localId || "").replace(/\D/g, ""), 10);
  return Number.isFinite(num) ? num : 0;
}

function countLine(cardCount) {
  if (!cardCount) return "";
  const total = cardCount.total || 0;
  const official = cardCount.official || 0;
  if (official && total && official !== total) return `${official} officielles · ${total} au total`;
  const n = total || official;
  return `${n} carte${n > 1 ? "s" : ""}`;
}

function metaLine(card) {
  const setName = card.set?.name || (state.view === "set" ? state.setDetail?.name : "") || "";
  const bits = [];
  if (setName) bits.push(prettyName(setName));
  if (card.localId) bits.push(`n° ${card.localId}`);
  if (firstEditionId(card)) bits.push("1re édition");
  if (card.rarity) bits.push(card.rarity);
  return bits.join(" · ");
}

function safeArt(base, size) {
  if (typeof base !== "string" || !base.startsWith("https://assets.tcgdex.net/")) return "";
  return `${base}/${size}.webp`;
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function artCandidates(base, size) {
  if (typeof base !== "string" || !base.startsWith("https://assets.tcgdex.net/")) return [];
  const order = size === "high" ? ["high", "low"] : ["low", "high"];
  return order.flatMap((item) => [`${base}/${item}.webp`, `${base}/${item}.png`]);
}

function productId(value) {
  if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value))) return String(value);
  return "";
}

function wantsFirstPrint(card) {
  return card?.set?.id === "base1" || String(card?.id || "").startsWith("base1-");
}

function firstEditionId(card) {
  if (!wantsFirstPrint(card)) return "";
  const variants = Array.isArray(card?.variants_detailed) ? card.variants_detailed : [];
  const stamped = variants.filter((variant) => {
    const stamps = Array.isArray(variant?.stamp) ? variant.stamp : [];
    return stamps.some((stamp) => /1re/i.test(String(stamp)));
  });
  if (!stamped.length) return "";
  const direct = stamped.map((variant) => productId(variant?.thirdParty?.tcgplayer)).find(Boolean);
  if (direct) return direct;
  return variants.map((variant) => productId(variant?.thirdParty?.tcgplayer)).find(Boolean) || "";
}

function editionArt(card, quality) {
  const product = firstEditionId(card);
  if (!product) return "";
  const px = quality === "high" ? 1000 : 400;
  return `https://tcgplayer-cdn.tcgplayer.com/product/${product}_in_${px}x${px}.jpg`;
}

function marketArt(card, quality) {
  const variants = Array.isArray(card?.variants_detailed) ? card.variants_detailed : [];
  const product = variants
    .map((variant) => productId(variant?.thirdParty?.tcgplayer))
    .find(Boolean);
  if (!product) return "";
  const px = quality === "high" ? 1000 : 400;
  return `https://tcgplayer-cdn.tcgplayer.com/product/${product}_in_${px}x${px}.jpg`;
}

function markBroken(img) {
  img.dataset.probing = "";
  img.classList.remove("is-trying");
  img.classList.add("is-broken");
}

function showScan(img, src) {
  img.dataset.probing = "";
  img.dataset.fallbacks = "";
  img.classList.remove("is-broken");
  img.classList.add("is-trying");
  if (img.getAttribute("src") !== src) img.src = src;
  else img.classList.remove("is-trying");
}

function probeScans(img, urls) {
  const next = urls.find((url) => url && url !== img.getAttribute("src"));
  if (!next) {
    if (img.dataset.id && img.dataset.market !== "1") {
      img.dataset.market = "1";
      recoverFromMarket(img);
      return;
    }
    markBroken(img);
    return;
  }
  const probe = new Image();
  probe.onload = () => showScan(img, next);
  probe.onerror = () => probeScans(img, urls.filter((url) => url !== next));
  probe.src = next;
}

function rescueBlankScan(img, card) {
  if (img.dataset.probing === "1" || img.dataset.market === "1") return;
  const src = img.getAttribute("src") || "";
  if (!src || src.includes("tcgplayer-cdn")) return;
  const dead = img.classList.contains("is-trying") || img.classList.contains("is-broken") || (img.complete && img.naturalWidth === 0);
  if (!dead) return;
  const market = marketArt(card, img.dataset.quality === "high" ? "high" : "low");
  if (!market || market === src) return;
  img.dataset.market = "1";
  img.dataset.fallbacks = "";
  showScan(img, market);
}

function imgTag(card, size, eager) {
  const urls = artCandidates(card.image, size);
  const edition = editionArt(card, size === "high" ? "high" : "low");
  if (edition) urls.unshift(edition);
  const mark = esc(initials(card.name));
  if (!urls.length) return `<span class="monogram" data-label="${mark}">${mark}</span>`;
  const [src, ...rest] = urls;
  const loading = eager ? `fetchpriority="high"` : `loading="lazy"`;
  return `<img src="${esc(src)}" data-fallbacks="${esc(rest.join("|"))}" data-id="${esc(card.id || "")}" data-quality="${size === "high" ? "high" : "low"}" alt="${esc(prettyName(card.name))}" ${loading} decoding="async">`;
}

function logoTag(seriesId, setId) {
  const fr = `https://assets.tcgdex.net/fr/${seriesId}/${setId}/logo`;
  const en = `https://assets.tcgdex.net/en/${seriesId}/${setId}/logo`;
  const symbol = `https://assets.tcgdex.net/fr/${seriesId}/${setId}/symbol.png`;
  const rest = [fr + ".png", en + ".webp", en + ".png", symbol];
  return `<img src="${esc(fr)}.webp" data-fallbacks="${esc(rest.join("|"))}" alt="">`;
}

function typeColor(type) {
  return TYPE_COLOR[type] || "#c6a15b";
}

function activeCards() {
  return state.view === "search" ? state.searchCards : state.setCards;
}

function resolveCard(card) {
  if (card?.id && cache.has(card.id)) return { ...card, ...cache.get(card.id) };
  return card;
}

function sortedActive() {
  const copy = activeCards().map(resolveCard);
  if (state.sort === "nom") {
    copy.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr"));
  } else if (state.sort === "cote") {
    copy.sort((a, b) => trendOf(b) - trendOf(a));
  } else {
    copy.sort((a, b) => localNum(a) - localNum(b) || String(a.localId || "").localeCompare(String(b.localId || ""), "fr"));
  }
  return copy;
}

function shownCards() {
  return sortedActive().slice(0, state.page * PAGE_SIZE);
}

async function fetchJSON(path) {
  const response = await fetch(API + path);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function getCard(id) {
  if (cache.has(id)) return cache.get(id);
  if (inflight.has(id)) return inflight.get(id);
  const pending = fetchJSON(`/cards/${encodeURIComponent(id)}`)
    .then((data) => {
      cache.set(id, data);
      inflight.delete(id);
      return data;
    })
    .catch((error) => {
      inflight.delete(id);
      throw error;
    });
  inflight.set(id, pending);
  return pending;
}

function ensureSeriesSets(id) {
  if (!setsCache.has(id)) {
    setsCache.set(
      id,
      fetchJSON(`/series/${encodeURIComponent(id)}`)
        .then((data) => data.sets || [])
        .catch((error) => {
          setsCache.delete(id);
          throw error;
        }),
    );
  }
  return setsCache.get(id);
}

async function pool(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function loadFavs() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && cleanId(item.id, "") && item.name);
  } catch {
    return [];
  }
}

function saveFavs() {
  localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites));
  updateFavCount();
}

function isFav(id) {
  return state.favorites.some((item) => item.id === id);
}

function snapshot(card) {
  return {
    id: card.id,
    name: card.name,
    image: card.image || "",
    setName: card.set?.name || "",
    localId: card.localId || "",
    rarity: card.rarity || "",
    trend: typeof card.pricing?.cardmarket?.trend === "number" ? card.pricing.cardmarket.trend : null,
    pricing: card.pricing || null,
  };
}

function touchFav(card) {
  const index = state.favorites.findIndex((item) => item.id === card.id);
  if (index < 0) return;
  state.favorites[index] = { ...state.favorites[index], ...snapshot(card) };
  saveFavs();
}

function readContext() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CTX_KEY) || "{}");
    return {
      seriesId: cleanId(raw.seriesId, "me"),
      setId: cleanId(raw.setId, "me05"),
    };
  } catch {
    return { seriesId: "me", setId: "me05" };
  }
}

function rememberContext() {
  sessionStorage.setItem(CTX_KEY, JSON.stringify({
    seriesId: state.gallerySeriesId,
    setId: state.setId,
  }));
}

function updateFavCount() {
  const badge = document.getElementById("fav-count");
  if (!badge) return;
  badge.textContent = String(state.favorites.length);
  badge.hidden = state.favorites.length === 0;
}

function updateTabs() {
  document.querySelectorAll(".tabs [data-tab]").forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.tab === state.tab ? "true" : "false");
  });
}

function rememberTab(tab) {
  if (!TABS.includes(tab)) return;
  state.tab = tab;
  const hash = `#${tab}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
  updateTabs();
}

function clearQueryBox() {
  state.query = "";
  const input = document.getElementById("q");
  const clear = document.getElementById("clear-q");
  if (input) input.value = "";
  if (clear) clear.hidden = true;
}

function setNote(text) {
  const note = document.getElementById("hydrate-note");
  if (note) note.textContent = text;
}

function mergeCard(full) {
  const lists = [state.setCards, state.searchCards, state.iconics];
  lists.forEach((list) => {
    const index = list.findIndex((card) => card.id === full.id);
    if (index >= 0) list[index] = { ...list[index], ...full };
  });
  touchFav(full);
}

function patchCard(full) {
  mergeCard(full);
  const id = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(full.id) : full.id.replace(/"/g, "");
  document.querySelectorAll(`[data-card="${id}"]`).forEach((node) => {
    const slot = node.querySelector("[data-slot='price']");
    if (slot) {
      slot.classList.remove("is-wait");
      slot.innerHTML = priceHTML(full);
    }
    const img = node.querySelector("img");
    const quality = img?.dataset.quality === "high" ? "high" : "low";
    const edition = editionArt(full, quality);
    if (img && edition && img.getAttribute("src") !== edition && !String(img.getAttribute("src") || "").includes("tcgplayer-cdn")) {
      img.dataset.fallbacks = artCandidates(full.image, quality).join("|");
      img.dataset.market = "";
      img.dataset.probing = "";
      img.classList.remove("is-broken", "is-trying");
      img.src = edition;
    } else if (img && safeArt(full.image, quality) && !img.getAttribute("src")) {
      img.src = safeArt(full.image, quality);
    } else if (img && marketArt(full, quality)) {
      rescueBlankScan(img, full);
    }
    const meta = node.querySelector("[data-slot='meta']");
    if (meta) meta.textContent = metaLine(full);
  });
}

function orderedSeries() {
  const byId = new Map(state.series.map((serie) => [serie.id, serie]));
  const used = new Set();
  const ordered = [];
  SERIES_ORDER.forEach((id) => {
    if (!byId.has(id)) return;
    ordered.push(byId.get(id));
    used.add(id);
  });
  state.series.forEach((serie) => {
    if (!used.has(serie.id)) ordered.push(serie);
  });
  return ordered;
}

function fanInner() {
  const cards = HERO_IDS.map((id) => state.iconics.find((card) => card.id === id)).filter(Boolean);
  if (cards.length < 3) {
    return `<div class="fan">${[0, 1, 2].map(() => `<div class="stage skel"></div>`).join("")}</div>`;
  }
  return `<div class="fan">${cards.map((card, index) => `
    <button class="fan-card${index === 1 ? " is-lead" : ""}" type="button" data-open="${esc(card.id)}">
      <span class="stage" data-tilt data-label="${esc(initials(card.name))}">
        ${imgTag(card, "high", true)}
        <span class="shine" aria-hidden="true"></span>
      </span>
      <span class="cap">
        <span class="fan-name">${esc(prettyName(card.name))}</span>
        <span class="fan-price">${priceHTML(card, { apercu: true })}</span>
      </span>
    </button>`).join("")}</div>`;
}

function liveLine() {
  const priced = state.iconics.find((card) => card.pricing?.cardmarket?.updated);
  const when = formatDay(priced?.pricing?.cardmarket?.updated);
  const label = when ? `Cardmarket · ${when}` : "Cotes Cardmarket en euros";
  return `<p class="live"><i aria-hidden="true"></i> ${esc(label)}</p>`;
}

function heroHTML() {
  const setName = state.setDetail ? prettyName(state.setDetail.name) : "";
  const opened = setName ? ` Extension ouverte : ${esc(setName)}.` : "";
  return `
    <section class="hero">
      <div>
        <p class="kicker">Cabinet de cartes Pokémon</p>
        <h1>Chaque carte,<br><em>sa cote du jour.</em></h1>
        <p class="lede">Aureum recense les cartes et affiche la tendance Cardmarket en euros, tirage par tirage.${opened}</p>
        <div class="hero-actions">
          <button class="btn solid" type="button" data-action="jump">Parcourir l'extension</button>
          <button class="btn" type="button" data-tab="cotes">Salle des cotes</button>
        </div>
        ${liveLine()}
      </div>
      <div id="fan-slot">${fanInner()}</div>
    </section>`;
}

function toolbarHTML() {
  const options = state.gallerySets.map((set) => `
    <option value="${esc(set.id)}"${set.id === state.setId ? " selected" : ""}>${esc(prettyName(set.name))}</option>
  `).join("");
  const select = options
    ? `<label class="field">Extension<select id="set-select">${options}</select></label>`
    : "";
  return `
    <div class="toolbar">
      <div class="controls">
        ${select}
        <label class="field">Tri
          <select id="sort-select">
            <option value="numero"${state.sort === "numero" ? " selected" : ""}>Numéro</option>
            <option value="nom"${state.sort === "nom" ? " selected" : ""}>Nom</option>
            <option value="cote"${state.sort === "cote" ? " selected" : ""}>Tendance</option>
          </select>
        </label>
      </div>
      <button class="btn" type="button" data-action="random">Carte au hasard</button>
    </div>`;
}

function headHTML() {
  if (state.view === "search" && state.loading && state.searchCards.length === 0) {
    return `
      <header class="section-head">
        <div>
          <p class="kicker">Recherche</p>
          <h2>Résultats pour « ${esc(state.query)} »</h2>
        </div>
        <p class="lede" id="grille-status">Lecture du catalogue…</p>
      </header>
      <p class="note" id="hydrate-note"></p>`;
  }
  if (state.view === "search") {
    if (!state.searchTotal) {
      return `
        <header class="section-head">
          <div>
            <p class="kicker">Recherche</p>
            <h2>Résultats pour « ${esc(state.query)} »</h2>
          </div>
          <p class="lede" id="grille-status">Aucune carte ne porte ce nom.</p>
        </header>
        <p class="note" id="hydrate-note"></p>`;
    }
    const shown = Math.min(shownCards().length, state.searchCards.length);
    const mot = shown > 1 ? "cartes affichées" : "carte affichée";
    const extra = state.searchTotal > state.searchCards.length
      ? " Affinez le nom pour aller plus loin."
      : "";
    return `
      <header class="section-head">
        <div>
          <p class="kicker">Recherche</p>
          <h2>Résultats pour « ${esc(state.query)} »</h2>
        </div>
        <p class="lede" id="grille-status">${shown} ${mot} sur ${state.searchTotal}.${extra}</p>
      </header>
      <p class="note" id="hydrate-note"></p>`;
  }
  const detail = state.setDetail;
  const title = detail ? prettyName(detail.name) : state.loading ? "Chargement…" : "Galerie";
  const bits = [];
  if (detail?.releaseDate) bits.push(formatDay(detail.releaseDate));
  if (detail?.cardCount) bits.push(countLine(detail.cardCount));
  if (detail?.serie?.name) bits.push(prettyName(detail.serie.name));
  return `
    <header class="section-head" id="grille-titre">
      <div>
        <p class="kicker">En vitrine</p>
        <h2>${esc(title)}</h2>
      </div>
      <p class="lede" id="grille-status">${esc(bits.join(" · "))}</p>
    </header>
    ${state.setId === "base1" ? `<p class="note">1re édition : le petit 1 est à gauche du descriptif, sous l'illustration.</p>` : ""}
    ${!isOr() ? `<p class="note">Les cotes du catalogue sont dans Aureum Or. Les trois cartes de la une restent en aperçu.</p>` : ""}
    <p class="note" id="hydrate-note"></p>`;
}

function tileHTML(card) {
  const full = resolveCard(card);
  const ready = Boolean(full.pricing) || cache.has(card.id);
  return `
    <article class="tile" data-card="${esc(card.id)}">
      <button class="tile-hit" type="button" data-open="${esc(card.id)}">
        <span class="art" data-label="${esc(initials(full.name))}">${imgTag(full, "low", false)}</span>
        <span class="tile-name">${esc(prettyName(full.name || "Carte"))}</span>
        <span class="tile-meta" data-slot="meta">${esc(metaLine(full))}</span>
        <span class="price-line${ready ? "" : " is-wait"}" data-slot="price">${ready ? priceHTML(full) : ""}</span>
      </button>
    </article>`;
}

function skeletonTiles(count) {
  return Array.from({ length: count }, () => `
    <article class="tile">
      <div class="art skel"></div>
      <div class="skel-line"></div>
      <div class="skel-line short"></div>
    </article>`).join("");
}

function renderGrid() {
  const grille = document.getElementById("grille");
  const foot = document.getElementById("grille-foot");
  if (!grille) return;
  if (state.loading && activeCards().length === 0) {
    grille.innerHTML = `<div class="grid">${skeletonTiles(12)}</div>`;
    if (foot) foot.innerHTML = "";
    return;
  }
  if (state.error && activeCards().length === 0) {
    grille.innerHTML = `<p class="empty">${esc(state.error)}</p>`;
    if (foot) foot.innerHTML = `<button class="btn" type="button" data-action="retry">Réessayer</button>`;
    return;
  }
  const shown = shownCards();
  if (!shown.length) {
    grille.innerHTML = `<p class="empty">Aucune carte ne correspond.</p>`;
    if (foot) foot.innerHTML = "";
    return;
  }
  grille.innerHTML = `<div class="grid">${shown.map(tileHTML).join("")}</div>`;
  const more = activeCards().length > shown.length;
  if (foot) {
    foot.innerHTML = more
      ? `<div class="foot-row"><button class="btn" type="button" data-action="more">Afficher les suivantes</button></div>`
      : "";
  }
}

function galleryHTML() {
  return `
    ${state.error ? `<p class="banner" role="alert">${esc(state.error)} <button class="btn" type="button" data-action="retry">Réessayer</button></p>` : ""}
    ${state.view === "set" ? heroHTML() : ""}
    ${toolbarHTML()}
    ${headHTML()}
    <div id="grille"></div>
    <div id="grille-foot"></div>`;
}

function extensionsHTML() {
  const series = orderedSeries();
  const seriesButtons = series.map((serie) => `
    <button type="button" data-series="${esc(serie.id)}" aria-pressed="${serie.id === state.browseSeriesId ? "true" : "false"}">${esc(prettyName(serie.name))}</button>
  `).join("");
  let body = `<p class="empty">Chargement des extensions…</p>`;
  if (!state.browseLoading) {
    if (!state.browseSets.length) {
      body = `<p class="empty">Aucune extension pour cette série.</p>`;
    } else {
      body = `<div class="sets">${state.browseSets.map((set) => `
        <button class="set-tile${set.id === state.setId ? " is-current" : ""}" type="button" data-set="${esc(set.id)}" data-series="${esc(state.browseSeriesId)}">
          <span class="logo">${logoTag(state.browseSeriesId, set.id)}</span>
          <span class="set-name">${esc(prettyName(set.name))}</span>
          <span class="set-count">${esc(countLine(set.cardCount))}</span>
        </button>`).join("")}</div>`;
    }
  }
  return `
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Séries</p>
          <h2>Toutes les extensions.</h2>
        </div>
        <p class="lede">Choisissez une série, puis une extension. La galerie suit la sélection.</p>
      </header>
      <div class="series-row">${seriesButtons || `<p class="empty">Chargement des séries…</p>`}</div>
      ${state.error ? `<p class="banner" role="alert">${esc(state.error)}</p>` : ""}
      ${body}
    </section>`;
}

function skeletonRanks(count) {
  return Array.from({ length: count }, () => `<div class="skel skel-rank"></div>`).join("");
}

function rankList(cards) {
  if (!cards.length) return `<p class="empty">Aucune cote pour le moment.</p>`;
  return `<ol class="ranks">${cards.map((card, index) => `
    <li>
      <button type="button" data-open="${esc(card.id)}" data-card="${esc(card.id)}">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="rank-art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", false)}</span>
        <span class="rank-copy">
          <span class="rank-name">${esc(prettyName(card.name))}</span>
          <span class="rank-meta" data-slot="meta">${esc(metaLine(card))}</span>
        </span>
        <span class="rank-val" data-slot="price">${priceHTML(card)}</span>
      </button>
    </li>`).join("")}</ol>`;
}

function hallHTML() {
  if (!state.iconicsReady) return skeletonRanks(4);
  if (!state.iconics.length) return `<p class="empty">Les cartes de référence sont indisponibles.</p>`;
  return rankList(state.iconics);
}

function quoteSample(cards) {
  const map = new Map();
  cards.slice(-24).forEach((card) => map.set(card.id, card));
  cards.slice(0, 6).forEach((card) => map.set(card.id, card));
  return [...map.values()].slice(0, 30);
}

function quoteHTML() {
  if (!state.quote) {
    return `<p class="lede">La lecture commence par la fin de la série, là où sortent souvent les cartes secrètes. 30 cartes maximum.</p>`;
  }
  const quote = state.quote;
  const progress = quote.total ? `${quote.done} sur ${quote.total}` : "";
  let status = `${quote.rows.length} carte${quote.rows.length > 1 ? "s" : ""} cotée${quote.rows.length > 1 ? "s" : ""}.`;
  if (quote.running) status = `Lecture des cotes… ${progress}`;
  else if (!quote.rows.length) status = "Aucune cote remontée pour cet échantillon.";
  return `
    <p class="note">${esc(status)}</p>
    ${quote.rows.length ? rankList(quote.rows) : ""}`;
}

function cotesHTML() {
  if (!isOr()) {
    return `
      <section class="panel or-gate">
        <p class="kicker">Aureum Or</p>
        <h2>Salle des cotes.</h2>
        <p class="lede">Le classement par tendance Cardmarket est réservé à l'abonnement.</p>
        <button class="btn solid" type="button" data-tab="or">Voir l'abonnement</button>
      </section>`;
  }
  const setName = prettyName(state.setDetail?.name || "l'extension");
  const running = Boolean(state.quote?.running);
  const label = running
    ? "Lecture des cotes…"
    : state.quote?.rows?.length
      ? "Relancer l'échantillon"
      : `Voir les cotes de ${setName}`;
  return `
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Référence</p>
          <h2>Salle des cotes.</h2>
        </div>
        <p class="lede">Huit cartes de référence, classées par tendance Cardmarket.</p>
      </header>
      <div id="hall">${hallHTML()}</div>
    </section>
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Extension ouverte</p>
          <h2>${esc(setName)}</h2>
        </div>
      </header>
      <button class="btn solid" id="quote-btn" type="button" data-action="quote"${running ? " disabled" : ""}>${esc(label)}</button>
      <div id="quote">${quoteHTML()}</div>
    </section>`;
}

function favorisHTML() {
  if (!state.favorites.length) {
    return `
      <div class="empty-state">
        <span class="mark lg" aria-hidden="true"></span>
        <h2>Le cabinet est vide.</h2>
        <p class="lede">Ouvrez une fiche, puis ajoutez la carte aux favoris. Elle reste dans ce navigateur.</p>
        <button class="btn solid" type="button" data-tab="galerie">Retour à la galerie</button>
      </div>`;
  }
  return `
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Cabinet</p>
          <h2>Favoris</h2>
        </div>
        <p class="lede">${isOr() ? "Les cartes épinglées restent dans ce navigateur." : "Trois favoris dans l'offre gratuite. Aureum Or enlève la limite."}</p>
      </header>
      <div class="grid fav-grid">${state.favorites.map((card) => `
        <article class="tile" data-card="${esc(card.id)}">
          <button class="tile-hit" type="button" data-open="${esc(card.id)}">
            <span class="art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", false)}</span>
            <span class="tile-name">${esc(prettyName(card.name))}</span>
            <span class="tile-meta" data-slot="meta">${esc(metaLine({ ...card, set: { name: card.setName } }))}</span>
            <span class="price-line" data-slot="price">${card.pricing || typeof card.trend === "number" ? priceHTML(card.pricing ? card : { pricing: { cardmarket: { trend: card.trend } } }) : `<span class="price-missing">Cote indisponible</span>`}</span>
          </button>
          <button class="btn unfav" type="button" data-action="unfav" data-id="${esc(card.id)}">Retirer</button>
        </article>`).join("")}</div>
    </section>`;
}

const SEALED_KINDS = [
  ["tous", "Tous"],
  ["etb", "ETB"],
  ["coffret", "Coffrets"],
  ["upc", "UPC"],
];

function sealedLabel(kind) {
  if (kind === "etb") return "ETB";
  if (kind === "upc") return "UPC";
  return "Coffret";
}

function sealedRows() {
  const q = state.sealedQuery.trim().toLowerCase();
  let rows = Array.isArray(state.sealed) ? state.sealed : [];
  if (state.sealedKind !== "tous") rows = rows.filter((item) => item.kind === state.sealedKind);
  if (q) {
    rows = rows.filter((item) => `${item.name} ${item.set}`.toLowerCase().includes(q));
  }
  const copy = rows.slice();
  if (state.sealedSort === "nom") copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  else if (state.sealedSort === "cote") copy.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));
  else copy.sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")) || a.name.localeCompare(b.name, "fr"));
  return copy;
}

function sealedStatus() {
  const total = sealedRows().length;
  if (!total) return "Aucun coffret ne correspond.";
  const shown = Math.min(state.sealedPage * PAGE_SIZE, total);
  const when = formatDay(state.sealedAsOf ? `${state.sealedAsOf}T12:00:00` : "");
  const date = when ? `, relevées le ${when}` : "";
  return `${shown} sur ${total}. Cotes TCGPlayer en dollars${date}.`;
}

function sealedTiles() {
  const rows = sealedRows().slice(0, state.sealedPage * PAGE_SIZE);
  if (!rows.length) return `<p class="note">Aucun coffret pour ce filtre.</p>`;
  return rows.map((item) => {
    const bits = [sealedLabel(item.kind)];
    if (item.set) bits.push(item.set);
    const day = formatDay(item.released ? `${item.released}T12:00:00` : "");
    if (day) bits.push(day);
    const price = usdHTML(item.usd);
    return `
      <article class="tile">
        <div class="tile-hit">
          <span class="art is-box" data-label="${esc(sealedLabel(item.kind))}">
            <img src="https://tcgplayer-cdn.tcgplayer.com/product/${esc(item.id)}_in_400x400.jpg" alt="${esc(item.name)}" loading="lazy" decoding="async">
          </span>
          <span class="tile-name">${esc(item.name)}</span>
          <span class="tile-meta">${esc(bits.join(" · "))}</span>
          <span class="price-line">${price}</span>
        </div>
      </article>`;
  }).join("");
}

function sealedMore() {
  const total = sealedRows().length;
  if (state.sealedPage * PAGE_SIZE >= total) return "";
  return `<button class="btn" type="button" data-sealed="more">Afficher les suivantes</button>`;
}

function paintSealed() {
  const grid = document.getElementById("sealed-grid");
  const status = document.getElementById("sealed-status");
  const foot = document.getElementById("sealed-foot");
  if (!grid || !status || !foot) {
    render();
    return;
  }
  grid.innerHTML = sealedTiles();
  status.textContent = sealedStatus();
  foot.innerHTML = sealedMore();
}

function etbHTML() {
  if (!state.sealed) {
    const note = state.sealedError
      ? `${esc(state.sealedError)} <button class="btn" type="button" data-action="sealed-retry">Réessayer</button>`
      : "Ouverture des coffrets…";
    return `
      <section class="panel">
        <header class="section-head">
          <div>
            <p class="kicker">Scellés</p>
            <h2>ETB, coffrets et UPC</h2>
          </div>
        </header>
        <p class="note">${note}</p>
      </section>`;
  }
  const counts = { tous: state.sealed.length, etb: 0, coffret: 0, upc: 0 };
  state.sealed.forEach((item) => {
    if (counts[item.kind] != null) counts[item.kind] += 1;
  });
  const filters = SEALED_KINDS.map(([id, label]) => `
    <button type="button" data-sealed="kind" data-kind="${id}" aria-pressed="${state.sealedKind === id ? "true" : "false"}">${label} ${counts[id]}</button>`).join("");
  return `
    <section class="panel" id="sealed">
      <header class="section-head">
        <div>
          <p class="kicker">Scellés</p>
          <h2>ETB, coffrets et UPC</h2>
        </div>
        <p class="lede" id="sealed-status">${esc(sealedStatus())}</p>
      </header>
      <div class="sealed-bar">
        <div class="series-row" role="group" aria-label="Type de coffret">${filters}</div>
        <div class="sealed-tools">
          <label class="sr-only" for="sealed-q">Filtrer les coffrets</label>
          <input id="sealed-q" type="search" placeholder="Nom d'un coffret" value="${esc(state.sealedQuery)}" autocomplete="off" enterkeyhint="search">
          <label class="sr-only" for="sealed-sort">Tri</label>
          <select id="sealed-sort" aria-label="Tri">
            <option value="recent"${state.sealedSort === "recent" ? " selected" : ""}>Plus récents</option>
            <option value="cote"${state.sealedSort === "cote" ? " selected" : ""}>Cote</option>
            <option value="nom"${state.sealedSort === "nom" ? " selected" : ""}>Nom</option>
          </select>
        </div>
      </div>
      <div class="grid" id="sealed-grid">${sealedTiles()}</div>
      <div class="foot-row" id="sealed-foot">${sealedMore()}</div>
    </section>`;
}

async function loadSealed() {
  if (state.sealed || state.sealedLoading) return;
  state.sealedLoading = true;
  state.sealedError = "";
  if (state.tab === "etb") render();
  try {
    const response = await fetch("./sealed.json");
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    state.sealed = Array.isArray(data.products) ? data.products : [];
    state.sealedAsOf = typeof data.asOf === "string" ? data.asOf : "";
    state.sealedError = "";
  } catch {
    state.sealedError = "Les coffrets n'ont pas pu être chargés.";
  } finally {
    state.sealedLoading = false;
    if (state.tab === "etb") render();
  }
}

const UNIVERS_KINDS = [
  ["tous", "Tous"],
  ["jeu", "Jeux"],
  ["pack", "Packs"],
  ["peluche", "Peluches"],
  ["figurine", "Figurines"],
  ["jouet", "Jouets"],
];

function universLabel(kind) {
  return { jeu: "Jeu", pack: "Pack", peluche: "Peluche", figurine: "Figurine", jouet: "Jouet" }[kind] || "Univers";
}

function releasedLabel(value) {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
  }
  return formatDay(`${value}T12:00:00`);
}

function universRows() {
  const q = state.universQuery.trim().toLowerCase();
  let rows = Array.isArray(state.univers) ? state.univers : [];
  if (state.universKind !== "tous") rows = rows.filter((item) => item.kind === state.universKind);
  if (q) rows = rows.filter((item) => `${item.name} ${item.set}`.toLowerCase().includes(q));
  const copy = rows.slice();
  const key = (item) => item.released || "9999";
  if (state.universSort === "nom") copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  else if (state.universSort === "cote") copy.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));
  else if (state.universSort === "recent") copy.sort((a, b) => key(b).localeCompare(key(a)) || a.name.localeCompare(b.name, "fr"));
  else copy.sort((a, b) => key(a).localeCompare(key(b)) || a.name.localeCompare(b.name, "fr"));
  return copy;
}

function universStatus() {
  const total = universRows().length;
  if (!total) return "Aucun résultat pour ce filtre.";
  const shown = Math.min(state.universPage * PAGE_SIZE, total);
  return `${shown} sur ${total}. Les boosters sont cotés en dollars TCGPlayer. Le reste est recensé sans cote unitaire.`;
}

function universTiles() {
  const rows = universRows().slice(0, state.universPage * PAGE_SIZE);
  if (!rows.length) return `<p class="note">Aucun résultat pour ce filtre.</p>`;
  return rows.map((item) => {
    const bits = [universLabel(item.kind)];
    if (item.set) bits.push(item.set);
    const day = releasedLabel(item.released);
    if (day) bits.push(day);
    const price = usdHTML(item.usd);
    const art = /^\d+$/.test(String(item.id))
      ? `<img src="https://tcgplayer-cdn.tcgplayer.com/product/${esc(item.id)}_in_400x400.jpg" alt="${esc(item.name)}" loading="lazy" decoding="async">`
      : `<span class="monogram" data-label="${esc(initials(item.name))}">${esc(initials(item.name))}</span>`;
    return `
      <article class="tile">
        <div class="tile-hit">
          <span class="art is-box" data-label="${esc(universLabel(item.kind))}">${art}</span>
          <span class="tile-name">${esc(item.name)}</span>
          <span class="tile-meta">${esc(bits.join(" · "))}</span>
          <span class="price-line">${price}</span>
        </div>
      </article>`;
  }).join("");
}

function universMore() {
  if (state.universPage * PAGE_SIZE >= universRows().length) return "";
  return `<button class="btn" type="button" data-univers="more">Afficher les suivantes</button>`;
}

function paintUnivers() {
  const grid = document.getElementById("univers-grid");
  const status = document.getElementById("univers-status");
  const foot = document.getElementById("univers-foot");
  if (!grid || !status || !foot) {
    render();
    return;
  }
  grid.innerHTML = universTiles();
  status.textContent = universStatus();
  foot.innerHTML = universMore();
}

function universHTML() {
  if (!state.univers) {
    const note = state.universError
      ? `${esc(state.universError)} <button class="btn" type="button" data-action="univers-retry">Réessayer</button>`
      : "Ouverture de l'univers…";
    return `
      <section class="panel">
        <header class="section-head">
          <div>
            <p class="kicker">Depuis 1996</p>
            <h2>Jeux, packs et jouets</h2>
          </div>
        </header>
        <p class="note">${note}</p>
      </section>`;
  }
  const counts = { tous: state.univers.length, jeu: 0, pack: 0, peluche: 0, figurine: 0, jouet: 0 };
  state.univers.forEach((item) => {
    if (counts[item.kind] != null) counts[item.kind] += 1;
  });
  const filters = UNIVERS_KINDS.map(([id, label]) => `
    <button type="button" data-univers="kind" data-kind="${id}" aria-pressed="${state.universKind === id ? "true" : "false"}">${label} ${counts[id]}</button>`).join("");
  return `
    <section class="panel" id="univers">
      <header class="section-head">
        <div>
          <p class="kicker">Depuis 1996</p>
          <h2>Jeux, packs et jouets</h2>
        </div>
        <p class="lede" id="univers-status">${esc(universStatus())}</p>
      </header>
      <p class="note">Pokémon commence le 27 février 1996 au Japon, avec Rouge et Vert. Jaune sort le 12 septembre 1998. Les peluches, figurines et jouets sont les grandes gammes, pas chaque modèle.</p>
      <div class="sealed-bar">
        <div class="series-row" role="group" aria-label="Famille">${filters}</div>
        <div class="sealed-tools">
          <label class="sr-only" for="univers-q">Filtrer l'univers</label>
          <input id="univers-q" type="search" placeholder="Nom d'un jeu ou d'un jouet" value="${esc(state.universQuery)}" autocomplete="off" enterkeyhint="search">
          <label class="sr-only" for="univers-sort">Tri</label>
          <select id="univers-sort" aria-label="Tri">
            <option value="ancien"${state.universSort === "ancien" ? " selected" : ""}>Plus anciens</option>
            <option value="recent"${state.universSort === "recent" ? " selected" : ""}>Plus récents</option>
            <option value="cote"${state.universSort === "cote" ? " selected" : ""}>Cote</option>
            <option value="nom"${state.universSort === "nom" ? " selected" : ""}>Nom</option>
          </select>
        </div>
      </div>
      <div class="grid" id="univers-grid">${universTiles()}</div>
      <div class="foot-row" id="univers-foot">${universMore()}</div>
    </section>`;
}

async function loadUnivers() {
  if (state.univers || state.universLoading) return;
  state.universLoading = true;
  state.universError = "";
  if (state.tab === "univers") render();
  try {
    const response = await fetch("./univers.json");
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    state.univers = Array.isArray(data.products) ? data.products : [];
    state.universAsOf = typeof data.asOf === "string" ? data.asOf : "";
    state.universError = "";
  } catch {
    state.universError = "L'univers Pokémon n'a pas pu être chargé.";
  } finally {
    state.universLoading = false;
    if (state.tab === "univers") render();
  }
}


function orHTML() {
  const href = stripeHref(OR_LINK);
  const portal = stripeHref(OR_PORTAL);
  if (subscribed()) {
    return `
      <section class="panel or-page">
        <p class="kicker">Aureum Or</p>
        <h2>Abonnement actif.</h2>
        <p class="lede">Les cotes, la salle, les scellés et les favoris illimités sont ouverts sur cet appareil.</p>
        ${portal ? `<a class="btn" href="${esc(portal)}">Gérer l'abonnement</a>` : `<p class="hint">Pour arrêter, ouvrez le lien dans le reçu Stripe.</p>`}
      </section>`;
  }
  const pay = href
    ? `<a class="btn solid" href="${esc(href)}">S'abonner avec Stripe</a>`
    : `<p class="note">Paiement Stripe en préparation.</p>`;
  return `
    <section class="panel or-page">
      <p class="kicker">Abonnement</p>
      <h2>Aureum Or</h2>
      <p class="or-price">4,90 € <small>/ mois</small></p>
      <p class="lede">Le catalogue reste gratuit. Or ouvre les cotes et le cabinet sans limite.</p>
      <ul class="or-list">
        <li>Toutes les cotes Cardmarket en euros, et la variation sur 30 jours</li>
        <li>La salle des cotes</li>
        <li>Les cotes des ETB, des coffrets et des UPC</li>
        <li>Les cotes des boosters</li>
        <li>Favoris illimités</li>
        <li>Le scan en grand dans la fiche</li>
      </ul>
      <p class="hint">Gratuit : le catalogue, les images, les fiches, l'univers, trois favoris, et les trois cartes de la une avec leur cote.</p>
      ${pay}
      <p class="hint">Paiement traité par Stripe. Aureum ne reçoit pas le numéro de carte. L'accès s'ouvre sur l'appareil qui revient du paiement.</p>
    </section>`;
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  if (state.tab === "galerie") app.innerHTML = galleryHTML();
  else if (state.tab === "extensions") app.innerHTML = extensionsHTML();
  else if (state.tab === "etb") app.innerHTML = etbHTML();
  else if (state.tab === "univers") app.innerHTML = universHTML();
  else if (state.tab === "cotes") app.innerHTML = cotesHTML();
  else if (state.tab === "or") app.innerHTML = orHTML();
  else app.innerHTML = favorisHTML();
  if (state.tab === "galerie") renderGrid();
  updateFavCount();
}

function setTab(tab) {
  rememberTab(tab);
  render();
  window.scrollTo(0, 0);
  if (tab === "extensions") selectSeries(state.browseSeriesId);
  if (tab === "favoris") refreshFavs();
  if (tab === "etb") loadSealed();
  if (tab === "univers") loadUnivers();
}

async function loadIconics() {
  const results = await Promise.all(ICONIC_IDS.map(async (id) => {
    try {
      return await getCard(id);
    } catch {
      return null;
    }
  }));
  state.iconics = results.filter(Boolean).sort((a, b) => trendOf(b) - trendOf(a));
  state.iconicsReady = true;
  const slot = document.getElementById("fan-slot");
  if (slot) slot.innerHTML = fanInner();
  const live = document.querySelector(".live");
  if (live) live.outerHTML = liveLine();
  const hall = document.getElementById("hall");
  if (hall) hall.innerHTML = hallHTML();
}

async function loadSet(seriesId, setId, { focus = true } = {}) {
  const token = ++epoch;
  const safeSeries = cleanId(seriesId, "me");
  const safeSet = cleanId(setId, "me05");
  clearQueryBox();
  state.view = "set";
  state.loading = true;
  state.error = "";
  state.page = 1;
  state.sort = "numero";
  state.setCards = [];
  state.setDetail = null;
  if (safeSeries !== state.gallerySeriesId) state.gallerySets = [];
  state.gallerySeriesId = safeSeries;
  state.setId = safeSet;
  state.browseSeriesId = safeSeries;
  if (focus) rememberTab("galerie");
  if (state.tab === "galerie") render();
  try {
    const [sets, detail] = await Promise.all([
      ensureSeriesSets(safeSeries),
      fetchJSON(`/sets/${encodeURIComponent(safeSet)}`),
    ]);
    if (token !== epoch) return;
    state.gallerySets = sets;
    state.browseSets = sets;
    state.setDetail = detail;
    state.setCards = Array.isArray(detail.cards) ? detail.cards : [];
    state.loading = false;
    rememberContext();
    render();
    hydrateShown(token);
  } catch {
    if (token !== epoch) return;
    state.loading = false;
    state.error = "Impossible de charger cette extension.";
    render();
  }
}

async function runSearch(raw) {
  const query = String(raw || "").trim();
  state.query = query;
  const clear = document.getElementById("clear-q");
  if (clear) clear.hidden = query.length === 0;
  if (query.length < 2) {
    if (state.view === "search") loadSet(state.gallerySeriesId, state.setId);
    return;
  }
  const token = ++epoch;
  state.view = "search";
  state.page = 1;
  state.sort = "cote";
  state.loading = true;
  state.error = "";
  state.searchCards = [];
  state.searchTotal = 0;
  rememberTab("galerie");
  render();
  try {
    const list = await fetchJSON(`/cards?name=${encodeURIComponent(query)}`);
    if (token !== epoch) return;
    const rows = Array.isArray(list) ? list : [];
    state.searchTotal = rows.length;
    state.searchCards = rows.slice(0, 48);
    state.loading = false;
    render();
    hydrateShown(token);
  } catch {
    if (token !== epoch) return;
    state.loading = false;
    state.error = "La recherche n'a pas abouti.";
    render();
  }
}

function cardsToHydrate() {
  const source = state.view === "search" ? activeCards() : shownCards();
  return source.filter((card) => card?.id);
}

async function hydrateShown(token) {
  const slice = cardsToHydrate();
  slice.forEach((card) => {
    if (cache.has(card.id)) patchCard(cache.get(card.id));
  });
  const missing = slice.filter((card) => !cache.has(card.id));
  if (!missing.length) {
    if (state.sort === "cote" && token === epoch) {
      const y = window.scrollY;
      renderGrid();
      window.scrollTo(0, y);
    }
    return;
  }
  setNote("Lecture des cotes…");
  await pool(missing, 5, async (brief) => {
    if (token !== epoch) return;
    try {
      const full = await getCard(brief.id);
      if (token !== epoch) return;
      patchCard(full);
    } catch {
      /* Une carte sans cote ne bloque pas les autres. */
    }
  });
  if (token !== epoch) return;
  setNote("");
  if (state.sort === "cote") {
    const y = window.scrollY;
    renderGrid();
    window.scrollTo(0, y);
  }
}

async function selectSeries(seriesId) {
  const id = cleanId(seriesId, state.browseSeriesId);
  state.browseSeriesId = id;
  if (setsCache.has(id)) {
    state.browseSets = await ensureSeriesSets(id);
    state.browseLoading = false;
    if (state.tab === "extensions") render();
    return;
  }
  state.browseLoading = true;
  state.error = "";
  if (state.tab === "extensions") render();
  try {
    state.browseSets = await ensureSeriesSets(id);
    state.browseLoading = false;
  } catch {
    state.browseSets = [];
    state.browseLoading = false;
    state.error = "Impossible de charger les extensions de cette série.";
  }
  if (state.tab === "extensions") render();
}

async function quoteSet() {
  if (!state.setCards.length || state.quote?.running) return;
  const token = ++quoteToken;
  const sample = quoteSample(state.setCards);
  state.quote = { running: true, done: 0, total: sample.length, rows: [] };
  paintQuote();
  await pool(sample, 5, async (brief) => {
    if (token !== quoteToken) return;
    try {
      const full = await getCard(brief.id);
      if (token !== quoteToken) return;
      state.quote.rows.push(full);
      state.quote.rows.sort((a, b) => trendOf(b) - trendOf(a));
    } catch {
      /* On continue l'échantillon. */
    }
    if (token !== quoteToken) return;
    state.quote.done += 1;
    paintQuote();
  });
  if (token !== quoteToken) return;
  state.quote.running = false;
  paintQuote();
}

function paintQuote() {
  const root = document.getElementById("quote");
  const button = document.getElementById("quote-btn");
  if (button) {
    const running = Boolean(state.quote?.running);
    const setName = prettyName(state.setDetail?.name || "l'extension");
    button.disabled = running;
    button.textContent = running
      ? "Lecture des cotes…"
      : state.quote?.rows?.length
        ? "Relancer l'échantillon"
        : `Voir les cotes de ${setName}`;
  }
  if (root) root.innerHTML = quoteHTML();
}

async function refreshFavs() {
  const token = ++favEpoch;
  await pool(state.favorites, 4, async (fav) => {
    try {
      const full = await getCard(fav.id);
      if (token !== favEpoch) return;
      touchFav(full);
      patchCard(full);
    } catch {
      /* Le favori reste affiché avec sa dernière cote. */
    }
  });
}

function labelVariant(variant) {
  const stamps = Array.isArray(variant.stamp) ? variant.stamp.join(", ") : "";
  return [variant.type, variant.subtype, stamps].filter(Boolean).join(" · ");
}

function bestVariant(card) {
  const list = Array.isArray(card.variants_detailed) ? card.variants_detailed : [];
  return list.reduce((best, variant) => {
    const trend = variant.pricing?.cardmarket?.trend;
    if (typeof trend !== "number") return best;
    if (!best || trend > best.pricing.cardmarket.trend) return variant;
    return best;
  }, null);
}

function duoHTML(card) {
  const ref = card.pricing?.cardmarket;
  const best = bestVariant(card);
  const refTrend = typeof ref?.trend === "number" ? ref.trend : null;
  const bestTrend = typeof best?.pricing?.cardmarket?.trend === "number" ? best.pricing.cardmarket.trend : null;
  if (refTrend == null && bestTrend == null) {
    return `<p class="price-missing">Cote indisponible pour ce tirage.</p>`;
  }
  if (!isOr()) {
    return `
      <article>
        <span>Tendance</span>
        <strong class="price-lock">Or</strong>
      </article>`;
  }
  const showDuo = refTrend != null && bestTrend != null && bestTrend > refTrend * 1.15;
  if (!showDuo) {
    const amount = refTrend ?? bestTrend;
    const delta = deltaInfo(card);
    return `
      <article>
        <span>Tendance</span>
        <strong>${esc(eur(amount))}</strong>
        ${delta ? `<span class="delta ${delta.dir}">${esc(formatPct(delta.pct))}<span class="delta-hint"> vs 30 j</span></span>` : ""}
      </article>`;
  }
  return `
    <article>
      <span>Tirage de référence</span>
      <strong>${esc(eur(refTrend))}</strong>
    </article>
    <article class="hi">
      <span>${esc(labelVariant(best))}</span>
      <strong>${esc(eur(bestTrend))}</strong>
    </article>`;
}

function statsHTML(card) {
  if (!isOr()) return "";
  const prices = card.pricing?.cardmarket;
  if (!prices) return "";
  const rows = [
    ["Moyenne", prices.avg],
    ["Prix bas", prices.low],
    ["Moyenne 7 j", prices.avg7],
    ["Moyenne 30 j", prices.avg30],
  ].filter((row) => typeof row[1] === "number");
  if (!rows.length) return "";
  return `<dl class="stats">${rows.map(([label, amount]) => `<div><dt>${esc(label)}</dt><dd>${esc(eur(amount))}</dd></div>`).join("")}</dl>`;
}

function variantsHTML(card) {
  const list = Array.isArray(card.variants_detailed) ? card.variants_detailed : [];
  if (!list.length) return "";
  const rows = list
    .map((variant) => ({ variant, trend: variant.pricing?.cardmarket?.trend, low: variant.pricing?.cardmarket?.low }))
    .sort((a, b) => (typeof b.trend === "number" ? b.trend : -1) - (typeof a.trend === "number" ? a.trend : -1))
    .slice(0, 8);
  return `
    <h3>Variantes et tirages</h3>
    <table class="variants">
      <thead><tr><th>Tirage</th><th>Prix bas</th><th>Tendance</th></tr></thead>
      <tbody>
        ${rows.map(({ variant, trend, low }) => `
          <tr>
            <td>${esc(labelVariant(variant) || "Tirage")}</td>
            <td>${typeof low === "number" ? (isOr() ? esc(eur(low)) : `<span class="price-lock">Or</span>`) : "—"}</td>
            <td>${typeof trend === "number" ? (isOr() ? esc(eur(trend)) : `<span class="price-lock">Or</span>`) : "Cote indisponible"}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function pips(costs) {
  if (!Array.isArray(costs) || !costs.length) return "";
  return `<span class="pips">${costs.map((cost) => `<span class="pip" style="--c:${typeColor(cost)}" title="${esc(cost)}"><span class="sr-only">${esc(cost)}</span></span>`).join("")}</span>`;
}

function attacksHTML(card) {
  const abilities = Array.isArray(card.abilities) ? card.abilities : [];
  const attacks = Array.isArray(card.attacks) ? card.attacks : [];
  if (!abilities.length && !attacks.length) return "";
  const abilityBlock = abilities.map((ability) => `
    <article class="attack">
      <header><strong>${esc(ability.name || "Pouvoir")}</strong><span>${esc(ability.type || "")}</span></header>
      <p class="hint">${esc(ability.effect || "")}</p>
    </article>`).join("");
  const attackBlock = attacks.map((attack) => `
    <article class="attack">
      <header>
        <strong>${pips(attack.cost)}${attack.cost?.length ? " " : ""}${esc(attack.name || "Attaque")}</strong>
        ${attack.damage ? `<span class="dmg">${esc(String(attack.damage))}</span>` : ""}
      </header>
      ${attack.effect ? `<p class="hint">${esc(attack.effect)}</p>` : ""}
    </article>`).join("");
  return `<h3>Attaques</h3>${abilityBlock}${attackBlock}`;
}

function combatHTML(card) {
  const bits = [];
  if (Array.isArray(card.weaknesses) && card.weaknesses.length) {
    bits.push(`Faiblesse : ${card.weaknesses.map((item) => `${item.type || ""} ${item.value || ""}`.trim()).join(", ")}`);
  }
  if (Array.isArray(card.resistances) && card.resistances.length) {
    bits.push(`Résistance : ${card.resistances.map((item) => `${item.type || ""} ${item.value || ""}`.trim()).join(", ")}`);
  }
  if (typeof card.retreat === "number") bits.push(`Retraite : ${card.retreat}`);
  if (!bits.length) return "";
  return `<p class="hint">${esc(bits.join(" · "))}</p>`;
}

function legalHTML(legal) {
  if (!legal) return "";
  const bits = [];
  if (legal.standard) bits.push("Standard");
  if (legal.expanded) bits.push("Étendu");
  return bits.length ? bits.join(" · ") : "Hors format actuel";
}

function ficheHTML(card) {
  const types = Array.isArray(card.types) ? card.types : [];
  const when = formatDay(card.pricing?.cardmarket?.updated);
  const favOn = isFav(card.id);
  return `
    <article class="fiche">
      <button class="close" type="button" data-action="close">Fermer</button>
      <div class="fiche-art">
        <div class="stage" data-tilt data-label="${esc(initials(card.name))}">
          ${imgTag(card, isOr() ? "high" : "low", true)}
          <span class="shine" aria-hidden="true"></span>
        </div>
      </div>
      <div class="fiche-body">
        <p class="kicker">${esc(metaLine(card))}</p>
        <h2>${esc(prettyName(card.name))}</h2>
        <div class="identity">
          ${types.map((type) => `<span class="type-pill" style="--c:${typeColor(type)}">${esc(type)}</span>`).join("")}
          ${card.hp ? `<span class="hp">${esc(String(card.hp))} PV</span>` : ""}
          ${card.stage ? `<span class="legal">${esc(card.stage)}</span>` : ""}
          ${legalHTML(card.legal) ? `<span class="legal">${esc(legalHTML(card.legal))}</span>` : ""}
        </div>
        ${card.evolveFrom ? `<p class="hint">Évolue de ${esc(card.evolveFrom)}</p>` : ""}
        ${card.description ? `<blockquote class="flavor">${esc(card.description)}</blockquote>` : ""}
        <div class="duo">${duoHTML(card)}</div>
        ${isOr() && (trendOf(card) >= 0 || bestVariant(card)) ? `<p class="hint">Montant principal : tirage de référence. Le détail distingue les éditions.</p>` : ""}
        ${!isOr() && (trendOf(card) >= 0 || bestVariant(card)) ? `<button class="btn solid" type="button" data-tab="or">Voir la cote avec Aureum Or</button>` : ""}
        ${isOr() && when ? `<p class="hint">Mise à jour le ${esc(when)}.</p>` : ""}
        ${statsHTML(card)}
        ${variantsHTML(card)}
        ${combatHTML(card)}
        ${attacksHTML(card)}
        ${card.illustrator ? `<p class="hint">Illustré par ${esc(card.illustrator)}.</p>` : ""}
        ${Array.isArray(card.dexId) && card.dexId.length ? `<p class="hint">Pokédex n° ${esc(card.dexId.join(", "))}</p>` : ""}
        <div class="fiche-actions">
          <button class="btn solid" type="button" data-action="fav" data-id="${esc(card.id)}" aria-pressed="${favOn ? "true" : "false"}">${favOn ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
        </div>
        <p class="hint">${isOr() ? "Cote indicative Cardmarket, pas une offre d'achat." : "Le grand scan et les montants sont dans Aureum Or."}</p>
      </div>
    </article>`;
}

function fichePending() {
  return `<div class="pending">Ouverture de la fiche…</div>`;
}

async function openFiche(id) {
  const safe = cleanId(id, "");
  if (!safe) return;
  const dialog = document.getElementById("fiche");
  dialog.dataset.current = safe;
  dialog.innerHTML = fichePending();
  if (!dialog.open) dialog.showModal();
  try {
    const card = await getCard(safe);
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = ficheHTML(card);
    touchFav(card);
  } catch {
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = `<div class="fiche-error"><p>Impossible d'ouvrir cette fiche.</p><button class="btn" type="button" data-action="close">Fermer</button></div>`;
  }
}

function toggleFav(id) {
  const card = cache.get(id) || state.favorites.find((item) => item.id === id) || activeCards().find((item) => item.id === id);
  if (!card) return;
  if (isFav(id)) state.favorites = state.favorites.filter((item) => item.id !== id);
  else if (!isOr() && state.favorites.length >= FREE_FAVS) {
    const dialog = document.getElementById("fiche");
    if (dialog?.open) dialog.close();
    setTab("or");
    return;
  } else state.favorites.unshift(snapshot(card));
  saveFavs();
  const button = document.querySelector("#fiche [data-action='fav']");
  if (button && button.dataset.id === id) {
    const on = isFav(id);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.textContent = on ? "Retirer des favoris" : "Ajouter aux favoris";
  }
  if (state.tab === "favoris") render();
}

function bind() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("q");
  const clear = document.getElementById("clear-q");
  const dialog = document.getElementById("fiche");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(searchTimer);
    runSearch(input.value);
  });

  input.addEventListener("input", () => {
    clear.hidden = input.value.trim().length === 0;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(input.value), 280);
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "sealed-q") {
      state.sealedQuery = event.target.value;
      state.sealedPage = 1;
      paintSealed();
    }
    if (event.target.id === "univers-q") {
      state.universQuery = event.target.value;
      state.universPage = 1;
      paintUnivers();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "sealed-sort") {
      state.sealedSort = event.target.value;
      state.sealedPage = 1;
      paintSealed();
    }
    if (event.target.id === "univers-sort") {
      state.universSort = event.target.value;
      state.universPage = 1;
      paintUnivers();
    }
  });

  clear.addEventListener("click", () => {
    input.value = "";
    clear.hidden = true;
    clearTimeout(searchTimer);
    if (state.view === "search") loadSet(state.gallerySeriesId, state.setId);
    else state.query = "";
    input.focus();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    const setEl = event.target.closest("[data-set]");
    const seriesEl = event.target.closest("[data-series]");
    const tabEl = event.target.closest("[data-tab]");
    const sealedEl = event.target.closest("[data-sealed]");
    const universEl = event.target.closest("[data-univers]");
    const openEl = event.target.closest("[data-open]");
    if (sealedEl) {
      if (sealedEl.dataset.sealed === "kind") {
        state.sealedKind = sealedEl.dataset.kind || "tous";
        state.sealedPage = 1;
        render();
      }
      if (sealedEl.dataset.sealed === "more") {
        state.sealedPage += 1;
        paintSealed();
      }
    }
    if (universEl) {
      if (universEl.dataset.univers === "kind") {
        state.universKind = universEl.dataset.kind || "tous";
        state.universPage = 1;
        render();
      }
      if (universEl.dataset.univers === "more") {
        state.universPage += 1;
        paintUnivers();
      }
    }

    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === "close") dialog.close();
      if (action === "more") {
        state.page += 1;
        renderGrid();
        hydrateShown(epoch);
      }
      if (action === "retry") {
        if (state.view === "search") runSearch(state.query);
        else loadSet(state.gallerySeriesId, state.setId);
      }
      if (action === "quote") quoteSet();
      if (action === "sealed-retry") {
        state.sealed = null;
        state.sealedLoading = false;
        state.sealedError = "";
        loadSealed();
      }
      if (action === "univers-retry") {
        state.univers = null;
        state.universLoading = false;
        state.universError = "";
        loadUnivers();
      }
      if (action === "fav") toggleFav(actionEl.dataset.id);
      if (action === "unfav") {
        state.favorites = state.favorites.filter((item) => item.id !== actionEl.dataset.id);
        saveFavs();
        render();
      }
      if (action === "random") {
        const poolCards = state.setCards.length ? state.setCards : activeCards();
        if (!poolCards.length) return;
        const pick = poolCards[Math.floor(Math.random() * poolCards.length)];
        openFiche(pick.id);
      }
      if (action === "jump") {
        document.getElementById("grille-titre")?.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "start" });
      }
      return;
    }

    if (setEl) {
      clearTimeout(searchTimer);
      loadSet(setEl.dataset.series || state.browseSeriesId, setEl.dataset.set);
      return;
    }

    if (seriesEl) {
      selectSeries(seriesEl.dataset.series);
      return;
    }

    if (tabEl) {
      const dialogBox = document.getElementById("fiche");
      if (dialogBox?.open) dialogBox.close();
      if (tabEl.dataset.reset && state.view === "search") {
        clearTimeout(searchTimer);
        loadSet(state.gallerySeriesId, state.setId);
        return;
      }
      setTab(tabEl.dataset.tab);
      return;
    }

    if (openEl) openFiche(openEl.dataset.open);
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "set-select") {
      clearTimeout(searchTimer);
      loadSet(state.gallerySeriesId, event.target.value);
    }
    if (event.target.id === "sort-select") {
      state.sort = event.target.value;
      state.page = 1;
      renderGrid();
      if (state.sort === "cote") hydrateShown(epoch);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (dialog.open) return;
    event.preventDefault();
    input.focus();
  });

  document.addEventListener("pointermove", (event) => {
    if (!motionOK) return;
    const stage = event.target.closest?.("[data-tilt]");
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    stage.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    stage.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    stage.style.setProperty("--mx", `${x * 100}%`);
    stage.style.setProperty("--my", `${y * 100}%`);
  });

  document.addEventListener("pointerout", (event) => {
    const stage = event.target.closest?.("[data-tilt]");
    if (!stage || stage.contains(event.relatedTarget)) return;
    stage.style.removeProperty("--rx");
    stage.style.removeProperty("--ry");
    stage.style.removeProperty("--mx");
    stage.style.removeProperty("--my");
  });

  document.addEventListener("load", (event) => {
    const img = event.target;
    if (img instanceof HTMLImageElement) img.classList.remove("is-trying");
  }, true);

  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    img.classList.add("is-trying");
    if (img.dataset.probing === "1") return;
    img.dataset.probing = "1";
    const queue = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    probeScans(img, queue);
  }, true);
}

async function recoverFromMarket(img) {
  try {
    const card = await getCard(img.dataset.id);
    const src = marketArt(card, img.dataset.quality === "high" ? "high" : "low");
    img.dataset.probing = "";
    if (!src || src === img.getAttribute("src")) {
      markBroken(img);
      return;
    }
    showScan(img, src);
  } catch {
    markBroken(img);
  }
}

function initialTab() {
  const hash = location.hash.replace("#", "");
  return TABS.includes(hash) ? hash : "galerie";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

function consumeReturn() {
  const params = new URLSearchParams(location.search);
  const abo = params.get("abo");
  if (abo === "succes") grantOr();
  if (!abo) return;
  const hash = location.hash && location.hash !== "#" ? location.hash : "#or";
  history.replaceState(null, "", `${location.pathname}${hash}`);
}

function boot() {
  bind();
  registerServiceWorker();
  consumeReturn();
  const context = readContext();
  state.gallerySeriesId = context.seriesId;
  state.setId = context.setId;
  state.browseSeriesId = context.seriesId;
  rememberTab(initialTab());
  render();
  if (state.tab === "etb") loadSealed();
  if (state.tab === "univers") loadUnivers();
  updateFavCount();
  fetchJSON("/series")
    .then((list) => {
      state.series = Array.isArray(list) ? list : [];
      if (state.tab === "extensions") render();
    })
    .catch(() => {});
  loadIconics();
  loadSet(state.gallerySeriesId, state.setId, { focus: state.tab === "galerie" });
  if (state.tab === "favoris") refreshFavs();
}

boot();
