const FAV_KEY = "aureum.favoris";
const CTX_KEY = "aureum.contexte";
const TABS = ["galerie", "extensions", "etb", "univers", "cotes", "favoris", "collection", "classeur"];
const COLL_KEY = "aureum.collection";
const COLL_MAX = 30;
const NOTE_MAX = 140;
const BINDER_KEY = "aureum.classeur";
const POCKETS = 9;
const PAGE_SIZE = 18;
const HERO_IDS = ["swsh7-215", "base1-4", "base1-2"];
const ICONIC_IDS = ["swsh7-215", "base1-4", "base1-2", "base1-15", "base1-10", "base1-6", "sv03.5-205", "base1-58"];
const HALL_IDS = [
  "swsh7-215", "neo4-107", "swsh7-218", "neo4-106", "neo4-109", "neo4-113",
  "base1-4", "sm115-9", "sv04.5-234", "swsh7-205", "swsh7-212", "swsh7-209",
  "me01-188", "base1-2", "base1-15", "xy12-11",
];
const DEAR_EUR = 200;
const SERIES_ORDER = ["me", "sv", "swsh", "sm", "xy", "bw", "hgss", "dp", "pl", "col", "pop", "ex", "neo", "ecard", "lc", "gym", "base", "tcgp", "mc", "tk", "misc", "PMCG", "VS", "web", "e", "ADV", "PCG", "L", "XYb", "SM", "S", "M", "SV"];
const MARKETS = {
  fr: { label: "France", currency: "EUR", currencyLabel: "Euros" },
  en: { label: "Anglais", currency: "USD", currencyLabel: "Dollars" },
  ja: { label: "Japonais", currency: "JPY", currencyLabel: "Yens" },
  de: { label: "Allemand", currency: "EUR", currencyLabel: "Euros" },
  es: { label: "Espagnol", currency: "EUR", currencyLabel: "Euros" },
  it: { label: "Italien", currency: "EUR", currencyLabel: "Euros" },
  pt: { label: "Portugais", currency: "EUR", currencyLabel: "Euros" },
};
const MARKET_KEY = "aureum.marche";

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
  Colorless: "#c9c1b4",
  Grass: "#7da86a",
  Fire: "#e07a45",
  Water: "#67aed4",
  Psychic: "#c58bb8",
  Fighting: "#c4845a",
  Darkness: "#8b7eaa",
  Metal: "#aeb6bd",
  Dragon: "#8d86c4",
  Fairy: "#e4a8c6",
  Pflanze: "#7da86a",
  Feuer: "#e07a45",
  Wasser: "#67aed4",
  Elektro: "#e2c15a",
  Psycho: "#c58bb8",
  Kampf: "#c4845a",
  Finsternis: "#8b7eaa",
  Metall: "#aeb6bd",
  Drache: "#8d86c4",
  Fee: "#e4a8c6",
  Farblos: "#c9c1b4",
  Planta: "#7da86a",
  Fuego: "#e07a45",
  Agua: "#67aed4",
  Rayo: "#e2c15a",
  Psíquico: "#c58bb8",
  Lucha: "#c4845a",
  Oscuridad: "#8b7eaa",
  Dragón: "#8d86c4",
  Hada: "#e4a8c6",
  Incoloro: "#c9c1b4",
  Erba: "#7da86a",
  Fuoco: "#e07a45",
  Acqua: "#67aed4",
  Lampo: "#e2c15a",
  Psico: "#c58bb8",
  Lotta: "#c4845a",
  Oscurità: "#8b7eaa",
  Metallo: "#aeb6bd",
  Drago: "#8d86c4",
  Folletto: "#e4a8c6",
  Incolore: "#c9c1b4",
  Fogo: "#e07a45",
  Água: "#67aed4",
  Raio: "#e2c15a",
  Escuridão: "#8b7eaa",
  Dragão: "#8d86c4",
  Fada: "#e4a8c6",
  "草": "#7da86a",
  "炎": "#e07a45",
  "水": "#67aed4",
  "雷": "#e2c15a",
  "超": "#c58bb8",
  "闘": "#c4845a",
  "悪": "#8b7eaa",
  "鋼": "#aeb6bd",
  "竜": "#8d86c4",
  "無色": "#c9c1b4",
};

const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const usdFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const cache = new Map();
const inflight = new Map();
const setsCache = new Map();

let epoch = 0;
let favEpoch = 0;
let visitEpoch = 0;
let collEpoch = 0;
let hallEpoch = 0;
let quoteToken = 0;
let searchTimer = 0;
const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadMarket() {
  try {
    const raw = JSON.parse(localStorage.getItem(MARKET_KEY) || "{}");
    const market = MARKETS[raw.market] ? raw.market : "fr";
    const local = MARKETS[market].currency;
    const currency = market === "fr" || local === "EUR" ? "EUR" : (raw.currency === local || raw.currency === "EUR" ? raw.currency : local);
    return { market, currency };
  } catch {
    return { market: "fr", currency: "EUR" };
  }
}

const savedMarket = loadMarket();

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
  favSort: "ajout",
  collection: loadCollection(),
  visit: null,
  shareNote: "",
  hallCards: [],
  hallOrder: [],
  hallLoading: false,
  hallFailed: false,
  coteMode: "tendance",
  binder: loadBinder(),
  binderSlot: null,
  binderQuery: "",
  binderHits: [],
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
  market: savedMarket.market,
  currency: savedMarket.currency,
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

let fxRates = null;
let fxPromise = null;
let marketToken = 0;

function saveMarket() {
  localStorage.setItem(MARKET_KEY, JSON.stringify({ market: state.market, currency: state.currency }));
}

function marketCurrency() {
  return MARKETS[state.market]?.currency || "EUR";
}

function activeCurrency() {
  if (state.market === "fr" || marketCurrency() === "EUR") return "EUR";
  return state.currency === marketCurrency() ? marketCurrency() : "EUR";
}

function loadFx() {
  if (fxRates && typeof fxRates.USD === "number" && typeof fxRates.JPY === "number") return Promise.resolve(fxRates);
  if (!fxPromise) {
    fxPromise = fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=USD,JPY")
      .then((response) => {
        if (!response.ok) throw new Error("fx");
        return response.json();
      })
      .then((data) => {
        fxRates = data?.rates || {};
        return fxRates;
      })
      .catch(() => {
        fxPromise = null;
        return {};
      });
  }
  return fxPromise;
}

function money(amount) {
  const code = activeCurrency();
  const rate = code === "EUR" ? 1 : fxRates?.[code];
  if (code === "EUR" || typeof rate !== "number") return eur(amount);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).format(amount * rate);
}

function moneyIsConverted() {
  const code = activeCurrency();
  return code !== "EUR" && typeof fxRates?.[code] === "number";
}

function priceModeNote() {
  if (state.market === "fr") return "";
  if (activeCurrency() === "EUR") return "Cote Cardmarket en euros.";
  const word = state.market === "ja" ? "yens" : "dollars";
  if (moneyIsConverted()) return `Environ, converti depuis la cote Cardmarket en euros. Pas une cote en ${word}.`;
  return "La conversion est indisponible. La cote reste en euros.";
}

function cacheKey(id, lang = state.market) {
  return `${lang || "fr"}:${id}`;
}

function apiRoot(lang = state.market) {
  return `https://api.tcgdex.net/v2/${lang || "fr"}`;
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

function priceHTML(card) {
  const prices = card?.pricing?.cardmarket;
  const amount = typeof prices?.trend === "number" ? prices.trend : typeof prices?.avg === "number" ? prices.avg : null;
  if (amount == null) return `<span class="price-missing">Cote indisponible</span>`;
  const delta = deltaInfo(card);
  const move = delta
    ? `<span class="delta ${delta.dir}">${esc(formatPct(delta.pct))}<span class="delta-hint"> vs 30 j</span></span>`
    : "";
  return `<span class="price">${esc(money(amount))}</span>${move}`;
}

function usdHTML(amount) {
  if (typeof amount !== "number") return `<span class="price-missing">Cote indisponible</span>`;
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

function revealScan(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.complete && img.naturalWidth > 0) img.classList.remove("is-trying", "is-broken");
}

function wakeScans(root = document) {
  root.querySelectorAll("img[src]").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.remove("is-trying", "is-broken");
      return;
    }
    if (!img.complete || img.dataset.woken === "1") return;
    img.dataset.woken = "1";
    img.classList.remove("is-trying");
    const queue = (img.dataset.fallbacks || "").split("|").filter(Boolean);
    if (queue.length || img.dataset.id) {
      img.dataset.probing = "1";
      probeScans(img, queue);
      return;
    }
    markBroken(img);
  });
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
  const quality = size === "high" ? "high" : "low";
  const urls = artCandidates(card.image, size);
  const edition = editionArt(card, quality);
  if (edition) urls.unshift(edition);
  if (!urls.length) {
    const market = marketArt(card, quality);
    if (market) urls.push(market);
  }
  const mark = esc(initials(card.name));
  if (!urls.length) return `<span class="monogram" data-label="${mark}">${mark}</span>`;
  const [src, ...rest] = urls;
  const priority = eager ? `fetchpriority="high"` : "";
  return `<img src="${esc(src)}" data-fallbacks="${esc(rest.join("|"))}" data-id="${esc(card.id || "")}" data-lang="${esc(card.lang || state.market)}" data-quality="${size === "high" ? "high" : "low"}" alt="${esc(prettyName(card.name))}" ${priority} decoding="async">`;
}

function logoTag(seriesId, setId) {
  const lang = state.market || "fr";
  const primary = `https://assets.tcgdex.net/${lang}/${seriesId}/${setId}/logo`;
  const fr = `https://assets.tcgdex.net/fr/${seriesId}/${setId}/logo`;
  const en = `https://assets.tcgdex.net/en/${seriesId}/${setId}/logo`;
  const rest = [primary + ".png", fr + ".webp", fr + ".png", en + ".webp", en + ".png", `https://assets.tcgdex.net/${lang}/${seriesId}/${setId}/symbol.png`];
  return `<img src="${esc(primary)}.webp" data-fallbacks="${esc([...new Set(rest)].join("|"))}" alt="">`;
}

function typeColor(type) {
  return TYPE_COLOR[type] || "#c6a15b";
}

function activeCards() {
  return state.view === "search" ? state.searchCards : state.setCards;
}

function resolveCard(card) {
  const key = cacheKey(card?.id, card?.lang || state.market);
  if (card?.id && cache.has(key)) return { ...card, ...cache.get(key) };
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

async function fetchJSON(path, lang = state.market) {
  const response = await fetch(apiRoot(lang) + path);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function getCard(id, lang = state.market) {
  const key = cacheKey(id, lang);
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);
  const pending = fetchJSON(`/cards/${encodeURIComponent(id)}`, lang)
    .then((data) => {
      data.lang = lang || "fr";
      cache.set(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, pending);
  return pending;
}

function ensureSeriesSets(id, lang = state.market) {
  const key = cacheKey(id, lang);
  if (!setsCache.has(key)) {
    setsCache.set(
      key,
      fetchJSON(`/series/${encodeURIComponent(id)}`, lang)
        .then((data) => data.sets || [])
        .catch((error) => {
          setsCache.delete(key);
          throw error;
        }),
    );
  }
  return setsCache.get(key);
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
    return raw.filter((item) => item && cleanId(item.id, "") && item.name).map((item) => ({
      ...item,
      lang: MARKETS[item.lang] ? item.lang : "fr",
    }));
  } catch {
    return [];
  }
}

function saveFavs() {
  localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites));
  updateFavCount();
}

function isFav(id, lang = state.market) {
  return state.favorites.some((item) => item.id === id && (item.lang || "fr") === (lang || "fr"));
}

function snapshot(card) {
  return {
    id: card.id,
    name: card.name,
    image: card.image || "",
    setName: card.set?.name || "",
    localId: card.localId || "",
    rarity: card.rarity || "",
    setTotal: setSize(card) || null,
    trend: typeof card.pricing?.cardmarket?.trend === "number" ? card.pricing.cardmarket.trend : null,
    pricing: card.pricing || null,
    lang: card.lang || state.market || "fr",
  };
}

function touchFav(card) {
  const lang = card.lang || state.market || "fr";
  const index = state.favorites.findIndex((item) => item.id === card.id && (item.lang || "fr") === lang);
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
      market: MARKETS[raw.market] ? raw.market : "fr",
    };
  } catch {
    return { seriesId: "me", setId: "me05", market: "fr" };
  }
}

function rememberContext() {
  sessionStorage.setItem(CTX_KEY, JSON.stringify({
    seriesId: state.gallerySeriesId,
    setId: state.setId,
    market: state.market,
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
    if (!img) {
      const markup = imgTag(full, quality, false);
      if (markup.includes("<img")) {
        node.querySelectorAll(".art, .rank-art").forEach((art) => {
          art.innerHTML = markup;
        });
      }
    }
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
    <button class="fan-card${index === 1 ? " is-lead" : ""}" type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">
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
  const devise = moneyIsConverted() ? "" : " en euros";
  return `
    <section class="hero">
      <div>
        <p class="kicker">Cabinet de cartes Pokémon</p>
        <h1>Chaque carte,<br><em>sa cote du jour.</em></h1>
        <p class="lede">Aureum recense les cartes et affiche la tendance Cardmarket${devise}, tirage par tirage.${opened}</p>
        <div class="hero-actions">
          <button class="btn solid" type="button" data-action="jump">Parcourir l'extension</button>
          <button class="btn" type="button" data-tab="cotes">Salle des cotes</button>
        </div>
        ${liveLine()}
      </div>
      <div id="fan-slot">${fanInner()}</div>
    </section>`;
}

function marketSelects() {
  const current = MARKETS[state.market] || MARKETS.fr;
  const markets = Object.entries(MARKETS).map(([id, item]) => (
    `<option value="${id}"${id === state.market ? " selected" : ""}>${item.label}</option>`
  )).join("");
  const local = current.currency;
  const showLocal = local !== "EUR";
  const selected = activeCurrency();
  return `
    <label class="field">Cartes
      <select id="market-select" aria-label="Collection">${markets}</select>
    </label>
    <label class="field">Prix
      <select id="currency-select" aria-label="Devise"${showLocal ? "" : " disabled"}>
        <option value="EUR"${selected === "EUR" ? " selected" : ""}>Euros</option>
        ${showLocal ? `<option value="${local}"${selected === local ? " selected" : ""}>${current.currencyLabel}</option>` : ""}
      </select>
    </label>`;
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
        ${marketSelects()}
        <label class="field">Tri
          <select id="sort-select">
            <option value="numero"${state.sort === "numero" ? " selected" : ""}>Numéro</option>
            <option value="nom"${state.sort === "nom" ? " selected" : ""}>Nom</option>
            <option value="cote"${state.sort === "cote" ? " selected" : ""}>Tendance</option>
          </select>
        </label>
      </div>
      <button class="btn" type="button" data-action="random">Carte au hasard</button>
    </div>
    ${priceModeNote() ? `<p class="note">${esc(priceModeNote())}</p>` : ""}
  `;
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
    <p class="note" id="hydrate-note"></p>`;
}

function tileHTML(card) {
  const full = resolveCard(card);
  const ready = Boolean(full.pricing) || cache.has(cacheKey(card.id, card.lang || state.market));
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
    watchMore();
    return;
  }
  if (state.error && activeCards().length === 0) {
    grille.innerHTML = `<p class="empty">${esc(state.error)}</p>`;
    if (foot) foot.innerHTML = `<button class="btn" type="button" data-action="retry">Réessayer</button>`;
    watchMore();
    return;
  }
  const shown = shownCards();
  if (!shown.length) {
    grille.innerHTML = `<p class="empty">Aucune carte ne correspond.</p>`;
    if (foot) foot.innerHTML = "";
    watchMore();
    return;
  }
  grille.innerHTML = `<div class="grid">${shown.map(tileHTML).join("")}</div>`;
  const more = activeCards().length > shown.length;
  if (foot) foot.innerHTML = more ? `<div class="more-sentinel" data-more="galerie"></div>` : "";
  watchMore();
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
      <div class="toolbar"><div class="controls">${marketSelects()}</div></div>
      ${priceModeNote() ? `<p class="note">${esc(priceModeNote())}</p>` : ""}
      <div class="series-row">${seriesButtons || `<p class="empty">Chargement des séries…</p>`}</div>
      ${state.error ? `<p class="banner" role="alert">${esc(state.error)}</p>` : ""}
      ${body}
    </section>`;
}

function skeletonRanks(count) {
  return Array.from({ length: count }, () => `<div class="skel skel-rank"></div>`).join("");
}

function rankList(cards, start = 0) {
  if (!cards.length) return `<p class="empty">Aucune cote pour le moment.</p>`;
  return `<ol class="ranks">${cards.map((card, index) => `
    <li>
      <button type="button" data-open="${esc(card.id)}" data-card="${esc(card.id)}" data-lang="${esc(card.lang || "")}">
        <span class="rank">${String(start + index + 1).padStart(2, "0")}</span>
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

function shuffleIds(ids) {
  const copy = ids.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy;
}

function orderedHall() {
  const cards = state.hallCards.slice();
  if (state.coteMode === "melange") {
    const order = new Map(state.hallOrder.map((id, index) => [id, index]));
    cards.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    return cards;
  }
  cards.sort((a, b) => trendOf(b) - trendOf(a));
  return cards;
}

function dearLine(card) {
  const trend = card?.pricing?.cardmarket?.trend;
  if (typeof trend !== "number" || trend < DEAR_EUR) return "";
  return `<p class="cote-wow">Elle coûte cher.</p>`;
}

function coteHero(card) {
  const trend = card.pricing?.cardmarket?.trend;
  return `
    <article class="cote-hero${typeof trend === "number" && trend >= DEAR_EUR ? " is-dear" : ""}">
      <button class="cote-open" type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}" aria-label="${esc(prettyName(card.name))}">
        <span class="art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", true)}</span>
      </button>
      <div>
        ${dearLine(card)}
        <p class="cote-price">${typeof trend === "number" ? esc(money(trend)) : ""}</p>
        <h3 class="cote-name">${esc(prettyName(card.name))}</h3>
        <p class="tile-meta">${esc(metaLine(card))}</p>
        <p class="note">Tendance Cardmarket. Pas une offre.${moneyIsConverted() ? " Affichée après conversion." : ""}</p>
      </div>
    </article>`;
}

async function loadHall() {
  if (state.hallLoading || state.hallCards.length) return;
  state.hallLoading = true;
  const token = ++hallEpoch;
  const rows = [];
  await pool(HALL_IDS, 4, async (id) => {
    try {
      const card = await getCard(id, "fr");
      if (token !== hallEpoch) return;
      if (typeof card?.pricing?.cardmarket?.trend === "number") rows.push(card);
    } catch {
      /* Une carte manquante ne bloque pas la salle. */
    }
  });
  if (token !== hallEpoch) return;
  state.hallCards = rows;
  state.hallOrder = shuffleIds(rows.map((card) => card.id));
  state.hallFailed = rows.length === 0;
  state.hallLoading = false;
  if (state.tab === "cotes") render();
}

function cotesHTML() {
  const cards = orderedHall();
  const hero = cards[0] ? coteHero(cards[0]) : "";
  const rest = cards.length > 1 ? rankList(cards.slice(1), 1) : "";
  const pending = !cards.length && !state.hallFailed;
  const body = pending
    ? `<p class="note">Lecture des cotes, de 1999 à aujourd'hui…</p>${skeletonRanks(4)}`
    : cards.length
      ? `${hero}${rest}`
      : `<p class="note">Les cotes ne répondent pas. Rouvre la salle dans un instant.</p>`;
  const mode = (id, label) => `<button class="fav-sort-btn" type="button" data-action="cote-mode" data-mode="${id}" aria-pressed="${state.coteMode === id ? "true" : "false"}">${label}</button>`;
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
        <p class="lede">Les plus fortes tendances Cardmarket, de 1999 à aujourd'hui. Le mélange reprend les mêmes cartes, dans un autre ordre.</p>
      </header>
      <div class="fav-sort" role="group" aria-label="Ordre de la salle">
        ${mode("tendance", "Par tendance")}
        ${mode("melange", "Toutes les années")}
        ${state.coteMode === "melange" ? `<button class="fav-sort-btn" type="button" data-action="cote-shuffle">Mélanger encore</button>` : ""}
      </div>
      <div id="cote-hall">${body}</div>
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

function setSize(card) {
  const count = card?.set?.cardCount;
  const total = count?.official || count?.total;
  if (typeof total === "number" && total > 0) return total;
  return typeof card?.setTotal === "number" && card.setTotal > 0 ? card.setTotal : 0;
}

function collectorNo(card) {
  const local = String(card?.localId || "").trim();
  if (!local) return "";
  if (local.includes("/")) return local;
  const total = setSize(card);
  return total ? `${local}/${total}` : local;
}

function marketQuery(card) {
  const name = prettyName(card.name);
  const num = collectorNo(card);
  if (num.includes("/")) return `${name} ${num}`;
  const bits = [name];
  if (card.setName) bits.push(prettyName(card.setName));
  if (num) bits.push(num);
  return bits.filter(Boolean).join(" ");
}

function ebaySearch(card, kind) {
  const params = new URLSearchParams({
    _nkw: marketQuery(card),
    _sop: "15",
  });
  if (kind === "achat") params.set("LH_BIN", "1");
  if (kind === "enchere") params.set("LH_Auction", "1");
  return `https://www.ebay.fr/sch/i.html?${params}`;
}

function vintedSearch(card) {
  const params = new URLSearchParams({
    search_text: marketQuery(card),
  });
  return `https://www.vinted.fr/catalog?${params}`;
}

function favTrend(card) {
  const trend = card?.pricing?.cardmarket?.trend;
  if (typeof trend === "number") return trend;
  return typeof card?.trend === "number" ? card.trend : null;
}

function dealGap(card) {
  const avg30 = card?.pricing?.cardmarket?.avg30;
  const trend = favTrend(card);
  if (trend == null || typeof avg30 !== "number" || avg30 <= 0) return null;
  return (avg30 - trend) / avg30;
}

function orderedFavs() {
  const list = state.favorites.slice();
  if (state.favSort === "cote") list.sort((a, b) => (favTrend(b) ?? -1) - (favTrend(a) ?? -1));
  else if (state.favSort === "affaires") list.sort((a, b) => (dealGap(b) ?? -2) - (dealGap(a) ?? -2));
  return list;
}

function dealLine(card) {
  const gap = dealGap(card);
  if (gap == null) return `<p class="deal-note">Pas assez d'historique pour comparer la cote.</p>`;
  const pct = Math.round(Math.abs(gap) * 100);
  if (gap >= 0.08) return `<p class="deal-note down">Cote ${pct} % sous la moyenne 30 j.</p>`;
  if (gap <= -0.08) return `<p class="deal-note up">Cote ${pct} % au-dessus de la moyenne 30 j.</p>`;
  return `<p class="deal-note">Cote proche de la moyenne 30 j.</p>`;
}

function marketLinks(card) {
  const query = marketQuery(card);
  const links = [
    ["eBay · achat immédiat", ebaySearch(card, "achat")],
    ["eBay · enchères", ebaySearch(card, "enchere")],
    ["Vinted", vintedSearch(card)],
  ];
  return `<div class="market-links">${links.map(([label, href]) => `
    <a href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="Recherche : ${esc(query)}">${label}</a>`).join("")}</div>`;
}

function favSortButton(id, label) {
  const on = state.favSort === id;
  return `<button class="fav-sort-btn" type="button" data-action="fav-sort" data-sort="${id}" aria-pressed="${on ? "true" : "false"}">${label}</button>`;
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
        <p class="lede">Les cartes épinglées restent dans ce navigateur. eBay s'ouvre trié du moins cher au plus cher. Vinted s'ouvre sur les annonces les plus proches de la carte.</p>
      </header>
      <div class="fav-sort" role="group" aria-label="Trier les favoris">
        ${favSortButton("affaires", "Meilleures affaires")}
        ${favSortButton("cote", "Cote")}
        ${favSortButton("ajout", "Ordre d'ajout")}
      </div>
      <p class="note">Meilleure affaire : la plus forte baisse de la cote face à la moyenne des 30 derniers jours.</p>
      <div class="grid fav-grid">${orderedFavs().map((card) => `
        <article class="tile" data-card="${esc(card.id)}">
          <button class="tile-hit" type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">
            <span class="art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", false)}</span>
            <span class="tile-name">${esc(prettyName(card.name))}</span>
            <span class="tile-meta" data-slot="meta">${esc(metaLine({ ...card, set: { name: card.setName } }))}</span>
            <span class="price-line" data-slot="price">${card.pricing || typeof card.trend === "number" ? priceHTML(card.pricing ? card : { pricing: { cardmarket: { trend: card.trend } } }) : `<span class="price-missing">Cote indisponible</span>`}</span>
          </button>
          ${dealLine(card)}
          ${marketLinks(card)}
          <button class="btn unfav" type="button" data-action="unfav" data-id="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">Retirer</button>
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
        <button class="tile-hit" type="button" data-action="product" data-family="sealed" data-id="${esc(item.id)}">
          <span class="art is-box" data-label="${esc(sealedLabel(item.kind))}">
            <img src="https://tcgplayer-cdn.tcgplayer.com/product/${esc(item.id)}_in_400x400.jpg" alt="${esc(item.name)}" decoding="async">
          </span>
          <span class="tile-name">${esc(item.name)}</span>
          <span class="tile-meta">${esc(bits.join(" · "))}</span>
          <span class="price-line">${price}</span>
        </button>
      </article>`;
  }).join("");
}

function sealedMore() {
  const total = sealedRows().length;
  if (state.sealedPage * PAGE_SIZE >= total) return "";
  return `<div class="more-sentinel" data-more="sealed"></div>`;
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
  watchMore();
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
  ["topps", "Topps"],
  ["autocollant", "Autocollants"],
  ["panini", "Panini"],
  ["peluche", "Peluches"],
  ["figurine", "Figurines"],
  ["jouet", "Jouets"],
];

function universLabel(kind) {
  return {
    jeu: "Jeu",
    pack: "Pack",
    topps: "Topps",
    autocollant: "Autocollant",
    panini: "Panini",
    peluche: "Peluche",
    figurine: "Figurine",
    jouet: "Jouet",
  }[kind] || "Univers";
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
      ? `<img src="https://tcgplayer-cdn.tcgplayer.com/product/${esc(item.id)}_in_400x400.jpg" alt="${esc(item.name)}" decoding="async">`
      : `<span class="monogram" data-label="${esc(initials(item.name))}">${esc(initials(item.name))}</span>`;
    return `
      <article class="tile">
        <button class="tile-hit" type="button" data-action="product" data-family="univers" data-id="${esc(item.id)}">
          <span class="art is-box" data-label="${esc(universLabel(item.kind))}">${art}</span>
          <span class="tile-name">${esc(item.name)}</span>
          <span class="tile-meta">${esc(bits.join(" · "))}</span>
          <span class="price-line">${price}</span>
        </button>
      </article>`;
  }).join("");
}

function universMore() {
  if (state.universPage * PAGE_SIZE >= universRows().length) return "";
  return `<div class="more-sentinel" data-more="univers"></div>`;
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
  watchMore();
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
  const counts = { tous: state.univers.length };
  UNIVERS_KINDS.forEach(([id]) => {
    if (id !== "tous") counts[id] = 0;
  });
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
      <p class="note">Pokémon commence le 27 février 1996 au Japon, avec Rouge et Vert. Jaune sort le 12 septembre 1998. Les peluches, figurines, jouets, cartes Topps, autocollants et albums Panini sont les grandes séries, pas chaque modèle.</p>
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


function emptyPage() {
  return Array.from({ length: POCKETS }, () => null);
}

function loadBinder() {
  const fresh = () => ({ page: 0, pages: [emptyPage(), emptyPage()], cards: {} });
  try {
    const raw = JSON.parse(localStorage.getItem(BINDER_KEY) || "null");
    const cards = raw && raw.cards && typeof raw.cards === "object" ? raw.cards : {};
    const source = Array.isArray(raw?.pages) ? raw.pages : [];
    const pages = source.map((page) => Array.from({ length: POCKETS }, (_, index) => {
      const id = cleanId(page?.[index], "");
      return id && cards[id]?.name ? id : null;
    }));
    if (!pages.length) return fresh();
    const page = Math.min(Math.max(0, Number(raw?.page) || 0), pages.length - 1);
    return { page, pages, cards };
  } catch {
    return fresh();
  }
}

function saveBinder() {
  localStorage.setItem(BINDER_KEY, JSON.stringify({
    page: state.binder.page,
    pages: state.binder.pages,
    cards: state.binder.cards,
  }));
}

function binderFind(id) {
  const pages = state.binder?.pages || [];
  for (let page = 0; page < pages.length; page += 1) {
    const slot = pages[page].indexOf(id);
    if (slot >= 0) return { page, slot };
  }
  return null;
}

function binderCount() {
  return state.binder.pages.reduce((sum, page) => sum + page.filter(Boolean).length, 0);
}

function binderLabel() {
  const page = state.binder.pages[state.binder.page] || [];
  const here = page.filter(Boolean).length;
  const total = binderCount();
  const ici = here === 0
    ? "aucune carte sur cette page"
    : `${here} ${here > 1 ? "cartes" : "carte"} sur cette page`;
  const ailleurs = total === here ? "" : ` · ${total} ${total > 1 ? "cartes" : "carte"} dans le classeur`;
  return `Page ${state.binder.page + 1} sur ${state.binder.pages.length} · ${ici}${ailleurs}`;
}

function firstHole(start = state.binder.page) {
  const pages = state.binder.pages;
  for (let step = 0; step < pages.length; step += 1) {
    const page = (start + step) % pages.length;
    const slot = pages[page].indexOf(null);
    if (slot >= 0) return { page, slot };
  }
  return null;
}

function pocketHTML(id, index) {
  const chosen = state.binderSlot === index ? " is-chosen" : "";
  const card = id ? state.binder.cards[id] : null;
  if (!card) {
    return `<button type="button" class="pocket${chosen}" data-pocket="${index}"><span class="pocket-empty">Libre</span></button>`;
  }
  return `<button type="button" class="pocket is-full${chosen}" data-pocket="${index}" aria-label="${esc(prettyName(card.name))}">
    <span class="pocket-card">${imgTag(card, "low", false)}<span class="holo is-quiet" aria-hidden="true"></span></span>
  </button>`;
}

function binderHitsHTML() {
  if (state.binderQuery.trim().length < 2) return "";
  if (!state.binderHits.length) return `<p class="note">Aucune carte ne porte ce nom.</p>`;
  return state.binderHits.map((card) => `
    <button type="button" class="binder-hit" data-binder="place" data-id="${esc(card.id)}">
      <span class="binder-hit-art">${imgTag(card, "low", false)}</span>
      <span>${esc(prettyName(card.name))}</span>
    </button>`).join("");
}

function paintBinder() {
  const grid = document.getElementById("binder-grid");
  const status = document.getElementById("binder-status");
  const hits = document.getElementById("binder-hits");
  const drop = document.getElementById("binder-drop");
  if (!grid || !status || !hits) {
    render();
    return;
  }
  const page = state.binder.pages[state.binder.page] || emptyPage();
  grid.innerHTML = page.map((id, index) => pocketHTML(id, index)).join("");
  status.textContent = binderLabel();
  hits.innerHTML = binderHitsHTML();
  if (drop) {
    const empty = page.every((id) => !id);
    drop.hidden = !(empty && state.binder.pages.length > 1);
  }
}

function binderHTML() {
  const page = state.binder.pages[state.binder.page] || emptyPage();
  const empty = page.every((id) => !id);
  return `
    <section class="panel binder">
      <header class="section-head">
        <div>
          <p class="kicker">Classeur</p>
          <h2>Tes cartes, page après page.</h2>
        </div>
        <p class="lede" id="binder-status">${esc(binderLabel())}</p>
      </header>
      <div class="binder-book">
        <div class="binder-sheet" id="binder-sheet">
          <div class="binder-grid" id="binder-grid">${page.map((id, index) => pocketHTML(id, index)).join("")}</div>
        </div>
      </div>
      <div class="binder-nav">
        <button class="btn" type="button" data-binder="prev">Précédente</button>
        <button class="btn" type="button" data-binder="next">Suivante</button>
      </div>
      <p class="hint">Glisse une carte pour la déplacer, même vers la page d'à côté. Un clic l'ouvre en relief : le reflet holographique suit le doigt.</p>
      <div class="binder-nav">
        <button class="btn" type="button" data-binder="add-page">Ajouter une page</button>
        <button class="btn" type="button" id="binder-drop" data-binder="drop-page"${empty && state.binder.pages.length > 1 ? "" : " hidden"}>Retirer cette page</button>
      </div>
      <form class="binder-search" id="binder-form">
        <label class="field">Ranger une carte
          <input id="binder-q" type="search" placeholder="Nom d'une carte" autocomplete="off" enterkeyhint="search" value="${esc(state.binderQuery)}">
        </label>
      </form>
      <div class="binder-hits" id="binder-hits">${binderHitsHTML()}</div>
    </section>`;
}

function reliefHTML(card, slot) {
  return `
    <div class="relief">
      <button class="close" type="button" data-action="close">Fermer</button>
      <div class="relief-stage">
        <div class="stage is-holo" data-tilt data-label="${esc(initials(card.name))}">
          ${imgTag(card, "high", true)}
          <span class="holo" aria-hidden="true"></span>
          <span class="shine" aria-hidden="true"></span>
        </div>
      </div>
      <p class="relief-name">${esc(prettyName(card.name))}</p>
      <p class="hint">Penche la carte : le reflet holographique suit le mouvement.</p>
      <div class="fiche-actions">
        <button class="btn" type="button" data-action="open-fiche" data-id="${esc(card.id)}">Voir la fiche</button>
        <button class="btn" type="button" data-binder="remove" data-slot="${slot}">Retirer du classeur</button>
      </div>
    </div>`;
}

function openRelief(id, slot) {
  const card = state.binder.cards[id];
  const dialog = document.getElementById("relief");
  if (!card || !dialog) return;
  dialog.innerHTML = reliefHTML(card, slot);
  if (!dialog.open) dialog.showModal();
}

function turnBinder(dir) {
  const next = state.binder.page + dir;
  if (next < 0 || next >= state.binder.pages.length) return;
  const sheet = document.getElementById("binder-sheet");
  const apply = () => {
    state.binder.page = next;
    state.binderSlot = null;
    saveBinder();
    paintBinder();
  };
  if (!sheet || !motionOK) {
    apply();
    return;
  }
  const finish = () => {
    sheet.removeEventListener("transitionend", finish);
    apply();
    sheet.style.transition = "none";
    sheet.style.transform = `rotateY(${dir > 0 ? 68 : -68}deg)`;
    requestAnimationFrame(() => {
      sheet.style.transition = "transform .32s ease";
      sheet.style.transform = "rotateY(0deg)";
    });
  };
  sheet.style.transition = "transform .28s ease";
  sheet.style.transform = `rotateY(${dir > 0 ? -72 : 72}deg)`;
  sheet.addEventListener("transitionend", finish);
}

function movePocket(from, to) {
  const page = state.binder.pages[state.binder.page];
  if (!page || from === to || to < 0 || to >= POCKETS) return;
  const held = page[from];
  page[from] = page[to];
  page[to] = held;
  saveBinder();
  paintBinder();
}

function moveToPage(from, dir) {
  const next = state.binder.page + dir;
  if (next < 0 || next >= state.binder.pages.length) return;
  const id = state.binder.pages[state.binder.page][from];
  if (!id) return;
  const slot = state.binder.pages[next].indexOf(null);
  if (slot < 0) return;
  state.binder.pages[state.binder.page][from] = null;
  state.binder.pages[next][slot] = id;
  state.binder.page = next;
  state.binderSlot = null;
  saveBinder();
  paintBinder();
}

function forgetCard(id) {
  const still = state.binder.pages.some((page) => page.includes(id));
  if (!still) delete state.binder.cards[id];
}

function removeSlot(pageIndex, slot) {
  const page = state.binder.pages[pageIndex];
  if (!page) return;
  const id = page[slot];
  if (!id) return;
  page[slot] = null;
  forgetCard(id);
  saveBinder();
  paintBinder();
}

function rangerCard(card) {
  const found = binderFind(card.id);
  if (found) {
    state.binder.page = found.page;
    saveBinder();
    setTab("classeur");
    return;
  }
  let hole = firstHole(0);
  if (!hole) {
    state.binder.pages.push(emptyPage());
    hole = { page: state.binder.pages.length - 1, slot: 0 };
  }
  state.binder.page = hole.page;
  state.binder.pages[hole.page][hole.slot] = card.id;
  state.binder.cards[card.id] = snapshot(card);
  saveBinder();
  setTab("classeur");
}

let binderTimer = 0;
let lift = null;
let suppressPocketClick = false;

function showGhost(id, x, y) {
  let ghost = document.getElementById("binder-ghost");
  if (!ghost) {
    ghost = document.createElement("div");
    ghost.id = "binder-ghost";
    ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghost);
  }
  const card = state.binder.cards[id];
  if (card && ghost.dataset.id !== id) {
    ghost.dataset.id = id;
    ghost.innerHTML = imgTag(card, "low", true);
  }
  ghost.hidden = false;
  ghost.style.transform = `translate(${Math.round(x - 42)}px, ${Math.round(y - 58)}px)`;
}

function hideGhost() {
  const ghost = document.getElementById("binder-ghost");
  if (ghost) ghost.hidden = true;
}

async function placeBinderCard(id) {
  const safe = cleanId(id, "");
  if (!safe) return;
  let card = state.binder.cards[safe] || cache.get(cacheKey(safe));
  if (!card?.image) {
    try {
      card = await getCard(safe);
    } catch {
      return;
    }
  }
  let page = state.binder.page;
  let slot = state.binderSlot;
  if (slot == null || state.binder.pages[page]?.[slot]) {
    const hole = firstHole(page);
    if (!hole) {
      state.binder.pages.push(emptyPage());
      page = state.binder.pages.length - 1;
      slot = 0;
    } else {
      page = hole.page;
      slot = hole.slot;
    }
  }
  state.binder.page = page;
  state.binder.pages[page][slot] = card.id;
  state.binder.cards[card.id] = snapshot(card);
  state.binderSlot = null;
  state.binderHits = [];
  state.binderQuery = "";
  saveBinder();
  const input = document.getElementById("binder-q");
  if (input) input.value = "";
  paintBinder();
}

async function searchBinder(raw) {
  const query = String(raw || "").trim();
  state.binderQuery = query;
  if (query.length < 2) {
    state.binderHits = [];
    paintBinder();
    return;
  }
  try {
    const list = await fetchJSON(`/cards?name=${encodeURIComponent(query)}`);
    const rows = Array.isArray(list) ? list : [];
    if (state.binderQuery !== query) return;
    state.binderHits = rows.slice(0, 8);
  } catch {
    if (state.binderQuery !== query) return;
    state.binderHits = [];
  }
  paintBinder();
}

function blankCollection() {
  return { name: "", named: true, shareFavs: false, items: [] };
}

function looseName(value) {
  return String(value || "").replace(/[^\p{L}\p{N} '\-.]/gu, "").slice(0, 24);
}

function looseNote(value) {
  return String(value || "").replace(/[\u0000-\u001F]/g, "").slice(0, NOTE_MAX);
}

function loadCollection() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLL_KEY) || "{}");
    const items = Array.isArray(raw.items) ? raw.items : [];
    return {
      name: looseName(raw.name).trim(),
      named: raw.named !== false,
      shareFavs: raw.shareFavs === true,
      items: items.filter((item) => item && cleanId(item.id, "") && item.name).slice(0, COLL_MAX).map((item) => ({
        id: item.id,
        name: looseNote(item.name).trim() || "Carte",
        image: typeof item.image === "string" && item.image.startsWith("https://assets.tcgdex.net/") ? item.image : "",
        setName: looseNote(item.setName).trim(),
        localId: looseNote(item.localId).trim().slice(0, 16),
        note: looseNote(item.note).trim(),
        trend: typeof item.trend === "number" && item.trend >= 0 ? item.trend : null,
        lang: MARKETS[item.lang] ? item.lang : "fr",
      })),
    };
  } catch {
    return blankCollection();
  }
}

function saveCollection() {
  localStorage.setItem(COLL_KEY, JSON.stringify(state.collection));
}

function inCollection(id, lang = state.market) {
  return state.collection.items.some((item) => item.id === id && (item.lang || "fr") === (lang || "fr"));
}

function collectionFromCard(card, note = "") {
  return {
    id: card.id,
    name: card.name,
    image: typeof card.image === "string" ? card.image : "",
    setName: card.set?.name || card.setName || "",
    localId: card.localId || "",
    note: looseNote(note).trim(),
    lang: card.lang || state.market || "fr",
    trend: typeof card.pricing?.cardmarket?.trend === "number" ? card.pricing.cardmarket.trend : (typeof card.trend === "number" ? card.trend : null),
  };
}

function addToCollection(card) {
  const lang = card?.lang || state.market;
  if (!card?.id || inCollection(card.id, lang) || state.collection.items.length >= COLL_MAX) return;
  state.collection.items.unshift(collectionFromCard(card));
  saveCollection();
}

function removeFromCollection(id, lang = state.market) {
  state.collection.items = state.collection.items.filter((item) => !(item.id === id && (item.lang || "fr") === (lang || "fr")));
  saveCollection();
}

function bytesToB64url(bytes) {
  let bin = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) bin += String.fromCharCode(view[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(text) {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function shareRow(item, withNote) {
  const row = {
    i: item.id,
    a: looseNote(item.name).trim(),
    s: looseNote(item.setName).trim(),
    l: looseNote(item.localId).trim().slice(0, 16),
  };
  if (withNote) row.c = looseNote(item.note).trim();
  if (MARKETS[item.lang] && item.lang !== "fr") row.g = item.lang;
  return row;
}

function sharePayload() {
  const mine = state.collection;
  const items = mine.items.map((item) => shareRow(item, true));
  const favs = mine.shareFavs ? state.favorites.map((item) => shareRow(item, false)) : [];
  if (!items.length && !favs.length) return null;
  return { v: 1, n: mine.named ? looseName(mine.name).trim() : "", items, favs };
}

async function encodeShare(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return `z${bytesToB64url(buf)}`;
  }
  return `j${bytesToB64url(bytes)}`;
}

function sanitizeRows(rows, withNote) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, COLL_MAX).flatMap((row) => {
    const id = cleanId(row?.i, "");
    const name = looseNote(row?.a).trim();
    if (!id || !name) return [];
    return [{
      id,
      name,
      image: "",
      setName: looseNote(row?.s).trim(),
      localId: looseNote(row?.l).trim().slice(0, 16),
      note: withNote ? looseNote(row?.c).trim() : "",
      lang: MARKETS[row?.g] ? row.g : "fr",
    }];
  });
}

async function decodeShare(token) {
  if (typeof token !== "string" || token.length < 4 || token.length > 4000) return null;
  const kind = token[0];
  const bytes = b64urlToBytes(token.slice(1));
  let json = "";
  if (kind === "z" && typeof DecompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    json = await new Response(stream).text();
  } else if (kind === "j") json = new TextDecoder().decode(bytes);
  else return null;
  const data = JSON.parse(json);
  if (!data || data.v !== 1) return null;
  const items = sanitizeRows(data.items, true);
  const favs = sanitizeRows(data.favs, false);
  if (!items.length && !favs.length) return null;
  return { name: looseName(data.n).trim(), items, favs };
}

function collCard(card, editable) {
  const meta = metaLine({ ...card, set: { name: card.setName } });
  const price = typeof card.trend === "number"
    ? `<span class="price">${esc(eur(card.trend))}</span>`
    : `<span class="price-missing">Cote indisponible</span>`;
  const note = editable
    ? `<label class="coll-label">Commentaire
        <textarea data-coll-note="${esc(card.id)}" maxlength="${NOTE_MAX}" rows="2" placeholder="État, souvenir, emplacement dans le classeur.">${esc(card.note || "")}</textarea>
      </label>
      <button class="btn unfav" type="button" data-action="coll-remove" data-id="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">Retirer</button>`
    : (card.note ? `<p class="coll-note">${esc(card.note)}</p>` : "");
  return `
    <article class="coll-card" data-card="${esc(card.id)}">
      <button class="coll-open" type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}" aria-label="${esc(prettyName(card.name))}">
        <span class="art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", true)}</span>
      </button>
      <div class="coll-body">
        <button class="coll-title" type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">${esc(prettyName(card.name))}</button>
        <p class="tile-meta">${esc(meta)}</p>
        <p class="price-line">${price}</p>
        ${note}
      </div>
    </article>`;
}

function visitHTML() {
  const visit = state.visit;
  if (visit.error) {
    return `
      <div class="empty-state">
        <h2>Ce lien ne s'ouvre pas.</h2>
        <p class="lede">Le partage est incomplet ou trop ancien.</p>
        <button class="btn solid" type="button" data-action="coll-mine">Ma collection</button>
      </div>`;
  }
  const title = visit.name ? `Collection de ${visit.name}` : "Une collection";
  const favs = visit.favs?.length
    ? `<h3 class="coll-sub">Favoris</h3><div class="coll-list">${visit.favs.map((card) => collCard(card, false)).join("")}</div>`
    : "";
  const items = visit.items?.length
    ? `<div class="coll-list">${visit.items.map((card) => collCard(card, false)).join("")}</div>`
    : "";
  return `
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Collection</p>
          <h2>${esc(title)}</h2>
        </div>
        <p class="lede">Lecture seule. Cette page n'enregistre rien ici, et elle ne propose rien à la vente.</p>
      </header>
      <button class="btn" type="button" data-action="coll-mine">Ma collection</button>
      ${items}
      ${favs}
    </section>`;
}

function collectionWorth() {
  let sum = 0;
  let known = 0;
  state.collection.items.forEach((item) => {
    if (typeof item.trend !== "number") return;
    sum += item.trend;
    known += 1;
  });
  return { sum, known, total: state.collection.items.length };
}

function worthHTML() {
  const { sum, known, total } = collectionWorth();
  if (!total) return "";
  if (!known) {
    return `<p class="coll-worth" id="coll-worth"><span class="price-missing">Valeur indisponible</span></p>`;
  }
  const missing = total - known;
  const hole = missing ? `<span class="deal-note">${missing} ${missing > 1 ? "cartes" : "carte"} sans cote.</span>` : "";
  return `
    <p class="coll-worth" id="coll-worth">
      <span class="kicker">Valeur indicative</span>
      <strong class="price">${esc(eur(sum))}</strong>
      <span class="deal-note">Somme des cotes Cardmarket, en euros. Chaque carte compte une fois. Pas un prix de vente.</span>
      ${hole}
    </p>`;
}

async function refreshCollection() {
  if (state.visit || state.tab !== "collection" || !state.collection.items.length) return;
  const token = ++collEpoch;
  await pool(state.collection.items, 4, async (item) => {
    try {
      const full = await getCard(item.id, item.lang || "fr");
      if (token !== collEpoch || state.visit || state.tab !== "collection") return;
      const trend = full.pricing?.cardmarket?.trend;
      item.trend = typeof trend === "number" ? trend : null;
      if (typeof full.image === "string") item.image = full.image;
      patchCard(full);
    } catch {
      /* La dernière cote connue reste affichée. */
    }
  });
  if (token !== collEpoch || state.visit || state.tab !== "collection") return;
  saveCollection();
  const slot = document.getElementById("coll-worth");
  const html = worthHTML();
  if (slot) slot.outerHTML = html;
}

function collectionHTML() {
  if (state.visit) return visitHTML();
  const mine = state.collection;
  const empty = mine.items.length
    ? ""
    : `<div class="empty-state"><p class="lede">Aucune carte pour l'instant. Ouvre une fiche, puis ajoute-la à ta collection.</p></div>`;
  return `
    <section class="panel">
      <header class="section-head">
        <div>
          <p class="kicker">Collection</p>
          <h2>Ma collection</h2>
        </div>
        <p class="lede">Tes cartes, un commentaire, une cote en euros. Tout reste sur cet appareil. Le lien montre la page, il ne vend rien.</p>
      </header>
      ${worthHTML()}
      <form class="coll-form" id="coll-form">
        <label class="coll-label" for="coll-name">Ton nom
          <input id="coll-name" type="text" maxlength="24" value="${esc(mine.name)}" placeholder="Un prénom suffit" autocomplete="nickname">
        </label>
        <label class="coll-check"><input id="coll-named" type="checkbox" ${mine.named ? "checked" : ""}> Montrer ce nom dans le lien</label>
        <label class="coll-check"><input id="coll-favs" type="checkbox" ${mine.shareFavs ? "checked" : ""}> Joindre mes favoris au lien</label>
        <button class="btn solid" type="button" data-action="coll-share">Copier le lien</button>
        <p class="note" id="coll-status">${esc(state.shareNote)}</p>
      </form>
      <p class="note">${mine.items.length} sur ${COLL_MAX}. Le commentaire parle de l'état, d'un souvenir ou de l'emplacement.</p>
      ${empty}
      <div class="coll-list">${mine.items.map((card) => collCard(card, true)).join("")}</div>
    </section>`;
}

async function hydrateVisit() {
  if (!state.visit || state.visit.error || state.tab !== "collection") return;
  const token = ++visitEpoch;
  const rows = [...(state.visit.items || []), ...(state.visit.favs || [])];
  await pool(rows, 4, async (row) => {
    try {
      const full = await getCard(row.id, row.lang || "fr");
      if (token !== visitEpoch || state.tab !== "collection" || !state.visit) return;
      const safe = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(full.id) : full.id.replace(/"/g, "");
      const keep = (list) => {
        const row = list?.find((item) => item.id === full.id);
        if (row && typeof full.image === "string") row.image = full.image;
      };
      keep(state.visit.items);
      keep(state.visit.favs);
      document.querySelectorAll(`[data-card="${safe}"]`).forEach((node) => {
        const art = node.querySelector(".art");
        if (art && !art.querySelector("img")) art.innerHTML = imgTag(full, "low", false);
      });
      patchCard(full);
    } catch {
      /* Le monogramme reste si le scan manque. */
    }
  });
}

async function copyCollectionLink() {
  const status = document.getElementById("coll-status");
  const payload = sharePayload();
  if (!payload) {
    state.shareNote = "Ajoute une carte, ou coche les favoris, avant de copier le lien.";
    if (status) status.textContent = state.shareNote;
    return;
  }
  const token = await encodeShare(payload);
  if (token.length > 1800) {
    state.shareNote = "Le lien est trop long. Raccourcis un commentaire ou retire une carte.";
    if (status) status.textContent = state.shareNote;
    return;
  }
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("voir", token);
  url.hash = "collection";
  const link = url.toString();
  try {
    await navigator.clipboard.writeText(link);
    state.shareNote = "Lien copié.";
  } catch {
    state.shareNote = link;
  }
  if (status) status.textContent = state.shareNote;
}

function leaveVisit() {
  state.visit = null;
  state.shareNote = "";
  const url = new URL(location.href);
  url.searchParams.delete("voir");
  history.replaceState(null, "", `${url.pathname}${url.search}#collection`);
  state.tab = "collection";
  updateTabs();
  render();
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  if (state.tab === "galerie") app.innerHTML = galleryHTML();
  else if (state.tab === "extensions") app.innerHTML = extensionsHTML();
  else if (state.tab === "etb") app.innerHTML = etbHTML();
  else if (state.tab === "univers") app.innerHTML = universHTML();
  else if (state.tab === "cotes") app.innerHTML = cotesHTML();
  else if (state.tab === "classeur") app.innerHTML = binderHTML();
  else if (state.tab === "collection") app.innerHTML = collectionHTML();
  else app.innerHTML = favorisHTML();
  if (state.tab === "galerie") renderGrid();
  updateFavCount();
  watchMore();
  wakeScans(app);
  window.setTimeout(() => wakeScans(app), 800);
  window.setTimeout(() => {
    app.querySelectorAll("img.is-trying").forEach((img) => {
      if (img.naturalWidth > 0) img.classList.remove("is-trying", "is-broken");
      else img.classList.remove("is-trying");
    });
  }, 1800);
}

let moreObserver = null;

function growPage(kind) {
  if (kind === "galerie") {
    if (activeCards().length <= shownCards().length) return;
    state.page += 1;
    renderGrid();
    hydrateShown(epoch);
    wakeScans(document.getElementById("app") || document);
    return;
  }
  if (kind === "sealed") {
    if (state.sealedPage * PAGE_SIZE >= sealedRows().length) return;
    state.sealedPage += 1;
    paintSealed();
    wakeScans(document.getElementById("app") || document);
    return;
  }
  if (kind === "univers") {
    if (state.universPage * PAGE_SIZE >= universRows().length) return;
    state.universPage += 1;
    paintUnivers();
    wakeScans(document.getElementById("app") || document);
  }
}

function watchMore() {
  if (!moreObserver) {
    moreObserver = new IntersectionObserver((entries) => {
      const hit = entries.find((entry) => entry.isIntersecting);
      if (hit) growPage(hit.target.dataset.more);
    }, { rootMargin: "700px 0px" });
  }
  moreObserver.disconnect();
  document.querySelectorAll("[data-more]").forEach((node) => moreObserver.observe(node));
}

function setTab(tab) {
  if (tab !== "collection") {
    const url = new URL(location.href);
    if (url.searchParams.has("voir")) {
      url.searchParams.delete("voir");
      url.hash = tab;
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }
  rememberTab(tab);
  render();
  window.scrollTo(0, 0);
  if (tab === "extensions") selectSeries(state.browseSeriesId);
  if (tab === "favoris") refreshFavs();
  if (tab === "collection") {
    hydrateVisit();
    refreshCollection();
  }
  if (tab === "etb") loadSealed();
  if (tab === "univers") loadUnivers();
  if (tab === "cotes") loadHall();
}

async function loadIconics() {
  const results = await Promise.all(ICONIC_IDS.map(async (id) => {
    try {
      return await getCard(id, "fr");
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
    if (state.tab === "galerie") {
      render();
      hydrateShown(token);
    }
  } catch {
    if (token !== epoch) return;
    state.loading = false;
    state.error = "Impossible de charger cette extension.";
    if (state.tab === "galerie") render();
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
    if (cache.has(cacheKey(card.id, card.lang || state.market))) patchCard(cache.get(cacheKey(card.id, card.lang || state.market)));
  });
  const missing = slice.filter((card) => !cache.has(cacheKey(card.id, card.lang || state.market)));
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
      const full = await getCard(fav.id, fav.lang || "fr");
      if (token !== favEpoch) return;
      touchFav(full);
      patchCard(full);
    } catch {
      /* Le favori reste affiché avec sa dernière cote. */
    }
  });
  if (token !== favEpoch) return;
  if (state.tab === "favoris") render();
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
  const showDuo = refTrend != null && bestTrend != null && bestTrend > refTrend * 1.15;
  if (!showDuo) {
    const amount = refTrend ?? bestTrend;
    const delta = deltaInfo(card);
    return `
      <article>
        <span>Tendance</span>
        <strong>${esc(money(amount))}</strong>
        ${delta ? `<span class="delta ${delta.dir}">${esc(formatPct(delta.pct))}<span class="delta-hint"> vs 30 j</span></span>` : ""}
      </article>`;
  }
  return `
    <article>
      <span>Tirage de référence</span>
      <strong>${esc(money(refTrend))}</strong>
    </article>
    <article class="hi">
      <span>${esc(labelVariant(best))}</span>
      <strong>${esc(money(bestTrend))}</strong>
    </article>`;
}

function statsHTML(card) {
  const prices = card.pricing?.cardmarket;
  if (!prices) return "";
  const rows = [
    ["Moyenne", prices.avg],
    ["Prix bas", prices.low],
    ["Moyenne 7 j", prices.avg7],
    ["Moyenne 30 j", prices.avg30],
  ].filter((row) => typeof row[1] === "number");
  if (!rows.length) return "";
  return `<dl class="stats">${rows.map(([label, amount]) => `<div><dt>${esc(label)}</dt><dd>${esc(money(amount))}</dd></div>`).join("")}</dl>`;
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
            <td>${typeof low === "number" ? esc(money(low)) : "—"}</td>
            <td>${typeof trend === "number" ? esc(money(trend)) : "Cote indisponible"}</td>
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

function ficheBar() {
  const random = document.getElementById("fiche")?.dataset.mode === "random";
  const next = random
    ? `<button class="btn solid next-card" type="button" data-action="random-next">Suivante</button>`
    : "";
  return `<div class="fiche-bar">${next}<button class="close" type="button" data-action="close">Fermer</button></div>`;
}

function nextRandomId() {
  const poolCards = state.setCards.length ? state.setCards : activeCards();
  if (!poolCards.length) return "";
  const current = document.getElementById("fiche")?.dataset.current || "";
  const others = poolCards.filter((card) => card.id !== current);
  const source = others.length ? others : poolCards;
  return source[Math.floor(Math.random() * source.length)].id;
}

function ficheHTML(card) {
  const types = Array.isArray(card.types) ? card.types : [];
  const when = formatDay(card.pricing?.cardmarket?.updated);
  const favOn = isFav(card.id, card.lang || state.market);
  const collOn = inCollection(card.id, card.lang || state.market);
  return `
    <article class="fiche">
      ${ficheBar()}
      <div class="fiche-art">
        <div class="stage" data-tilt data-label="${esc(initials(card.name))}">
          ${imgTag(card, "high", true)}
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
        ${trendOf(card) >= 0 || bestVariant(card) ? `<p class="hint">Montant principal : tirage de référence. Le détail distingue les éditions.</p>` : ""}
        ${when ? `<p class="hint">Mise à jour le ${esc(when)}.</p>` : ""}
        ${statsHTML(card)}
        ${variantsHTML(card)}
        ${combatHTML(card)}
        ${attacksHTML(card)}
        ${card.illustrator ? `<p class="hint">Illustré par ${esc(card.illustrator)}.</p>` : ""}
        ${Array.isArray(card.dexId) && card.dexId.length ? `<p class="hint">Pokédex n° ${esc(card.dexId.join(", "))}</p>` : ""}
        <div class="fiche-actions">
          <button class="btn solid" type="button" data-action="fav" data-id="${esc(card.id)}" data-lang="${esc(card.lang || state.market)}" aria-pressed="${favOn ? "true" : "false"}">${favOn ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
          <button class="btn" type="button" data-action="binder-add" data-id="${esc(card.id)}" data-lang="${esc(card.lang || state.market)}">${binderFind(card.id) ? "Voir dans le classeur" : "Ranger dans le classeur"}</button>
          <button class="btn" type="button" data-action="coll-add" data-id="${esc(card.id)}" data-lang="${esc(card.lang || state.market)}" ${!collOn && state.collection.items.length >= COLL_MAX ? "disabled" : ""}>${collOn ? "Retirer de ma collection" : state.collection.items.length >= COLL_MAX ? "Collection pleine" : "Ajouter à ma collection"}</button>
        </div>
        <p class="hint">Cote indicative Cardmarket, pas une offre d'achat.</p>
      </div>
    </article>`;
}

function fichePending() {
  return `<div class="pending">${ficheBar()}Ouverture de la fiche…</div>`;
}

function productHTML(item, family) {
  const label = family === "univers" ? universLabel(item.kind) : sealedLabel(item.kind);
  const day = family === "univers"
    ? releasedLabel(item.released)
    : formatDay(item.released ? `${item.released}T12:00:00` : "");
  const bits = [label];
  if (item.set) bits.push(item.set);
  if (day) bits.push(day);
  const shot = /^\d+$/.test(String(item.id))
    ? `https://tcgplayer-cdn.tcgplayer.com/product/${item.id}_in_1000x1000.jpg`
    : "";
  const art = shot
    ? `<img src="${esc(shot)}" alt="${esc(item.name)}">`
    : `<span class="monogram">${esc(initials(item.name))}</span>`;
  const when = family === "sealed" ? formatDay(state.sealedAsOf ? `${state.sealedAsOf}T12:00:00` : "") : "";
  const dated = when ? ` Relevée le ${when}.` : "";
  const note = typeof item.usd === "number"
    ? `Cote TCGPlayer en dollars.${dated} Pas une offre.`
    : "Pas de cote unitaire pour cette ligne.";
  return `
    <article class="fiche">
      ${ficheBar()}
      <div class="fiche-art">
        <div class="stage is-box" data-label="${esc(label)}">${art}</div>
      </div>
      <div class="fiche-body">
        <p class="kicker">${esc(bits.join(" · "))}</p>
        <h2>${esc(item.name)}</h2>
        ${typeof item.usd === "number" ? `<p class="cote-price">${esc(usdFmt.format(item.usd))}</p>` : ""}
        <p class="note">${esc(note)}</p>
      </div>
    </article>`;
}

function openProduct(item, family) {
  const dialog = document.getElementById("fiche");
  dialog.dataset.mode = "";
  dialog.dataset.current = "";
  dialog.innerHTML = productHTML(item, family);
  if (!dialog.open) dialog.showModal();
}

async function openFiche(id, modeOrOpts) {
  const opts = typeof modeOrOpts === "string" ? { mode: modeOrOpts } : (modeOrOpts || {});
  const lang = opts.lang || state.market;
  const safe = cleanId(id, "");
  if (!safe) return;
  const dialog = document.getElementById("fiche");
  dialog.dataset.current = safe;
  dialog.dataset.lang = lang;
  dialog.dataset.mode = opts.mode === "random" ? "random" : "";
  if (!dialog.open) dialog.innerHTML = fichePending();
  if (!dialog.open) dialog.showModal();
  try {
    const card = await getCard(safe, lang);
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = ficheHTML(card);
    touchFav(card);
  } catch {
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = `<div class="fiche-error">${ficheBar()}<p>Impossible d'ouvrir cette fiche.</p></div>`;
  }
}

function toggleFav(id, lang = state.market) {
  const card = cache.get(cacheKey(id, lang)) || state.favorites.find((item) => item.id === id && (item.lang || "fr") === lang) || activeCards().find((item) => item.id === id);
  if (!card) return;
  if (isFav(id, lang)) state.favorites = state.favorites.filter((item) => !(item.id === id && (item.lang || "fr") === lang));
  else state.favorites.unshift(snapshot({ ...card, lang }));
  saveFavs();
  const button = document.querySelector("#fiche [data-action='fav']");
  if (button && button.dataset.id === id) {
    const on = isFav(id, lang);
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
    if (event.target.id === "binder-q") {
      clearTimeout(binderTimer);
      binderTimer = setTimeout(() => searchBinder(event.target.value), 280);
    }
    if (event.target.id === "univers-q") {
      state.universQuery = event.target.value;
      state.universPage = 1;
      paintUnivers();
    }
    if (event.target.id === "coll-name") {
      state.collection.name = looseName(event.target.value);
      saveCollection();
    }
    const noteId = event.target.dataset?.collNote;
    if (noteId) {
      const item = state.collection.items.find((row) => row.id === noteId);
      if (item) {
        item.note = looseNote(event.target.value);
        saveCollection();
      }
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
    if (event.target.id === "coll-named") {
      state.collection.named = event.target.checked;
      saveCollection();
    }
    if (event.target.id === "coll-favs") {
      state.collection.shareFavs = event.target.checked;
      saveCollection();
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

  document.addEventListener("submit", (event) => {
    if (event.target.id === "coll-form") event.preventDefault();
    if (event.target.id !== "binder-form") return;
    event.preventDefault();
    clearTimeout(binderTimer);
    searchBinder(document.getElementById("binder-q")?.value);
  });

  const relief = document.getElementById("relief");
  relief?.addEventListener("click", (event) => {
    if (event.target === relief) relief.close();
  });

  document.addEventListener("pointerdown", (event) => {
    const pocket = event.target.closest?.("[data-pocket]");
    if (!pocket || state.tab !== "classeur") return;
    const index = Number(pocket.dataset.pocket);
    const id = state.binder.pages[state.binder.page]?.[index];
    if (!id || (event.button != null && event.button !== 0)) return;
    event.preventDefault();
    lift = { id, from: index, x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    pocket.setPointerCapture?.(event.pointerId);
  });

  document.addEventListener("pointermove", (event) => {
    if (!lift || event.pointerId !== lift.pointerId) return;
    const dx = event.clientX - lift.x;
    const dy = event.clientY - lift.y;
    if (!lift.moved && dx * dx + dy * dy < 64) return;
    lift.moved = true;
    showGhost(lift.id, event.clientX, event.clientY);
  });

  document.addEventListener("pointerup", (event) => {
    if (!lift || event.pointerId !== lift.pointerId) return;
    const current = lift;
    lift = null;
    hideGhost();
    if (!current.moved) {
      openRelief(current.id, current.from);
      return;
    }
    suppressPocketClick = true;
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const pocket = under?.closest?.("[data-pocket]");
    if (pocket) {
      movePocket(current.from, Number(pocket.dataset.pocket));
      return;
    }
    const nav = under?.closest?.("[data-binder]");
    if (nav?.dataset.binder === "next") moveToPage(current.from, 1);
    if (nav?.dataset.binder === "prev") moveToPage(current.from, -1);
  });

  document.addEventListener("pointercancel", () => {
    lift = null;
    hideGhost();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener("click", (event) => {
    const binderEl = event.target.closest("[data-binder]");
    const pocketEl = event.target.closest("[data-pocket]");
    const actionEl = event.target.closest("[data-action]");
    const setEl = event.target.closest("[data-set]");
    const seriesEl = event.target.closest("[data-series]");
    const tabEl = event.target.closest("[data-tab]");
    const sealedEl = event.target.closest("[data-sealed]");
    const universEl = event.target.closest("[data-univers]");
    const openEl = event.target.closest("[data-open]");
    if (suppressPocketClick) {
      suppressPocketClick = false;
      return;
    }
    if (binderEl && state.tab === "classeur") {
      const kind = binderEl.dataset.binder;
      if (kind === "prev") turnBinder(-1);
      if (kind === "next") turnBinder(1);
      if (kind === "add-page") {
        state.binder.pages.push(emptyPage());
        state.binder.page = state.binder.pages.length - 1;
        state.binderSlot = null;
        saveBinder();
        paintBinder();
      }
      if (kind === "drop-page") {
        const page = state.binder.pages[state.binder.page];
        if (page && page.every((id) => !id) && state.binder.pages.length > 1) {
          state.binder.pages.splice(state.binder.page, 1);
          state.binder.page = Math.min(state.binder.page, state.binder.pages.length - 1);
          state.binderSlot = null;
          saveBinder();
          paintBinder();
        }
      }
      if (kind === "place") placeBinderCard(binderEl.dataset.id);
      if (kind === "remove") {
        const slot = Number(binderEl.dataset.slot);
        document.getElementById("relief")?.close();
        removeSlot(state.binder.page, slot);
      }
      return;
    }
    if (pocketEl && state.tab === "classeur") {
      const index = Number(pocketEl.dataset.pocket);
      const id = state.binder.pages[state.binder.page]?.[index];
      if (!id) {
        state.binderSlot = index;
        paintBinder();
        document.getElementById("binder-q")?.focus();
      }
      return;
    }
    if (sealedEl) {
      if (sealedEl.dataset.sealed === "kind") {
        state.sealedKind = sealedEl.dataset.kind || "tous";
        state.sealedPage = 1;
        render();
      }
    }
    if (universEl) {
      if (universEl.dataset.univers === "kind") {
        state.universKind = universEl.dataset.kind || "tous";
        state.universPage = 1;
        render();
      }
    }

    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === "close") actionEl.closest("dialog")?.close();
      if (action === "retry") {
        if (state.view === "search") runSearch(state.query);
        else loadSet(state.gallerySeriesId, state.setId);
      }
      if (action === "quote") quoteSet();
      if (action === "product") {
        const family = actionEl.dataset.family === "univers" ? "univers" : "sealed";
        const list = family === "univers" ? state.univers : state.sealed;
        const item = (list || []).find((row) => String(row.id) === actionEl.dataset.id);
        if (item) openProduct(item, family);
      }
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
      if (action === "fav") toggleFav(actionEl.dataset.id, actionEl.dataset.lang || state.market);
      if (action === "binder-add") {
        const lang = actionEl.dataset.lang || state.market;
        const card = cache.get(cacheKey(actionEl.dataset.id, lang));
        if (card) {
          dialog.close();
          rangerCard(card);
        }
      }
      if (action === "open-fiche") {
        document.getElementById("relief")?.close();
        openFiche(actionEl.dataset.id, { lang: actionEl.dataset.lang || state.market });
      }
      if (action === "coll-add") {
        const id = actionEl.dataset.id;
        const lang = actionEl.dataset.lang || state.market;
        const card = cache.get(cacheKey(id, lang));
        if (inCollection(id, lang)) removeFromCollection(id, lang);
        else if (card) addToCollection(card);
        const on = inCollection(id, lang);
        actionEl.textContent = on ? "Retirer de ma collection" : state.collection.items.length >= COLL_MAX ? "Collection pleine" : "Ajouter à ma collection";
        actionEl.disabled = !on && state.collection.items.length >= COLL_MAX;
        if (state.tab === "collection" && !state.visit) render();
      }
      if (action === "coll-remove") {
        removeFromCollection(actionEl.dataset.id, actionEl.dataset.lang || state.market);
        if (state.tab === "collection") render();
      }
      if (action === "coll-share") copyCollectionLink();
      if (action === "coll-mine") leaveVisit();
      if (action === "cote-mode") {
        state.coteMode = actionEl.dataset.mode === "melange" ? "melange" : "tendance";
        if (state.coteMode === "melange" && !state.hallOrder.length) {
          state.hallOrder = shuffleIds(state.hallCards.map((card) => card.id));
        }
        render();
      }
      if (action === "cote-shuffle") {
        state.coteMode = "melange";
        state.hallOrder = shuffleIds(state.hallCards.map((card) => card.id));
        render();
      }
      if (action === "fav-sort") {
        state.favSort = actionEl.dataset.sort || "ajout";
        render();
      }
      if (action === "unfav") {
        const lang = actionEl.dataset.lang || "fr";
        state.favorites = state.favorites.filter((item) => !(item.id === actionEl.dataset.id && (item.lang || "fr") === lang));
        saveFavs();
        render();
      }
      if (action === "random" || action === "random-next") {
        const pick = nextRandomId();
        if (pick) openFiche(pick, "random");
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

    if (openEl) openFiche(openEl.dataset.open, { lang: openEl.dataset.lang || state.market });
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "market-select") {
      applyMarket(event.target.value);
    }
    if (event.target.id === "currency-select") {
      const local = marketCurrency();
      state.currency = event.target.value === local ? local : "EUR";
      if (state.market === "fr") state.currency = "EUR";
      saveMarket();
      const paint = () => render();
      if (state.currency !== "EUR") loadFx().then(paint);
      else paint();
    }
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
    const target = event.target;
    if (state.tab === "classeur" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (dialog.open || document.getElementById("relief")?.open) return;
      event.preventDefault();
      turnBinder(event.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
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
    const strong = stage.classList.contains("is-holo");
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    stage.style.setProperty("--rx", `${(0.5 - y) * (strong ? 18 : 8)}deg`);
    stage.style.setProperty("--ry", `${(x - 0.5) * (strong ? 26 : 10)}deg`);
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
    if (img instanceof HTMLImageElement) img.classList.remove("is-trying", "is-broken");
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

  window.addEventListener("pageshow", () => wakeScans(document));
}

async function recoverFromMarket(img) {
  try {
    const card = await getCard(img.dataset.id, img.dataset.lang || state.market);
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

function pickSeriesId(list) {
  const ids = new Set((list || []).map((serie) => serie.id));
  for (const id of ["me", "sv", "SV", "S", "swsh", "base"]) {
    if (ids.has(id)) return id;
  }
  return list?.length ? list[list.length - 1].id : "";
}

function pickSetId(sets) {
  const copy = (sets || []).slice().sort((a, b) => String(a.releaseDate || "").localeCompare(String(b.releaseDate || "")));
  return copy.length ? copy[copy.length - 1].id : "";
}

async function openDefaultSet() {
  const token = ++marketToken;
  state.loading = true;
  state.error = "";
  try {
    const list = await fetchJSON("/series");
    if (token !== marketToken) return;
    state.series = Array.isArray(list) ? list : [];
    const seriesId = pickSeriesId(state.series);
    if (!seriesId) throw new Error("empty");
    const sets = await ensureSeriesSets(seriesId);
    if (token !== marketToken) return;
    const setId = pickSetId(sets);
    if (!setId) throw new Error("empty");
    await loadSet(seriesId, setId, { focus: state.tab === "galerie" });
  } catch {
    if (token !== marketToken) return;
    state.loading = false;
    state.error = "Cette collection ne s'ouvre pas.";
    if (state.tab === "galerie" || state.tab === "extensions") render();
  }
}

function applyMarket(lang) {
  if (!MARKETS[lang] || lang === state.market) return;
  epoch += 1;
  state.market = lang;
  state.currency = MARKETS[lang].currency;
  saveMarket();
  state.series = [];
  state.gallerySets = [];
  state.setCards = [];
  state.setDetail = null;
  state.searchCards = [];
  state.page = 1;
  state.view = "set";
  state.query = "";
  state.error = "";
  state.loading = true;
  state.gallerySeriesId = "";
  state.setId = "";
  state.browseSeriesId = "";
  state.browseSets = [];
  clearQueryBox();
  render();
  if (state.currency !== "EUR") loadFx().then(() => { if (state.market === lang) render(); });
  openDefaultSet();
}

function boot() {
  bind();
  registerServiceWorker();
  const context = readContext();
  if ((context.market || "fr") === state.market) {
    state.gallerySeriesId = context.seriesId;
    state.setId = context.setId;
    state.browseSeriesId = context.seriesId;
  } else if (state.market === "fr") {
    state.gallerySeriesId = "me";
    state.setId = "me05";
    state.browseSeriesId = "me";
  } else {
    state.gallerySeriesId = "";
    state.setId = "";
    state.browseSeriesId = "";
  }
  const params = new URLSearchParams(location.search);
  const token = params.get("voir");
  const openVisit = token
    ? decodeShare(token).then((visit) => {
      state.visit = visit || { error: true };
    }).catch(() => {
      state.visit = { error: true };
    })
    : Promise.resolve();
  openVisit.then(() => {
    const tab = state.visit ? "collection" : initialTab();
    rememberTab(tab);
    render();
    if (state.tab === "etb") loadSealed();
    if (state.tab === "univers") loadUnivers();
    updateFavCount();
    if (state.tab === "favoris") refreshFavs();
    if (state.tab === "collection") {
      hydrateVisit();
      refreshCollection();
    }
    if (state.tab === "cotes") loadHall();
    if (state.currency !== "EUR") loadFx().then(() => { if (state.tab === "galerie" || state.tab === "cotes") render(); });
    if (state.setId) {
      fetchJSON("/series")
        .then((list) => {
          state.series = Array.isArray(list) ? list : [];
          if (state.tab === "extensions") render();
        })
        .catch(() => {});
      loadIconics();
      loadSet(state.gallerySeriesId, state.setId, { focus: state.tab === "galerie" });
    } else {
      loadIconics();
      openDefaultSet();
    }
  });
}

boot();
