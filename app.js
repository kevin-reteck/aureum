import { ecrireCabinet, emailSession, lireCabinet, quitter } from "./comptes.js?v=84";

const CTX_KEY = "aureum.contexte";
const TABS = ["galerie", "extensions", "etb", "univers", "cotes", "collection", "classeur"];
const MUSEE = ["galerie", "extensions", "etb", "univers", "cotes"];
const MUSEE_SALLES = [
  ["galerie", "Galerie"],
  ["extensions", "Extensions"],
  ["etb", "ETB"],
  ["univers", "Univers"],
  ["cotes", "Cotes"],
];
const HONOR_MAX = 6;
const NOTE_MAX = 140;
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

const state = {
  tab: "collection",
  galerieFiltre: "toutes",
  museeSalle: "galerie",
  fraisId: "",
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
  hallLoading: false,
  hallFailed: false,
  coteSort: "desc",
  coteFamille: "cartes",
  coteGen: "toutes",
  cotePage: 1,
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
  universMarque: "",
  universSort: "ancien",
  universConsole: "",
  universQuery: "",
  universPage: 1,
  searchGames: [],
  photos: loadPhotos(),
  photoBusy: "",
  photoNote: "",
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
let productOpen = null;

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

function reliefPrix(card) {
  const prices = card?.pricing?.cardmarket;
  if (typeof prices?.trend === "number" || typeof prices?.avg === "number") return priceHTML(card);
  if (typeof card?.trend === "number") return `<span class="price">${esc(eur(card.trend))}</span>`;
  return `<span class="price-missing">Cote indisponible</span>`;
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

function usdDisplayMode() {
  const code = activeCurrency();
  if (code === "USD") return "usd";
  const usdRate = fxRates?.USD;
  if (typeof usdRate !== "number" || !(usdRate > 0)) return fxPromise ? "pending" : "unavailable";
  if (code === "EUR") return "converted";
  const rate = fxRates?.[code];
  if (typeof rate !== "number") return fxPromise ? "pending" : "unavailable";
  return "converted";
}

function usdConvertedAmount(amount) {
  const code = activeCurrency();
  const usdRate = fxRates.USD;
  if (code === "EUR") return amount / usdRate;
  return (amount / usdRate) * fxRates[code];
}

function formatMoney(amount, code) {
  if (code === "EUR") return eurFmt.format(amount);
  if (code === "USD") return usdFmt.format(amount);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).format(amount);
}

function usdPlain(amount) {
  if (typeof amount !== "number") return "";
  const mode = usdDisplayMode();
  if (mode === "pending") return "Conversion…";
  if (mode !== "converted") return usdFmt.format(amount);
  return formatMoney(usdConvertedAmount(amount), activeCurrency());
}

function usdHTML(amount) {
  if (typeof amount !== "number") return `<span class="price-missing">Cote indisponible</span>`;
  const mode = usdDisplayMode();
  if (mode === "pending") return `<span class="price-missing">Conversion…</span>`;
  return `<span class="price">${esc(usdPlain(amount))}</span>`;
}

function tcgplayerNote(when) {
  const dated = when ? ` Relevée le ${when}.` : "";
  const mode = usdDisplayMode();
  if (mode === "pending") return `Cote TCGPlayer en dollars.${dated} Conversion en cours. Pas une offre.`;
  if (mode === "unavailable") return `Cote TCGPlayer en dollars.${dated} La conversion est indisponible. Pas une offre.`;
  if (mode === "converted") {
    const word = activeCurrency() === "JPY" ? "yens" : "euros";
    return `Cote TCGPlayer en dollars.${dated} Affichée en ${word} après conversion, pas une cote Cardmarket. Pas une offre.`;
  }
  return `Cote TCGPlayer en dollars.${dated} Pas une offre.`;
}

function sealedFxTail() {
  const mode = usdDisplayMode();
  if (mode === "pending") return " Conversion en cours.";
  if (mode === "unavailable") return " La conversion est indisponible.";
  if (mode !== "converted") return "";
  const word = activeCurrency() === "JPY" ? "yens" : "euros";
  return ` Affichées en ${word} après conversion, pas une cote Cardmarket.`;
}

function paintOpenProduct() {
  if (!productOpen) return;
  const dialog = document.getElementById("fiche");
  if (!dialog?.open) {
    productOpen = null;
    return;
  }
  const list = productOpen.family === "univers" ? state.univers : state.sealed;
  const item = (list || []).find((row) => String(row.id) === productOpen.id);
  if (!item) return;
  dialog.innerHTML = productHTML(item, productOpen.family);
}

function repaintUsdTab() {
  if (state.tab === "etb") {
    if (document.getElementById("sealed-grid")) paintSealed();
    else render();
  } else if (state.tab === "univers") {
    if (document.getElementById("univers-grid")) paintUnivers();
    else render();
  } else if (state.tab === "cotes") {
    if (document.getElementById("cote-hall")) paintCotes();
    else render();
  }
  paintOpenProduct();
}

function settleUsdFx(tab) {
  if (activeCurrency() === "USD" || usdDisplayMode() === "converted") return;
  loadFx().then(() => {
    if (tab && state.tab !== tab) return;
    repaintUsdTab();
  });
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
  if (card.lang && card.lang !== state.market && MARKETS[card.lang]) bits.push(MARKETS[card.lang].label);
  if (firstEditionId(card)) bits.push("1re édition");
  if (card.rarity && card.rarity !== "None") bits.push(card.rarity);
  return bits.join(" · ");
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

let visuels = { logos: {}, cartes: {} };

function urlCarte(url) {
  if (typeof url !== "string") return "";
  if (url.startsWith("https://assets.tcgdex.net/")) return url;
  if (/^https:\/\/tcgplayer-cdn\.tcgplayer\.com\/product\/\d+_in_\d+x\d+\.jpg$/.test(url)) return url;
  if (/^https:\/\/images\.pokemontcg\.io\/[a-z0-9.]+\/[\w.-]+\.png$/i.test(url)) return url;
  if (/^https:\/\/pokecardex-scans\.b-cdn\.net\/sets\/[A-Za-z0-9-]+\/FR\/\d+\.jpg\?class=(?:sd|md|hd)$/.test(url)) return url;
  if (/^https:\/\/www\.pokepedia\.fr\/images\/[0-9a-f]\/[0-9a-f]{2}\/Carte_[A-Za-z0-9%._-]+\.png$/.test(url)) return url;
  return "";
}

function imageDe(card) {
  const local = urlCarte(visuels.cartes?.[card?.id]);
  const remote = typeof card?.image === "string" && card.image.startsWith("https://assets.tcgdex.net/") ? card.image : "";
  if (local && remote.includes("/en/")) return local;
  return remote || local || urlCarte(card?.image);
}

function artCandidates(base, size) {
  if (typeof base !== "string") return [];
  const produit = base.match(/^https:\/\/tcgplayer-cdn\.tcgplayer\.com\/product\/(\d+)_in_\d+x\d+\.jpg$/);
  if (produit) {
    const low = `https://tcgplayer-cdn.tcgplayer.com/product/${produit[1]}_in_400x400.jpg`;
    const high = `https://tcgplayer-cdn.tcgplayer.com/product/${produit[1]}_in_1000x1000.jpg`;
    return size === "high" ? [high, low] : [low, high];
  }
  if (/^https:\/\/images\.pokemontcg\.io\/[a-z0-9.]+\/[\w.-]+\.png$/i.test(base) && !/_hires\.png$/i.test(base)) {
    const high = base.replace(/\.png$/i, "_hires.png");
    return size === "high" ? [high, base] : [base, high];
  }
  const poke = base.match(/^https:\/\/pokecardex-scans\.b-cdn\.net\/sets\/([A-Za-z0-9-]+)\/FR\/(\d+)\.jpg\?class=(?:sd|md|hd)$/);
  if (poke) {
    const fichier = (classe) => `https://pokecardex-scans.b-cdn.net/sets/${poke[1]}/FR/${poke[2]}.jpg?class=${classe}`;
    return size === "high" ? [fichier("hd"), fichier("md")] : [fichier("sd"), fichier("md")];
  }
  if (/^https:\/\/www\.pokepedia\.fr\/images\/[0-9a-f]\/[0-9a-f]{2}\/Carte_[A-Za-z0-9%._-]+\.png$/.test(base)) return [base];
  if (!base.startsWith("https://assets.tcgdex.net/")) return [];
  const order = size === "high" ? ["high", "low"] : ["low", "high"];
  return order.flatMap((item) => [`${base}/${item}.webp`, `${base}/${item}.png`]);
}

async function loadVisuels() {
  try {
    const response = await fetch(new URL("visuels.json?v=84", location.href));
    if (!response.ok) return;
    const data = await response.json();
    const logos = {};
    const cartes = {};
    if (data?.logos && typeof data.logos === "object") {
      Object.entries(data.logos).forEach(([id, url]) => {
        if (!cleanId(id, "") || typeof url !== "string" || !url.startsWith("https://")) return;
        if (!/^https:\/\/(assets\.tcgdex\.net|images\.pokemontcg\.io|images\.scrydex\.com)\//.test(url) && !/^https:\/\/pokecardex\.b-cdn\.net\/assets\/images\/logos\/[A-Za-z0-9-]+\.png$/.test(url)) return;
        logos[id] = url;
      });
    }
    if (data?.cartes && typeof data.cartes === "object") {
      Object.entries(data.cartes).forEach(([id, url]) => {
        if (typeof id !== "string" || !/^[\w.%:!-]+$/.test(id) || typeof url !== "string") return;
        if (!urlCarte(url)) return;
        cartes[id] = url;
      });
    }
    visuels = { logos, cartes };
  } catch {
    /* Les scans du catalogue restent utilisés. */
  }
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
    .find(Boolean)
    || productId(card?.thirdParty?.tcgplayer);
  if (!product) return "";
  const px = quality === "high" ? 1000 : 400;
  return `https://tcgplayer-cdn.tcgplayer.com/product/${product}_in_${px}x${px}.jpg`;
}

function markBroken(img) {
  img.dataset.probing = "";
  img.classList.remove("is-trying");
  img.classList.add("is-broken");
  marquerScan(img);
}

function hoteScan(img) {
  return img.closest?.(".stage, .pocket-card") || null;
}

function marquerScan(img) {
  if (!(img instanceof HTMLImageElement)) return;
  const hote = hoteScan(img);
  if (!hote) return;
  const pret = img.complete && img.naturalWidth > 0 && !img.classList.contains("is-broken") && !img.classList.contains("is-trying");
  hote.classList.toggle("is-shown", pret);
}

function revealScan(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.complete && img.naturalWidth > 0) img.classList.remove("is-trying", "is-broken");
  marquerScan(img);
}

function wakeScans(root = document) {
  root.querySelectorAll("img[src]").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.remove("is-trying", "is-broken");
      marquerScan(img);
      return;
    }
    if (img.classList.contains("shot")) {
      img.classList.remove("is-trying");
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
  hoteScan(img)?.classList.remove("is-shown");
  if (img.getAttribute("src") !== src) img.src = src;
  else {
    img.classList.remove("is-trying");
    marquerScan(img);
  }
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
  const urls = artCandidates(imageDe(card), size);
  if (!urls.length) {
    const edition = editionArt(card, quality);
    if (edition) urls.push(edition);
    const market = marketArt(card, quality);
    if (market && market !== edition) urls.push(market);
  }
  const mark = esc(initials(card.name));
  if (!urls.length) return `<span class="monogram" data-label="${mark}">${mark}</span>`;
  const [src, ...rest] = urls;
  const charge = eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`;
  return `<img src="${esc(src)}" data-fallbacks="${esc(rest.join("|"))}" data-id="${esc(card.id || "")}" data-lang="${esc(card.lang || state.market)}" data-quality="${size === "high" ? "high" : "low"}" alt="${esc(prettyName(card.name))}" ${charge} decoding="async">`;
}

function logoTag(seriesId, setId) {
  const connu = visuels.logos?.[setId];
  if (typeof connu === "string" && connu.startsWith("https://")) {
    return `<img src="${esc(connu)}" alt="">`;
  }
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
  let copy = activeCards().map(resolveCard);
  if (state.view === "set" && state.galerieFiltre !== "toutes") {
    copy = copy.filter((card) => {
      const lang = card.lang || state.market;
      if (state.galerieFiltre === "cabinet") return possede(card.id, lang);
      if (state.galerieFiltre === "chasse") return cherchePiece(card.id, lang);
      return !possede(card.id, lang);
    });
  }
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
  const cards = sortedActive();
  if (state.view === "set") return cards;
  return cards.slice(0, state.page * PAGE_SIZE);
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
    const brut = lireCabinet("favoris");
    const raw = Array.isArray(brut) ? brut : [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && cleanId(item.id, "") && item.name).map((item) => ({
      ...item,
      lang: MARKETS[item.lang] ? item.lang : "fr",
    }));
  } catch {
    return [];
  }
}

function noterStockage(ok) {
  if (ok !== false) return;
  let note = document.getElementById("stockage-note");
  if (!note) {
    note = document.createElement("p");
    note.id = "stockage-note";
    note.className = "banner";
    note.setAttribute("role", "alert");
    document.querySelector("main")?.prepend(note);
  }
  note.textContent = "Le navigateur refuse d'enregistrer. Libère un peu de place, puis réessaie.";
}

function saveFavs() {
  noterStockage(ecrireCabinet("favoris", state.favorites));
  updateFavCount();
}

function isFav(id, lang = state.market) {
  return state.favorites.some((item) => item.id === id && (item.lang || "fr") === (lang || "fr"));
}

function snapshot(card) {
  const flags = variantFlags(card);
  return {
    id: card.id,
    name: card.name,
    image: card.image || "",
    setName: card.set?.name || "",
    localId: card.localId || "",
    rarity: card.rarity || "",
    variants: flags,
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
  const door = MUSEE.includes(state.tab) ? "musee" : state.tab;
  document.querySelectorAll(".tabs [data-tab]").forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.tab === door ? "true" : "false");
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
    if (node.classList.contains("piece")) {
      const line = node.querySelector(".price-line");
      const trend = full.pricing?.cardmarket?.trend;
      if (line && typeof trend === "number") line.innerHTML = `<span class="price">${esc(eur(trend))}</span>`;
      const art = node.querySelector(".piece-art");
      if (art && !art.querySelector("img")) {
        const markup = imgTag(full, "low", false);
        if (markup.includes("<img")) {
          art.innerHTML = markup;
          wakeScans(art);
        }
      }
      return;
    }
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
    const base = imageDe(full);
    const scan = artCandidates(base, quality)[0] || "";
    if (img && scan && String(img.getAttribute("src") || "").includes("tcgplayer-cdn")) {
      img.dataset.fallbacks = artCandidates(base, quality).slice(1).join("|");
      img.dataset.market = "";
      img.dataset.probing = "";
      img.classList.remove("is-broken", "is-trying");
      img.src = scan;
    } else if (img && scan && !img.getAttribute("src")) {
      img.src = scan;
    } else if (img && !scan && marketArt(full, quality)) {
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
  const select = state.view === "search"
    ? `<p class="note">Toutes les cartes, de toutes les extensions.</p>`
    : options
      ? `<label class="field">Extension<select id="set-select">${options}</select></label>`
      : "";
  return `
    <div class="toolbar">
      <div class="controls">
        ${select}
        <div class="tool-more">
          ${marketSelects()}
          <label class="field">Tri
            <select id="sort-select">
              <option value="numero"${state.sort === "numero" ? " selected" : ""}>Numéro</option>
              <option value="nom"${state.sort === "nom" ? " selected" : ""}>Nom</option>
              <option value="cote"${state.sort === "cote" ? " selected" : ""}>Tendance</option>
            </select>
          </label>
          <button class="btn" type="button" data-action="random">Carte au hasard</button>
        </div>
      </div>
    </div>
    ${priceModeNote() ? `<p class="note">${esc(priceModeNote())}</p>` : ""}
  `;
}

function noteCatalogue() {
  if (state.view !== "set" || state.market === "en") return "";
  const anglais = state.setCards.filter((card) => card.lang === "en").length;
  if (!anglais) return "";
  if (anglais === state.setCards.length) return `<p class="note">Ces cartes viennent du catalogue anglais.</p>`;
  const mot = anglais > 1 ? "cartes viennent" : "carte vient";
  return `<p class="note">${anglais} ${mot} du catalogue anglais.</p>`;
}

function headHTML() {
  if (state.view === "search" && state.loading && state.searchCards.length === 0) {
    return `
      <header class="section-head">
        <div>
          <p class="kicker">Cartes et jeux</p>
          <h2>Résultats pour « ${esc(state.query)} »</h2>
        </div>
        <p class="lede" id="grille-status">Lecture du catalogue…</p>
      </header>
      <p class="note" id="hydrate-note"></p>`;
  }
  if (state.view === "search") {
    const jeux = (state.searchGames || []).length;
    const jeuMot = jeux > 1 ? "jeux" : "jeu";
    const jeuBit = jeux ? `${jeux} ${jeuMot}. ` : "";
    if (!state.searchTotal) {
      return `
        <header class="section-head">
          <div>
            <p class="kicker">Cartes et jeux</p>
            <h2>Résultats pour « ${esc(state.query)} »</h2>
          </div>
          <p class="lede" id="grille-status">${jeuBit}Aucune carte ne porte ce nom.</p>
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
          <p class="kicker">Cartes et jeux</p>
          <h2>Résultats pour « ${esc(state.query)} »</h2>
        </div>
        <p class="lede" id="grille-status">${jeuBit}${shown} ${mot} sur ${state.searchTotal}.${extra}</p>
      </header>
      <p class="note" id="hydrate-note"></p>`;
  }
  const detail = state.setDetail;
  const title = detail ? prettyName(detail.name) : state.loading ? "Chargement…" : "Galerie";
  const bits = [];
  if (detail?.releaseDate) bits.push(formatDay(detail.releaseDate));
  if (detail?.cardCount || state.setCards.length) {
    const official = detail?.cardCount?.official || 0;
    const total = Math.max(detail?.cardCount?.total || 0, state.setCards.length);
    bits.push(countLine({ official, total }));
  }
  if (detail?.serie?.name) bits.push(prettyName(detail.serie.name));
  return `
    <header class="section-head" id="grille-titre">
      <div>
        <p class="kicker">En vitrine</p>
        <h2>${esc(title)}</h2>
      </div>
      <p class="lede" id="grille-status">${esc(bits.join(" · "))}</p>
    </header>
    ${progresHTML()}
    ${state.setId === "base1" ? `<p class="note">1re édition : le petit 1 est à gauche du descriptif, sous l'illustration.</p>` : ""}
    ${noteCatalogue()}
    <p class="note" id="hydrate-note"></p>`;
}

function murActif() {
  if (state.view !== "set") return false;
  if (state.galerieFiltre === "manquantes" || state.galerieFiltre === "chasse") return true;
  return state.setCards.some((card) => possede(card.id, card.lang || state.market));
}

function statutTuile(id, lang, mur) {
  if (possede(id, lang)) return "possede";
  if (cherchePiece(id, lang)) return "cherche";
  if (mur) return "niche";
  return "libre";
}

function poseHTML(id, lang, family) {
  const on = possede(id, lang);
  const familyAttr = family ? ` data-family="${family}"` : "";
  const label = on ? "Retirer du cabinet" : "Je l'ai";
  return `<button class="slot-pose" type="button" data-action="coll-pose" data-id="${esc(String(id))}" data-lang="${esc(lang || "fr")}"${familyAttr} aria-label="${label}" aria-pressed="${on ? "true" : "false"}"><span aria-hidden="true">${on ? "✓" : "+"}</span></button>`;
}

function progresHTML() {
  if (state.view !== "set" || !state.setCards.length) return "";
  let owned = 0;
  state.setCards.forEach((card) => {
    if (possede(card.id, card.lang || state.market)) owned += 1;
  });
  const total = state.setCards.length;
  const pct = Math.max(0, Math.min(100, Math.round((owned / total) * 100)));
  const filtres = [
    ["toutes", "Toutes"],
    ["cabinet", "À moi"],
    ["manquantes", "Manque"],
    ["chasse", "Chasse"],
  ];
  return `
    <div class="progres">
      <p><strong>${owned}</strong> sur ${total}</p>
      <div class="progres-ligne" role="presentation"><span style="width:${pct}%"></span></div>
    </div>
    <div class="filtre-rail" role="group" aria-label="Filtrer l'extension">
      ${filtres.map(([id, label]) => `<button type="button" data-action="galerie-filtre" data-filtre="${id}" aria-pressed="${state.galerieFiltre === id ? "true" : "false"}">${label}</button>`).join("")}
    </div>`;
}

function museeRail() {
  const salles = MUSEE_SALLES.map(([id, label]) => `
    <button type="button" data-tab="${id}" aria-pressed="${state.tab === id ? "true" : "false"}">${label}</button>`).join("");
  return `<div class="salle-rail" role="navigation" aria-label="Salles du musée">${salles}</div>`;
}

function tileHTML(card, eager = false) {
  const full = resolveCard(card);
  const ready = Boolean(full.pricing) || cache.has(cacheKey(card.id, card.lang || state.market));
  const lang = card.lang || state.market;
  const statut = statutTuile(card.id, lang, murActif());
  const frais = state.fraisId && state.fraisId === card.id ? " is-frais" : "";
  return `
    <article class="tile is-${statut}${frais}" data-card="${esc(card.id)}">
      ${poseHTML(card.id, lang)}
      <button class="tile-hit" type="button" data-open="${esc(card.id)}" data-lang="${esc(lang)}">
        <span class="art" data-label="${esc(initials(full.name))}">${imgTag(full, "low", eager)}</span>
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
    const jeux = state.view === "search" && (state.searchGames || []).length;
    grille.innerHTML = jeux ? "" : `<p class="empty">Aucune carte ne correspond.</p>`;
    if (foot) foot.innerHTML = "";
    watchMore();
    return;
  }
  grille.innerHTML = `<div class="grid">${shown.map((card, index) => tileHTML(card, index < 4)).join("")}</div>`;
  const more = activeCards().length > shown.length;
  if (foot) foot.innerHTML = more ? `<div class="more-sentinel" data-more="galerie"></div>` : "";
  watchMore();
}

function galleryHTML() {
  return `
    ${state.error ? `<p class="banner" role="alert">${esc(state.error)} <button class="btn" type="button" data-action="retry">Réessayer</button></p>` : ""}
    ${state.view === "set" ? headHTML() : ""}
    ${toolbarHTML()}
    ${state.view === "set" ? "" : headHTML()}
    ${rechercheJeuxHTML()}
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
      <div class="chip-rail"><div class="series-row">${seriesButtons || `<p class="empty">Chargement des séries…</p>`}</div></div>
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

const COTES_FAMILLES = [
  ["tout", "Tout"],
  ["cartes", "Cartes"],
  ["etb", "ETB"],
  ["coffret", "Coffrets"],
  ["upc", "UPC"],
];

const COTES_GENS = [
  ["me", "Méga-Évolution", ["me"]],
  ["sv", "Écarlate et Violet", ["sv"]],
  ["swsh", "Épée et Bouclier", ["swsh"]],
  ["sm", "Soleil et Lune", ["sm"]],
  ["xy", "XY", ["xy"]],
  ["bw", "Noir et Blanc", ["bw"]],
  ["hgss", "HeartGold SoulSilver", ["hgss", "col"]],
  ["dp", "Diamant et Perle", ["dp", "pl", "pop"]],
  ["ex", "EX", ["ex"]],
  ["neo", "Neo", ["neo", "ecard"]],
  ["base", "Set de base", ["base", "gym", "lc"]],
];

const SERIE_PREFIXES = ["swsh", "hgss", "ecard", "base", "gym", "neo", "pop", "col", "bw", "xy", "sm", "sv", "me", "dp", "pl", "ex", "lc"];

function serieDepuisId(setId) {
  const id = String(setId || "").toLowerCase();
  return SERIE_PREFIXES.find((prefix) => id === prefix || id.startsWith(prefix)) || "";
}

function genDepuisSerie(serie) {
  const hit = COTES_GENS.find(([, , series]) => series.includes(serie));
  return hit ? hit[0] : "";
}

function carteGen(card) {
  const setId = card?.set?.id || String(card?.id || "").split("-")[0];
  return genDepuisSerie(serieDepuisId(setId));
}

function sealedGen(item) {
  const set = String(item?.set || "");
  if (/^ME\d|^ME:/.test(set) || set === "First Partner Collection 2026") return "me";
  if (/^SV\d|^SV:/.test(set)) return "sv";
  if (/^SWSH|^Pokemon GO$|^Celebrations$|^Champion's Path$|^Shining Fates$/.test(set)) return "swsh";
  if (/^SM\b|^SM -|^Hidden Fates$|^Shining Legends$|^Dragon Majesty$|^Detective Pikachu$/.test(set)) return "sm";
  if (/^XY\b|^XY -|^Generations$/.test(set)) return "xy";
  if (set === "Next Destinies" || set === "Emerging Powers") return "bw";
  if (set === "Southern Islands") return "base";
  return "";
}

function coteGenNom(id) {
  if (id === "autres") return "hors série connue";
  const hit = COTES_GENS.find(([gen]) => gen === id);
  return hit ? hit[1] : "";
}

function coteVeutCartes(famille = state.coteFamille) {
  return famille === "tout" || famille === "cartes";
}

function coteVeutBoites(famille = state.coteFamille) {
  return famille !== "cartes";
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
  state.hallFailed = rows.length === 0;
  state.hallLoading = false;
  if (state.tab === "cotes") render();
}

function coteNom(row) {
  return row.kind === "carte" ? prettyName(row.card.name) : String(row.item?.name || "");
}

function coteEntries(famille = state.coteFamille, gen = state.coteGen) {
  const rows = [];
  if (coteVeutCartes(famille)) {
    state.hallCards.forEach((card) => {
      const groupe = carteGen(card);
      if (gen === "autres") return;
      if (gen !== "toutes" && groupe !== gen) return;
      const euro = trendOf(card);
      rows.push({ kind: "carte", euro: euro >= 0 ? euro : null, card });
    });
  }
  if (coteVeutBoites(famille) && Array.isArray(state.sealed)) {
    state.sealed.forEach((item) => {
      if (typeof item.usd !== "number") return;
      if (famille === "etb" || famille === "coffret" || famille === "upc") {
        if (item.kind !== famille) return;
      }
      const groupe = sealedGen(item);
      if (gen === "autres") {
        if (groupe) return;
      } else if (gen !== "toutes" && groupe !== gen) return;
      const euro = typeof item.usd === "number" ? boxEuro(item.usd) : null;
      rows.push({ kind: "boite", euro, item });
    });
  }
  const dir = state.coteSort === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const aManque = typeof a.euro !== "number";
    const bManque = typeof b.euro !== "number";
    if (aManque !== bManque) return aManque ? 1 : -1;
    if (!aManque && a.euro !== b.euro) return (a.euro - b.euro) * dir;
    if (aManque && bManque && a.kind === "boite" && b.kind === "boite") {
      const au = typeof a.item.usd === "number" ? a.item.usd : -1;
      const bu = typeof b.item.usd === "number" ? b.item.usd : -1;
      if (au !== bu) return (au - bu) * dir;
    }
    return coteNom(a).localeCompare(coteNom(b), "fr");
  });
  return rows;
}

function coteAttente() {
  const cartes = coteVeutCartes();
  const boites = coteVeutBoites();
  if (boites && !state.sealed && !state.sealedError) return "Ouverture des coffrets…";
  if (boites && state.sealed && usdDisplayMode() === "pending") return "Conversion des cotes en euros…";
  if (cartes && !state.hallFailed && !state.hallCards.length) return "Lecture des cotes…";
  return "";
}

function cotePhrase() {
  const sens = state.coteSort === "asc" ? "de la moins chère à la plus chère" : "de la plus chère à la moins chère";
  const gen = state.coteGen === "toutes" ? "" : coteGenNom(state.coteGen);
  let sujet = "Tout mélangé";
  if (state.coteFamille === "cartes") sujet = "Cartes de l'étagère";
  else if (state.coteFamille === "etb") sujet = "ETB";
  else if (state.coteFamille === "coffret") sujet = "Coffrets";
  else if (state.coteFamille === "upc") sujet = "UPC";
  return `${gen ? `${sujet}, ${gen}` : sujet}, ${sens}`;
}

function coteSource() {
  if (state.coteFamille === "cartes") return "Cotes Cardmarket en euros.";
  if (state.sealedError && !state.sealed) return "Les coffrets n'ont pas pu être chargés.";
  const mode = usdDisplayMode();
  if (mode === "usd") {
    if (state.coteFamille === "tout") return "Cartes Cardmarket en euros. Coffrets TCGPlayer en dollars.";
    return "Cotes TCGPlayer en dollars. Pas une cote Cardmarket.";
  }
  if (mode === "unavailable") return "Cotes TCGPlayer en dollars. La conversion en euros est indisponible.";
  if (state.coteFamille === "tout") return "Cartes Cardmarket en euros. Coffrets TCGPlayer convertis en euros.";
  return "Cotes TCGPlayer converties en euros. Pas une cote Cardmarket.";
}

function coteStatus(total) {
  if (coteAttente()) return coteAttente();
  if (!total) return `Rien dans ce filtre. ${cotePhrase()}.`;
  const shown = Math.min(state.cotePage * PAGE_SIZE, total);
  const compte = shown < total ? `${shown} sur ${total}` : String(total);
  return `${compte}. ${cotePhrase()}. ${coteSource()}`;
}

function coteHeroBox(item, euro) {
  const dear = typeof euro === "number" && euro >= DEAR_EUR;
  const prix = typeof item.usd === "number" ? usdPlain(item.usd) : "";
  const meta = [sealedLabel(item.kind), item.set].filter(Boolean).join(" · ");
  return `
    <article class="cote-hero${dear ? " is-dear" : ""}">
      <button class="cote-open is-box" type="button" data-action="product" data-family="sealed" data-id="${esc(item.id)}" aria-label="${esc(item.name)}">
        <span class="art is-box" data-label="${esc(initials(item.name))}">
          ${boxImg(item, false)}
        </span>
      </button>
      <div>
        ${dear ? `<p class="cote-wow">Elle coûte cher.</p>` : ""}
        <p class="cote-price">${esc(prix)}</p>
        <h3 class="cote-name">${esc(item.name)}</h3>
        <p class="tile-meta">${esc(meta)}</p>
        <p class="note">Cote TCGPlayer. Pas une offre.</p>
      </div>
    </article>`;
}

function coteRang(row, index) {
  const rang = String(index + 1).padStart(2, "0");
  if (row.kind === "carte") {
    const card = row.card;
    return `
      <li>
        <button type="button" data-open="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}">
          <span class="rank">${rang}</span>
          <span class="rank-art" data-label="${esc(initials(card.name))}">${imgTag(card, "low", false)}</span>
          <span class="rank-copy">
            <span class="rank-name">${esc(prettyName(card.name))}</span>
            <span class="rank-meta">${esc(metaLine(card))}</span>
          </span>
          <span class="rank-val">${priceHTML(card)}</span>
        </button>
      </li>`;
  }
  const item = row.item;
  const meta = [sealedLabel(item.kind), item.set].filter(Boolean).join(" · ");
  const prix = typeof item.usd === "number" ? usdHTML(item.usd) : `<span class="price-missing">Cote indisponible</span>`;
  return `
    <li>
      <button type="button" data-action="product" data-family="sealed" data-id="${esc(item.id)}">
        <span class="rank">${rang}</span>
        <span class="rank-art is-box" data-label="${esc(initials(item.name))}">
          ${boxImg(item, false)}
        </span>
        <span class="rank-copy">
          <span class="rank-name">${esc(item.name)}</span>
          <span class="rank-meta">${esc(meta)}</span>
        </span>
        <span class="rank-val">${prix}</span>
      </button>
    </li>`;
}

function coteCorps(rows) {
  const attente = coteAttente();
  if (attente) return `<p class="note">${esc(attente)}</p>${skeletonRanks(4)}`;
  if (coteVeutCartes() && state.hallFailed && !state.hallCards.length && state.coteFamille === "cartes") {
    return `<p class="note">Les cotes ne répondent pas. Rouvre la salle dans un instant.</p>`;
  }
  if (coteVeutBoites() && state.sealedError && !state.sealed && state.coteFamille !== "tout") {
    return `<p class="note">${esc(state.sealedError)} <button class="btn" type="button" data-action="sealed-retry">Réessayer</button></p>`;
  }
  if (!rows.length) return `<p class="note">Rien dans ce filtre.</p>`;
  const shown = rows.slice(0, state.cotePage * PAGE_SIZE);
  const premier = shown[0];
  const hero = premier.kind === "carte" ? coteHero(premier.card) : coteHeroBox(premier.item, premier.euro);
  const suite = shown.slice(1).map((row, index) => coteRang(row, index + 1)).join("");
  const alerte = state.coteFamille === "tout" && state.sealedError && !state.sealed
    ? `<p class="note">${esc(state.sealedError)} <button class="btn" type="button" data-action="sealed-retry">Réessayer</button></p>`
    : "";
  return `${alerte}${hero}${suite ? `<ol class="ranks">${suite}</ol>` : ""}`;
}

function coteSuite(total) {
  if (coteAttente() || state.cotePage * PAGE_SIZE >= total) return "";
  return `<div class="more-sentinel" data-more="cotes"></div>`;
}

function paintCotes() {
  const hall = document.getElementById("cote-hall");
  const foot = document.getElementById("cote-foot");
  const status = document.getElementById("cote-status");
  if (!hall || !foot || !status) {
    render();
    return;
  }
  const rows = coteEntries();
  status.textContent = coteStatus(rows.length);
  hall.innerHTML = coteCorps(rows);
  foot.innerHTML = coteSuite(rows.length);
  watchMore();
  wakeScans(hall);
}

function cotesHTML() {
  const rows = coteEntries();
  const tri = (id, label) => `<button class="fav-sort-btn" type="button" data-action="cote-sort" data-sort="${id}" aria-pressed="${state.coteSort === id ? "true" : "false"}">${label}</button>`;
  const familles = COTES_FAMILLES.map(([id, label]) => `
    <button type="button" data-action="cote-famille" data-famille="${id}" aria-pressed="${state.coteFamille === id ? "true" : "false"}">${label}</button>`).join("");
  const gens = [["toutes", "Toutes"]];
  COTES_GENS.forEach(([id, label]) => {
    if (coteEntries(state.coteFamille, id).length || state.coteGen === id) gens.push([id, label]);
  });
  if (coteEntries(state.coteFamille, "autres").length || state.coteGen === "autres") gens.push(["autres", "Autres"]);
  const generations = gens.map(([id, label]) => `
    <button type="button" data-action="cote-gen" data-gen="${id}" aria-pressed="${state.coteGen === id ? "true" : "false"}">${label}</button>`).join("");
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
        <p class="lede">Ce n'est pas la sélection du jour, et l'heure de Paris n'y change rien. Les cartes forment une étagère fixe, cotée sur Cardmarket. Tu peux tout mélanger avec les ETB, coffrets et UPC, ou ne garder qu'une génération.</p>
      </header>
      <div class="fav-sort" role="group" aria-label="Sens de la cote">
        ${tri("desc", "Plus chères")}
        ${tri("asc", "Moins chères")}
      </div>
      <div class="chip-rail"><div class="series-row cote-filtres" role="group" aria-label="Famille">${familles}</div></div>
      <div class="chip-rail"><div class="series-row cote-filtres" role="group" aria-label="Génération">${generations}</div></div>
      <p class="note" id="cote-status">${esc(coteStatus(rows.length))}</p>
      <div id="cote-hall">${coteCorps(rows)}</div>
      <div class="foot-row" id="cote-foot">${coteSuite(rows.length)}</div>
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
        <p class="lede">Ouvrez une fiche, puis ajoutez la carte aux favoris. Elle reste dans ton compte.</p>
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
        <p class="lede">Les cartes épinglées restent dans ton compte, sur cet appareil. eBay s'ouvre trié du moins cher au plus cher. Vinted s'ouvre sur les annonces les plus proches de la carte.</p>
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

function boxSrc(id, size = "low") {
  const product = String(id);
  if (size === "200w") return `https://tcgplayer-cdn.tcgplayer.com/product/${product}_200w.jpg`;
  const px = size === "high" ? 1000 : 400;
  return `https://tcgplayer-cdn.tcgplayer.com/product/${product}_in_${px}x${px}.jpg`;
}

function boxFallbacks(id, sizes) {
  return sizes.map((size) => boxSrc(id, size)).join("|");
}

function boxImg(item, alt) {
  return `<img src="${esc(boxSrc(item.id))}" data-fallbacks="${esc(boxFallbacks(item.id, ["high", "200w"]))}" alt="${esc(alt ? item.name : "")}" decoding="async">`;
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
  return `${shown} sur ${total}. Cotes TCGPlayer en dollars${date}.${sealedFxTail()}`;
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
    const statut = statutTuile(item.id, "fr", false);
    return `
      <article class="tile is-${statut}${state.fraisId === String(item.id) ? " is-frais" : ""}">
        ${poseHTML(item.id, "fr", "sealed")}
        <button class="tile-hit" type="button" data-action="product" data-family="sealed" data-id="${esc(item.id)}">
          <span class="art is-box" data-label="${esc(initials(item.name))}">
            ${boxImg(item, true)}
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
        <div class="chip-rail"><div class="series-row" role="group" aria-label="Type de coffret">${filters}</div></div>
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

let sealedPromise = null;

async function loadSealed() {
  if (state.sealed) return state.sealed;
  if (sealedPromise) return sealedPromise;
  state.sealedLoading = true;
  state.sealedError = "";
  if (state.tab === "etb") render();
  sealedPromise = (async () => {
    try {
      const response = await fetch("./sealed.json");
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      state.sealed = Array.isArray(data.products) ? data.products : [];
      state.sealedAsOf = typeof data.asOf === "string" ? data.asOf : "";
      state.sealedError = "";
      return state.sealed;
    } catch {
      state.sealedError = "Les coffrets n'ont pas pu être chargés.";
      return null;
    } finally {
      state.sealedLoading = false;
      sealedPromise = null;
      if (state.tab === "etb") render();
      else if (state.tab === "cotes" && state.coteFamille !== "cartes") render();
    }
  })();
  return sealedPromise;
}

function universKind(value) {
  return UNIVERS_KINDS.some(([id]) => id === value && id !== "tous") ? value : "";
}

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

function pieceLabel(kind) {
  if (boxKind(kind)) return sealedLabel(kind);
  if (universKind(kind)) return universLabel(kind);
  return "Pièce";
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

function consolesDe(item) {
  return String(item?.set || "").split(",").map((part) => part.trim()).filter(Boolean);
}

function ordreConsoles() {
  const first = new Map();
  (state.univers || []).forEach((item) => {
    if (item.kind !== "jeu") return;
    const rel = item.released || "9999";
    consolesDe(item).forEach((name) => {
      const prev = first.get(name);
      if (!prev || rel < prev) first.set(name, rel);
    });
  });
  return [...first.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0], "fr"))
    .map(([name]) => name);
}

function rangConsole(item) {
  if (item?.kind !== "jeu") return 1000;
  const ordre = ordreConsoles();
  const indexes = consolesDe(item).map((name) => ordre.indexOf(name)).filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : 999;
}

function marqueDe(item) {
  if (item?.kind !== "jouet") return "";
  const set = String(item.set || "");
  if (set.startsWith("LEGO")) return "lego";
  if (set === "Mega Construx") return "mega";
  return "";
}

function universRows() {
  const q = normPhoto(state.universQuery);
  const tokens = q.split(" ").filter(Boolean);
  let rows = (Array.isArray(state.univers) ? state.univers : []).filter((item) => !item.bundle);
  if (state.universMarque) rows = rows.filter((item) => marqueDe(item) === state.universMarque);
  else if (state.universKind !== "tous") rows = rows.filter((item) => item.kind === state.universKind);
  if (state.universConsole && (state.universKind === "tous" || state.universKind === "jeu")) {
    rows = rows.filter((item) => item.kind === "jeu" && consolesDe(item).includes(state.universConsole));
  }
  if (tokens.length) {
    rows = rows.filter((item) => {
      const faces = Array.isArray(item.faces) ? item.faces.map((face) => face.name).join(" ") : "";
      const blob = normPhoto(`${item.name} ${item.set} ${faces}`);
      return tokens.every((token) => blob.includes(token));
    });
  }
  const copy = rows.slice();
  const key = (item) => item.released || "9999";
  if (state.universSort === "nom") copy.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  else if (state.universSort === "cote") {
    const montant = (item) => {
      const value = universMontant(item);
      return typeof value === "number" ? value : -1;
    };
    copy.sort((a, b) => montant(b) - montant(a) || a.name.localeCompare(b.name, "fr"));
  }
  else if (state.universSort === "recent") copy.sort((a, b) => key(b).localeCompare(key(a)) || a.name.localeCompare(b.name, "fr"));
  else if (state.universSort === "console") copy.sort((a, b) => rangConsole(a) - rangConsole(b) || key(a).localeCompare(key(b)) || a.name.localeCompare(b.name, "fr"));
  else copy.sort((a, b) => key(a).localeCompare(key(b)) || a.name.localeCompare(b.name, "fr"));
  return copy;
}

function jeuxCorrespondants(query) {
  const tokens = normPhoto(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  return (state.univers || [])
    .filter((item) => item.kind === "jeu" && !item.bundle)
    .filter((item) => {
      const faces = Array.isArray(item.faces) ? item.faces.map((face) => face.name).join(" ") : "";
      const blob = normPhoto(`${item.name} ${item.set} ${faces}`);
      return tokens.every((token) => blob.includes(token));
    })
    .sort((a, b) => (a.released || "9999").localeCompare(b.released || "9999") || a.name.localeCompare(b.name, "fr"));
}

function universStatus() {
  const total = universRows().length;
  if (!total) return "Aucun résultat pour ce filtre.";
  const shown = Math.min(state.universPage * PAGE_SIZE, total);
  const mode = usdDisplayMode();
  let boosters = "Les boosters sont cotés en dollars TCGPlayer.";
  if (mode === "converted") {
    const word = activeCurrency() === "JPY" ? "yens" : "euros";
    boosters = `Les boosters sont cotés en dollars TCGPlayer, affichés en ${word} après conversion, pas une cote Cardmarket.`;
  } else if (mode === "pending") {
    boosters = "Les boosters sont cotés en dollars TCGPlayer. Conversion en cours.";
  } else if (mode === "unavailable") {
    boosters = "Les boosters sont cotés en dollars TCGPlayer. La conversion est indisponible.";
  }
  return `${shown} sur ${total}. ${boosters} Sans cote TCGPlayer, le prix d'un exemplaire complet s'affiche quand les ventes terminées le donnent, avec la date du relevé.`;
}

function universMontant(item) {
  if (typeof item?.usd === "number") return item.usd;
  if (typeof item?.sale?.usd === "number") return item.sale.usd;
  return null;
}

function universParts(item) {
  const parts = item?.sale?.parts;
  if (!Array.isArray(parts)) return [];
  return parts.filter((part) => part && typeof part.name === "string" && part.name && typeof part.usd === "number");
}

function venteChange() {
  const mode = usdDisplayMode();
  if (mode === "pending") return " Conversion en cours.";
  if (mode === "unavailable") return " La conversion est indisponible.";
  if (mode === "converted") return activeCurrency() === "JPY" ? " Affiché en yens." : " Affiché en euros.";
  return "";
}

function venteNote(item) {
  const sale = item?.sale;
  if (!sale || typeof sale.usd !== "number") return "Pas de cote unitaire pour cette ligne.";
  const when = formatDay(sale.at ? `${sale.at}T12:00:00` : "");
  const date = when ? ` Vérifiée le ${when}.` : "";
  const change = venteChange();
  const parts = universParts(item);
  if (parts.length >= 2) {
    const lines = parts.map((part) => `${part.name} ${usdPlain(part.usd)}`).join(", ");
    return `Chaque version, exemplaire complet, d'après les ventes terminées : ${lines}.${date}${change} Pas une offre.`;
  }
  const grade = sale.kind === "neuf"
    ? "exemplaire neuf"
    : sale.kind === "sans-boite"
      ? "exemplaire sans boîte"
      : "exemplaire complet";
  return `Prix d'un ${grade}, d'après les ventes terminées.${date}${change} Pas une offre.`;
}

function universPrixHTML(item) {
  const parts = universParts(item);
  if (parts.length >= 2) {
    return parts.map((part) => `<span class="price"><span class="price-name">${esc(part.name)}</span> ${esc(usdPlain(part.usd))}</span>`).join("");
  }
  return usdHTML(universMontant(item));
}

function loadPhotos() {
  try {
    const raw = lireCabinet("photos");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out = {};
    Object.entries(raw).forEach(([id, value]) => {
      if (!cleanId(id, "") || !value || typeof value !== "object") return;
      const url = typeof value.url === "string" && value.url.startsWith("https://archives.bulbagarden.net/") ? value.url : "";
      const rejected = Array.isArray(value.rejected)
        ? value.rejected.filter((row) => typeof row === "string" && row.startsWith("https://")).slice(-12)
        : [];
      if (url || rejected.length) out[id] = { url, rejected };
    });
    return out;
  } catch {
    return {};
  }
}

function savePhotos() {
  noterStockage(ecrireCabinet("photos", state.photos));
}

function nomFichier(url) {
  try {
    const file = decodeURIComponent(new URL(url).pathname).split("/").pop() || "";
    return file.replace(/^\d+px-/i, "").toLowerCase();
  } catch {
    return "";
  }
}

function photoChoisie(id) {
  const row = state.photos?.[String(id)];
  return row && typeof row.url === "string" && row.url.startsWith("https://archives.bulbagarden.net/") ? row.url : "";
}

function universSrc(item) {
  const local = imageLocale(item?.image);
  if (local) return local;
  const choisi = photoChoisie(item?.id);
  if (choisi) return choisi;
  if (typeof item?.image === "string" && item.image.startsWith("https://")) return item.image;
  const premiere = Array.isArray(item?.faces)
    ? item.faces.map((face) => imageLocale(face?.image)).find(Boolean)
    : "";
  if (premiere) return premiere;
  if (/^\d+$/.test(String(item?.id))) return `https://tcgplayer-cdn.tcgplayer.com/product/${item.id}_in_400x400.jpg`;
  return "";
}

function universFaces(item) {
  const faces = Array.isArray(item?.faces)
    ? item.faces.filter((face) => face && typeof face.name === "string" && face.name && imageLocale(face.image))
    : [];
  if (faces.length >= 2) return faces.map((face) => ({ name: face.name, image: imageLocale(face.image) }));
  const src = universSrc(item);
  return src ? [{ name: "", image: src }] : [];
}

function normPhoto(value) {
  return String(value || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pageUtile(title, query) {
  const page = normPhoto(title);
  const asked = normPhoto(query);
  const extras = page.match(/\b\d+\b/g) || [];
  const wanted = new Set(asked.match(/\b\d+\b/g) || []);
  if (extras.some((num) => !wanted.has(num))) return false;
  if (/logo|icon|symbol|flag/.test(page)) return false;
  const tokens = asked.split(" ").filter((token) => token.length >= 5);
  if (!tokens.length) return false;
  const hits = tokens.filter((token) => page.includes(token)).length;
  return hits >= 1 && hits >= Math.ceil(tokens.length / 3);
}

function fichierUtile(name) {
  const file = String(name || "").toLowerCase();
  if (/\.(svg|gif|pdf)$/.test(file)) return false;
  if (/logo|icon|flag|symbol|stub|sprite|^spr|title|wordmark|button|favicon/.test(file)) return false;
  return /boxart|box|plush|figure|toy|pack|machine|photo/.test(file) || /\.(jpe?g|png|webp)$/.test(file);
}

async function bulbQuery(params) {
  const url = new URL("https://bulbapedia.bulbagarden.net/w/api.php");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) throw new Error("photo");
  return response.json();
}

function requetePhoto(item) {
  return String(item.id)
    .replace(/^(game|line|topps|stick|merlin|panini)-/, "")
    .replace(/pok-mon/g, "pokemon")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function chercherPhotos(item) {
  const query = requetePhoto(item);
  const data = await bulbQuery({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "8",
    prop: "pageimages",
    pithumbsize: "400",
    piprop: "thumbnail|name",
  });
  const tokens = normPhoto(query).split(" ").filter((token) => token.length >= 5);
  const rows = [];
  Object.values(data.query?.pages || {}).forEach((page) => {
    if (!pageUtile(page.title, query)) return;
    const file = page.pageimage || "";
    const url = page.thumbnail?.source || "";
    if (!file || !url.startsWith("https://archives.bulbagarden.net/")) return;
    if (!fichierUtile(file)) return;
    const hits = tokens.filter((token) => normPhoto(page.title).includes(token)).length;
    rows.push({ url, hits, box: /boxart/i.test(file) ? 1 : 0 });
  });
  rows.sort((a, b) => b.hits - a.hits || b.box - a.box);
  return rows.map((row) => row.url);
}

function imageCharge(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 40 && img.naturalHeight > 40);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

let photoToken = 0;

async function autrePhoto(id) {
  const item = (state.univers || []).find((row) => String(row.id) === String(id));
  if (!item) return;
  const token = ++photoToken;
  state.photoBusy = String(id);
  state.photoNote = "";
  paintOpenProduct();
  try {
    const suivantes = await chercherPhotos(item);
    if (token !== photoToken) return;
    const deja = new Set((state.photos[String(id)]?.rejected || []).map(nomFichier));
    const actuel = nomFichier(universSrc(item));
    if (actuel) deja.add(actuel);
    let trouve = "";
    for (const url of suivantes) {
      if (deja.has(nomFichier(url))) continue;
      if (await imageCharge(url)) {
        trouve = url;
        break;
      }
    }
    if (token !== photoToken) return;
    if (!trouve) {
      state.photoNote = "Pas d'autre photo sur Bulbapedia.";
    } else {
      const rejected = [...(state.photos[String(id)]?.rejected || [])];
      const courante = universSrc(item);
      if (courante.startsWith("https://") && !rejected.includes(courante)) rejected.push(courante);
      state.photos[String(id)] = { url: trouve, rejected: rejected.slice(-12) };
      savePhotos();
      const ligne = state.collection.items.find((row) => row.id === String(id) && universKind(row.box));
      if (ligne && imagePiece(trouve)) {
        ligne.image = trouve;
        saveCollection();
        const safe = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(String(id)) : String(id);
        document.querySelectorAll(`[data-card="${safe}"] img.shot`).forEach((img) => { img.src = trouve; });
      }
      state.photoNote = "Photo changée sur ce compte.";
    }
  } catch {
    if (token === photoToken) state.photoNote = "Bulbapedia ne répond pas.";
  } finally {
    if (token === photoToken) {
      state.photoBusy = "";
      paintOpenProduct();
      if (state.tab === "univers") paintUnivers();
    }
  }
}

function universFace(item) {
  const mark = esc(initials(item.name));
  const faces = universFaces(item);
  if (!faces.length) return `<span class="art is-box" data-label="${mark}"><span class="monogram">${mark}</span></span>`;
  const pair = faces.length >= 2 ? " is-pair" : "";
  const imgs = faces.map((face) => `<img class="shot" src="${esc(face.image)}" alt="${esc(face.name || item.name)}" decoding="async" referrerpolicy="no-referrer">`).join("");
  return `<span class="art is-box${pair}" data-label="${mark}">${imgs}</span>`;
}

function universTile(item) {
  const bits = [universLabel(item.kind)];
  if (item.set) bits.push(item.set);
  const day = releasedLabel(item.released);
  if (day) bits.push(day);
  const statut = statutTuile(item.id, "fr", false);
  return `
    <article class="tile univers-tile is-${statut}${state.fraisId === String(item.id) ? " is-frais" : ""}">
      ${poseHTML(item.id, "fr", "univers")}
      ${universFace(item)}
      <button class="tile-hit" type="button" data-action="product" data-family="univers" data-id="${esc(item.id)}">
        <span class="tile-name">${esc(item.name)}</span>
        <span class="tile-meta">${esc(bits.join(" · "))}</span>
        <span class="price-line">${universPrixHTML(item)}</span>
      </button>
    </article>`;
}

function universTiles() {
  const rows = universRows().slice(0, state.universPage * PAGE_SIZE);
  if (!rows.length) return `<p class="note">Aucun résultat pour ce filtre.</p>`;
  return rows.map((item) => universTile(item)).join("");
}

function rechercheJeuxHTML() {
  if (state.view !== "search") return "";
  const rows = state.searchGames || [];
  if (!rows.length) return "";
  const shown = rows.slice(0, 8);
  const reste = rows.length > shown.length
    ? `<p class="note"><button class="btn" type="button" data-action="jeux-recherche">Voir les ${rows.length} jeux</button></p>`
    : "";
  return `
    <section class="search-jeux">
      <p class="kicker">Jeux</p>
      <div class="grid">${shown.map((item) => universTile(item)).join("")}</div>
      ${reste}
    </section>`;
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
  const listed = state.univers.filter((item) => !item.bundle);
  const counts = { tous: listed.length };
  UNIVERS_KINDS.forEach(([id]) => {
    if (id !== "tous") counts[id] = 0;
  });
  listed.forEach((item) => {
    if (counts[item.kind] != null) counts[item.kind] += 1;
  });
  const lego = listed.filter((item) => marqueDe(item) === "lego").length;
  const mega = listed.filter((item) => marqueDe(item) === "mega").length;
  const chips = [
    ["kind", "tous", "Tous", counts.tous],
    ["marque", "lego", "LEGO", lego],
    ["marque", "mega", "Mega", mega],
    ...UNIVERS_KINDS.filter(([id]) => id !== "tous").map(([id, label]) => ["kind", id, label, counts[id]]),
  ];
  const filters = chips.map(([mode, id, label, count]) => {
    const pressed = mode === "marque" ? state.universMarque === id : !state.universMarque && state.universKind === id;
    const attr = mode === "marque"
      ? `data-univers="marque" data-marque="${id}"`
      : `data-univers="kind" data-kind="${id}"`;
    return `<button type="button" ${attr} aria-pressed="${pressed ? "true" : "false"}">${label} ${count}</button>`;
  }).join("");
  return `
    <section class="panel" id="univers">
      <header class="section-head">
        <div>
          <p class="kicker">Depuis 1996</p>
          <h2>Jeux, packs et jouets</h2>
        </div>
        <p class="lede" id="univers-status">${esc(universStatus())}</p>
      </header>
      <p class="note univers-histoire">Pokémon commence le 27 février 1996 au Japon, avec Rouge et Vert. Jaune sort le 12 septembre 1998. Chaque version d'un jeu est à part, pour entrer seule dans la collection. Les filtres LEGO et Mega sont à côté de Tous. Les peluches, les figurines et les cartes Topps restent les grandes séries.</p>
      <div class="sealed-bar">
        <div class="chip-rail"><div class="series-row" role="group" aria-label="Famille">${filters}</div></div>
        <div class="sealed-tools">
          <label class="sr-only" for="univers-q">Filtrer l'univers</label>
          <input id="univers-q" type="search" placeholder="Nom d'un jeu ou d'un jouet" value="${esc(state.universQuery)}" autocomplete="off" enterkeyhint="search">
          <label class="sr-only" for="univers-console">Console</label>
          <select id="univers-console" aria-label="Console">
            <option value="">Toutes les consoles</option>
            ${ordreConsoles().map((name) => `<option value="${esc(name)}"${state.universConsole === name ? " selected" : ""}>${esc(name)}</option>`).join("")}
          </select>
          <label class="sr-only" for="univers-sort">Tri</label>
          <select id="univers-sort" aria-label="Tri">
            <option value="ancien"${state.universSort === "ancien" ? " selected" : ""}>Ordre de sortie</option>
            <option value="console"${state.universSort === "console" ? " selected" : ""}>Console</option>
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

let universPromise = null;

async function loadUnivers() {
  if (state.univers) return state.univers;
  if (universPromise) return universPromise;
  state.universLoading = true;
  state.universError = "";
  if (state.tab === "univers") render();
  universPromise = (async () => {
    try {
      const response = await fetch(new URL("univers.json?v=84", location.href));
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      state.univers = Array.isArray(data.products) ? data.products : [];
      state.universAsOf = typeof data.asOf === "string" ? data.asOf : "";
      state.universError = "";
      return state.univers;
    } catch {
      state.universError = "L'univers Pokémon n'a pas pu être chargé.";
      return null;
    } finally {
      state.universLoading = false;
      universPromise = null;
      if (state.tab === "univers") render();
    }
  })();
  return universPromise;
}


function emptyPage() {
  return Array.from({ length: POCKETS }, () => null);
}

function loadBinder() {
  const fresh = () => ({ page: 0, pages: [emptyPage(), emptyPage()], cards: {} });
  try {
    const raw = lireCabinet("classeur");
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
  const ok = ecrireCabinet("classeur", {
    page: state.binder.page,
    pages: state.binder.pages,
    cards: state.binder.cards,
  });
  noterStockage(ok);
  return ok !== false;
}

function migrerFavoris() {
  const favs = state.favorites.filter((item) => item && cleanId(item.id, "") && item.name);
  if (!favs.length) return;
  let ajoute = false;
  favs.forEach((fav) => {
    const id = cleanId(fav.id, "");
    if (!id || binderFind(id)) return;
    let hole = firstHole(0);
    if (!hole) {
      state.binder.pages.push(emptyPage());
      hole = { page: state.binder.pages.length - 1, slot: 0 };
    }
    state.binder.pages[hole.page][hole.slot] = id;
    state.binder.cards[id] = {
      id,
      name: fav.name,
      image: fav.image || "",
      setName: fav.setName || fav.set?.name || "",
      localId: fav.localId || "",
      rarity: fav.rarity || "",
      variants: variantFlags(fav),
      setTotal: fav.setTotal || null,
      trend: typeof fav.trend === "number" ? fav.trend : (typeof fav.pricing?.cardmarket?.trend === "number" ? fav.pricing.cardmarket.trend : null),
      pricing: fav.pricing || null,
      lang: MARKETS[fav.lang] ? fav.lang : "fr",
    };
    ajoute = true;
  });
  if (!favs.every((fav) => binderFind(cleanId(fav.id, "")))) return;
  if (ajoute && !saveBinder()) return;
  state.favorites = [];
  saveFavs();
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

function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function variantFlags(card) {
  const raw = card?.variants;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (!("holo" in raw) && !("normal" in raw) && !("reverse" in raw)) return null;
  return {
    normal: raw.normal === true,
    reverse: raw.reverse === true,
    holo: raw.holo === true,
  };
}

const FULL_FACE_RARITY = [
  "illustration",
  "hyper",
  "magnifique",
  "shiny",
  "secret",
  "arc-en-ciel",
  "rainbow",
  "full art",
  "alternative",
  "galerie",
  "chromatique",
  "gold",
  "vmax",
  "vstar",
  "radieux",
  "radiant",
];

function foilKind(card) {
  const rarity = foldText(card?.rarity);
  const flags = variantFlags(card);
  const types = new Set(
    (Array.isArray(card?.variants_detailed) ? card.variants_detailed : [])
      .map((variant) => foldText(variant?.type))
      .filter(Boolean),
  );
  const holo = Boolean(flags?.holo) || types.has("holo");
  const reverse = Boolean(flags?.reverse) || types.has("reverse");
  const normal = Boolean(flags?.normal) || types.has("normal");
  if (FULL_FACE_RARITY.some((token) => rarity.includes(token))) return "plein";
  if (holo && !normal && rarity.includes("ultra")) return "plein";
  if (holo && !normal) return "fenetre";
  if (reverse && !normal && !holo) return "cadre";
  if (/holo|double rare|ultra|rare v\b/.test(rarity)) return "fenetre";
  return "papier";
}

function artSize(card) {
  const rarity = foldText(card?.rarity);
  if (/vmax|vstar/.test(rarity)) return "classic";
  if (/double rare|holo rare v|rare holo v|rare v\b/.test(rarity)) return "large";
  return "classic";
}

function foilHint(kind) {
  if (kind === "cadre") return "Penche la carte : le reflet du cadre suit le mouvement.";
  if (kind === "papier") return "Penche la carte : une lumière douce suit le mouvement.";
  return "Penche la carte : le reflet holographique suit le mouvement.";
}

function holoSpan(card, quiet) {
  const kind = foilKind(card);
  if (kind === "papier") return "";
  const quietClass = quiet ? " is-quiet" : "";
  return `<span class="holo${quietClass}" data-foil="${kind}" data-art="${artSize(card)}" aria-hidden="true"></span>`;
}

let foilHydrateToken = 0;

async function hydrateBinderFoils() {
  const pending = Object.values(state.binder.cards).filter((card) => card?.id && !variantFlags(card));
  if (!pending.length) return;
  const token = ++foilHydrateToken;
  await pool(pending, 3, async (card) => {
    if (token !== foilHydrateToken) return;
    try {
      const full = await getCard(card.id, card.lang || "fr");
      const flags = variantFlags(full);
      const current = state.binder.cards[card.id];
      if (!current || !flags || token !== foilHydrateToken) return;
      state.binder.cards[card.id] = {
        ...current,
        rarity: full.rarity || current.rarity || "",
        variants: flags,
      };
    } catch {
      /* La prochaine ouverture du classeur réessaiera. */
    }
  });
  if (token !== foilHydrateToken) return;
  saveBinder();
  if (state.tab === "classeur") paintBinder();
}

function pocketHTML(id, index) {
  const chosen = state.binderSlot === index ? " is-chosen" : "";
  const card = id ? state.binder.cards[id] : null;
  if (!card) {
    return `<button type="button" class="pocket${chosen}" data-pocket="${index}"><span class="pocket-empty">Libre</span></button>`;
  }
  return `<button type="button" class="pocket is-full${chosen}" data-pocket="${index}" aria-label="${esc(prettyName(card.name))}">
    <span class="pocket-card">${imgTag(card, "low", false)}${holoSpan(card, true)}</span>
  </button>`;
}

function binderHitsHTML() {
  if (state.binderQuery.trim().length < 2) return "";
  if (!state.binderHits.length) return `<p class="note">Aucune carte ne porte ce nom.</p>`;
  return state.binderHits.map((card) => {
    const name = prettyName(card.name);
    return `
    <button type="button" class="binder-hit" data-binder="place" data-id="${esc(card.id)}">
      <span class="binder-hit-art" data-label="${esc(initials(card.name))}">${imgTag(resolveCard(card), "low", true)}</span>
      <span class="binder-hit-name">${esc(name)}</span>
    </button>`;
  }).join("");
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
  hits.scrollLeft = 0;
  wakeScans(grid);
  wakeScans(hits);
  if (drop) {
    const empty = page.every((id) => !id);
    drop.hidden = !(empty && state.binder.pages.length > 1);
  }
  hydrateBinderScans();
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
        <div class="binder-cover" aria-hidden="true"></div>
        <div class="binder-sheet" id="binder-sheet">
          <div class="binder-grid" id="binder-grid">${page.map((id, index) => pocketHTML(id, index)).join("")}</div>
        </div>
        <div class="binder-rings" aria-hidden="true"></div>
      </div>
      <div class="binder-nav">
        <button class="btn" type="button" data-binder="prev">Précédente</button>
        <button class="btn" type="button" data-binder="next">Suivante</button>
      </div>
      <p class="hint">Glisse une carte pour la déplacer, même vers la page d'à côté. Un clic l'ouvre en relief : la lumière suit le doigt.</p>
      <div class="binder-nav">
        <button class="btn" type="button" data-binder="add-page">Ajouter une page</button>
        <button class="btn" type="button" id="binder-drop" data-binder="drop-page"${empty && state.binder.pages.length > 1 ? "" : " hidden"}>Retirer cette page</button>
      </div>
      <form class="binder-search" id="binder-form">
        <label class="field">Ranger une carte
          <input id="binder-q" type="search" placeholder="Nom d'une carte" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" value="${esc(state.binderQuery)}">
        </label>
      </form>
      <div class="binder-hits" id="binder-hits">${binderHitsHTML()}</div>
    </section>`;
}

function boutonBug() {
  return `<button class="icon-btn signaler" type="button" data-signaler aria-label="Signaler un problème"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8c0-1.7 1.3-3 3-3s3 1.3 3 3"/><path d="M8 9.5h8"/><ellipse cx="12" cy="14" rx="4.2" ry="5"/><path d="M9.2 6.2 7 3.5M14.8 6.2 17 3.5"/><path d="M8 12 4.5 10.5M8 15H4M8.4 17.8 5.2 20.5"/><path d="M16 12l3.5-1.5M16 15h4M15.6 17.8l3.2 2.7"/></svg></button>`;
}

function reliefHTML(card, mode) {
  const kind = foilKind(card);
  const lang = card.lang || state.market;
  const found = binderFind(card.id);
  const garder = found
    ? `<button class="btn" type="button" data-binder="remove" data-slot="${found.slot}" data-page="${found.page}">Retirer du classeur</button>`
    : `<button class="btn solid" type="button" data-action="binder-add" data-id="${esc(card.id)}" data-lang="${esc(lang)}">Ranger dans le classeur</button>`;
  const suivante = mode === "random"
    ? `<button class="btn solid next-card" type="button" data-action="random-next">Suivante</button>`
    : "";
  return `
    <div class="relief">
      <div class="relief-tools">${boutonBug()}<button class="close" type="button" data-action="close">Fermer</button></div>
      <div class="relief-stage">
        <div class="stage" data-tilt data-foil="${kind}" data-art="${artSize(card)}" data-label="${esc(initials(card.name))}">
          ${imgTag(card, "high", true)}
          ${holoSpan(card, false)}
          <span class="shine" aria-hidden="true"></span>
        </div>
        <span class="relief-shadow" aria-hidden="true"></span>
      </div>
      <div class="relief-copy">
        <p class="relief-name">${esc(prettyName(card.name))}</p>
        <p class="relief-prix price-line">${reliefPrix(card)}</p>
        <p class="hint">${foilHint(kind)}</p>
        <div class="fiche-actions">
          ${suivante}
          ${garder}
          ${gestesCourts(card.id, lang)}
          <button class="btn" type="button" data-action="open-fiche" data-id="${esc(card.id)}" data-lang="${esc(lang)}">Voir la fiche</button>
        </div>
      </div>
    </div>`;
}

function reliefAttente() {
  return `
    <div class="relief">
      <div class="relief-tools">${boutonBug()}<button class="close" type="button" data-action="close">Fermer</button></div>
      <div class="relief-stage">
        <div class="stage" data-tilt data-foil="papier" data-art="classic">
          <span class="shine" aria-hidden="true"></span>
        </div>
        <span class="relief-shadow" aria-hidden="true"></span>
      </div>
      <div class="relief-copy">
        <p class="relief-name">Ouverture…</p>
        <p class="relief-prix price-line"><span class="price-missing">Cote indisponible</span></p>
        <p class="hint">Penche la carte : la lumière suit le mouvement.</p>
      </div>
    </div>`;
}

let sheetScrollY = 0;
let sheetHold = 0;

function lockSheet() {
  window.clearTimeout(sheetHold);
  if (document.body.classList.contains("sheet-open")) return;
  sheetScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.style.top = `-${sheetScrollY}px`;
  document.body.classList.add("sheet-open");
}

function releaseSheet() {
  const ouvert = ["fiche", "relief", "signal", "journal"].some((id) => document.getElementById(id)?.open);
  if (ouvert) return;
  if (!document.body.classList.contains("sheet-open")) return;
  const y = sheetScrollY;
  document.body.classList.remove("sheet-open");
  document.body.style.top = "";
  const jump = () => {
    if (document.body.classList.contains("sheet-open")) return;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, y);
    root.style.scrollBehavior = previous;
  };
  jump();
  requestAnimationFrame(jump);
}

function unlockSheet() {
  window.clearTimeout(sheetHold);
  releaseSheet();
}

let ficheLeave = 0;

function keepFiche() {
  ficheLeave += 1;
  document.getElementById("fiche")?.classList.remove("is-leaving");
}

function leaveFiche() {
  const dialog = document.getElementById("fiche");
  if (!dialog?.open) return;
  if (!motionOK) {
    dialog.close();
    return;
  }
  if (dialog.classList.contains("is-leaving")) return;
  const token = ++ficheLeave;
  dialog.classList.add("is-leaving");
  window.setTimeout(() => {
    if (token !== ficheLeave) return;
    if (dialog.open) dialog.close();
    else dialog.classList.remove("is-leaving");
  }, 240);
}

const foilTilt = {
  stage: null,
  pointer: -1,
  finger: false,
  raf: 0,
  x: 0.5,
  y: 0.5,
  tx: 0.5,
  ty: 0.5,
};

let foilMotionAsked = false;
let foilMotionOn = false;
let foilOrientSeen = false;
let foilPose = null;
let foilPoseLive = false;
let reliefLeaving = false;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function reliefOpen() {
  const dialog = document.getElementById("relief");
  return Boolean(dialog?.open && !reliefLeaving);
}

function kickFoilTilt() {
  if (foilTilt.raf || !motionOK) return;
  foilTilt.raf = requestAnimationFrame(stepFoilTilt);
}

function stepFoilTilt() {
  foilTilt.raf = 0;
  const stage = foilTilt.stage;
  if (!stage?.isConnected || !document.getElementById("relief")?.open) return;
  if (foilTilt.finger) {
    foilTilt.x = foilTilt.tx;
    foilTilt.y = foilTilt.ty;
  } else {
    foilTilt.x += (foilTilt.tx - foilTilt.x) * 0.16;
    foilTilt.y += (foilTilt.ty - foilTilt.y) * 0.16;
  }
  const gain = (stage.dataset.foil || "papier") === "papier" ? 0.55 : 1;
  /* 0,5 / 0,5 = téléphone tenu normalement : la carte reste face à l'écran. */
  const rx = (0.5 - foilTilt.y) * 34 * gain;
  const ry = (foilTilt.x - 0.5) * 42 * gain;
  stage.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
  stage.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
  stage.style.setProperty("--mx", `${(50 + (foilTilt.x - 0.5) * 140).toFixed(1)}%`);
  stage.style.setProperty("--my", `${(42 + (foilTilt.y - 0.5) * 120).toFixed(1)}%`);
  const host = stage.closest(".relief-stage");
  host?.style.setProperty("--sx", ((foilTilt.x - 0.5) * 22 * gain).toFixed(1));
  host?.style.setProperty("--sy", ((foilTilt.y - 0.5) * 14 * gain).toFixed(1));
  const left = Math.abs(foilTilt.tx - foilTilt.x) + Math.abs(foilTilt.ty - foilTilt.y);
  if (foilTilt.finger || left > 0.003) kickFoilTilt();
}

function aimFoil(stage, clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const rawX = (clientX - rect.left) / (rect.width || 1);
  const rawY = (clientY - rect.top) / (rect.height || 1);
  foilTilt.tx = clamp01(0.5 + (rawX - 0.5) * 1.55);
  foilTilt.ty = clamp01(0.5 + (rawY - 0.5) * 1.55);
  kickFoilTilt();
}

function releaseFoil() {
  foilTilt.finger = false;
  foilTilt.pointer = -1;
  if (!foilPoseLive) {
    foilTilt.tx = 0.5;
    foilTilt.ty = 0.5;
  }
  kickFoilTilt();
}

function applyPhoneTilt(gamma, beta, mode) {
  if (!reliefOpen() || foilTilt.finger) return;
  if (!Number.isFinite(gamma) || !Number.isFinite(beta)) return;
  if (!foilPose || foilPose.mode !== mode) {
    foilPose = { mode, gamma, beta };
    return;
  }
  const dx = Math.min(1, Math.max(-1, (gamma - foilPose.gamma) / 24));
  const dy = Math.min(1, Math.max(-1, (beta - foilPose.beta) / 24));
  if (!foilPoseLive && Math.abs(dx) < 0.04 && Math.abs(dy) < 0.04) return;
  foilPoseLive = true;
  foilTilt.tx = clamp01(0.5 + dx * 0.5);
  foilTilt.ty = clamp01(0.5 + dy * 0.5);
  kickFoilTilt();
}

function onFoilOrientation(event) {
  if (event.gamma == null || event.beta == null) return;
  foilOrientSeen = true;
  applyPhoneTilt(event.gamma, event.beta, "orient");
}

function onFoilMotion(event) {
  if (foilOrientSeen || foilTilt.finger || !reliefOpen()) return;
  const gravity = event.accelerationIncludingGravity;
  if (!gravity || gravity.x == null || gravity.y == null) return;
  applyPhoneTilt(gravity.x * 5.5, -gravity.y * 5.5, "motion");
}

function bindFoilMotion() {
  if (foilMotionOn) return;
  foilMotionOn = true;
  window.addEventListener("deviceorientation", onFoilOrientation, { passive: true });
  window.addEventListener("devicemotion", onFoilMotion, { passive: true });
}

function requestFoilMotion() {
  if (!motionOK || foilMotionAsked || foilMotionOn) return;
  const Orientation = window.DeviceOrientationEvent;
  const Motion = window.DeviceMotionEvent;
  const ask = Orientation && typeof Orientation.requestPermission === "function"
    ? () => Orientation.requestPermission()
    : Motion && typeof Motion.requestPermission === "function"
      ? () => Motion.requestPermission()
      : null;
  foilMotionAsked = true;
  if (!ask) {
    bindFoilMotion();
    return;
  }
  ask().then((state) => {
    if (state === "granted") bindFoilMotion();
  }).catch(() => {});
}

function resetFoilTilt(stage) {
  foilPose = null;
  foilTilt.stage = stage || null;
  foilTilt.finger = false;
  foilTilt.pointer = -1;
  foilTilt.x = 0.5;
  foilTilt.y = 0.5;
  foilTilt.tx = 0.5;
  foilTilt.ty = 0.5;
  if (stage) kickFoilTilt();
}

function applyReliefFoil(dialog, card) {
  const kind = foilKind(card);
  const art = artSize(card);
  const stage = dialog.querySelector("[data-tilt]");
  if (!stage) return;
  stage.dataset.foil = kind;
  stage.dataset.art = art;
  const hint = dialog.querySelector(".hint");
  if (hint) hint.textContent = foilHint(kind);
  let holo = stage.querySelector(".holo");
  if (kind === "papier") {
    holo?.remove();
    return;
  }
  if (!holo) {
    holo = document.createElement("span");
    holo.className = "holo";
    holo.setAttribute("aria-hidden", "true");
    const shine = stage.querySelector(".shine");
    if (shine) stage.insertBefore(holo, shine);
    else stage.appendChild(holo);
  }
  holo.dataset.foil = kind;
  holo.dataset.art = art;
}

function carteConnue(id, lang) {
  const langue = lang || state.market || "fr";
  const cached = cache.get(cacheKey(id, langue)) || cache.get(cacheKey(id, state.market)) || cache.get(cacheKey(id, "fr"));
  if (cached?.name) return cached;
  const ranger = state.binder.cards[id];
  if (ranger?.name) return ranger;
  const lists = [state.iconics, state.setCards, state.searchCards, state.hallCards];
  for (const list of lists) {
    const found = (list || []).find((card) => card?.id === id && card.name && (!card.lang || card.lang === langue));
    if (found) return found;
  }
  for (const list of lists) {
    const found = (list || []).find((card) => card?.id === id && card.name);
    if (found) return found;
  }
  const coll = state.collection.items.find((item) => item.id === id && !item.box && item.name);
  return coll || null;
}

async function completerRelief(id, lang) {
  const dialog = document.getElementById("relief");
  try {
    const full = await getCard(id, lang);
    if (!dialog?.open || dialog.dataset.card !== id) return;
    const flags = variantFlags(full);
    const current = state.binder.cards[id];
    if (current) {
      state.binder.cards[id] = {
        ...current,
        rarity: full.rarity || current.rarity || "",
        variants: flags || current.variants || null,
        image: full.image || current.image || "",
        name: full.name || current.name,
      };
      saveBinder();
      if (state.tab === "classeur") paintBinder();
    }
    const card = { ...full, lang: full.lang || lang };
    const img = dialog.querySelector("[data-tilt] img");
    if (!img?.getAttribute("src")) {
      const mode = dialog.dataset.mode === "random" ? "random" : "";
      dialog.innerHTML = reliefHTML(card, mode);
      wakeScans(dialog);
      resetFoilTilt(dialog.querySelector("[data-tilt]"));
      return;
    }
    applyReliefFoil(dialog, card);
    const name = dialog.querySelector(".relief-name");
    if (name && card.name) name.textContent = prettyName(card.name);
    const prix = dialog.querySelector(".relief-prix");
    if (prix) prix.innerHTML = reliefPrix(card);
  } catch {
    if (!dialog?.open || dialog.dataset.card !== id) return;
    const name = dialog.querySelector(".relief-name");
    if (name && name.textContent === "Ouverture…") name.textContent = "Cette carte ne s'ouvre pas.";
  }
}

function leaveRelief(after) {
  const dialog = document.getElementById("relief");
  const done = () => {
    reliefLeaving = false;
    after?.();
  };
  if (!dialog?.open) {
    done();
    return;
  }
  if (!motionOK) {
    dialog.close();
    done();
    return;
  }
  if (dialog.classList.contains("is-leaving")) return;
  reliefLeaving = true;
  foilTilt.finger = false;
  dialog.classList.add("is-leaving");
  window.setTimeout(() => {
    dialog.classList.remove("is-leaving");
    if (dialog.open) dialog.close();
    done();
  }, 240);
}

function openRelief(id, _slot, lang, mode) {
  requestFoilMotion();
  const dialog = document.getElementById("relief");
  const safe = cleanId(id, "");
  if (!safe || !dialog) return;
  const langue = lang || state.binder.cards[safe]?.lang || state.market;
  const modeRelief = mode === "random" ? "random" : "";
  const fiche = document.getElementById("fiche");
  if (fiche?.open) fiche.close();
  reliefLeaving = false;
  dialog.classList.remove("is-leaving");
  dialog.dataset.card = safe;
  dialog.dataset.lang = langue;
  dialog.dataset.mode = modeRelief;
  const known = carteConnue(safe, langue);
  lockSheet();
  if (known?.name) {
    dialog.innerHTML = reliefHTML({ ...known, id: safe, lang: known.lang || langue }, modeRelief);
    wakeScans(dialog);
    resetFoilTilt(dialog.querySelector("[data-tilt]"));
    if (!dialog.open) dialog.showModal();
    if (!known.image || !variantFlags(known)) completerRelief(safe, langue);
    return;
  }
  dialog.innerHTML = reliefAttente();
  resetFoilTilt(dialog.querySelector("[data-tilt]"));
  if (!dialog.open) dialog.showModal();
  completerRelief(safe, langue);
}

let binderTurning = false;

function turnBinder(dir) {
  const next = state.binder.page + dir;
  if (binderTurning || next < 0 || next >= state.binder.pages.length) return;
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
  binderTurning = true;
  let swapped = false;
  const swap = () => {
    if (swapped) return;
    swapped = true;
    binderTurning = false;
    sheet.removeEventListener("transitionend", onOut);
    apply();
    sheet.classList.remove("is-turning");
    sheet.style.transition = "none";
    sheet.style.transform = `rotateY(${dir > 0 ? 18 : -58}deg)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sheet.style.transition = "transform .42s cubic-bezier(.16,.84,.3,1)";
        sheet.style.transform = "rotateY(-6deg)";
        const clear = (event) => {
          if (event.propertyName && event.propertyName !== "transform") return;
          sheet.removeEventListener("transitionend", clear);
          sheet.style.transition = "";
          sheet.style.transform = "";
        };
        sheet.addEventListener("transitionend", clear);
      });
    });
  };
  const onOut = (event) => {
    if (event.target !== sheet || event.propertyName !== "transform") return;
    swap();
  };
  sheet.style.animation = "none";
  sheet.classList.add("is-turning");
  sheet.style.transition = "transform .32s cubic-bezier(.4,0,.2,1)";
  sheet.style.transform = `rotateY(${dir > 0 ? -58 : 18}deg)`;
  sheet.addEventListener("transitionend", onOut);
  window.setTimeout(swap, 380);
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
let binderScanToken = 0;
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
  const found = binderFind(safe);
  if (found) {
    state.binder.page = found.page;
    state.binderSlot = found.slot;
    state.binderHits = [];
    state.binderQuery = "";
    saveBinder();
    const champ = document.getElementById("binder-q");
    if (champ) champ.value = "";
    paintBinder();
    return;
  }
  let card = state.binder.cards[safe] || cache.get(cacheKey(safe));
  if (!card?.image || !variantFlags(card)) {
    try {
      card = await getCard(safe, card?.lang || state.market);
    } catch {
      if (!card?.name) return;
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

function binderHitList(list) {
  const rows = Array.isArray(list) ? list : [];
  const seen = new Set();
  const hits = [];
  rows.forEach((card) => {
    const id = cleanId(card?.id, "");
    if (!id || !card?.name || seen.has(id)) return;
    seen.add(id);
    hits.push(card);
  });
  return hits;
}

function paintBinderArt(id) {
  const root = document.getElementById("binder-hits");
  const card = state.binderHits.find((item) => item.id === id);
  if (!root || !card) return;
  const button = [...root.querySelectorAll(".binder-hit")].find((node) => node.dataset.id === id);
  const art = button?.querySelector(".binder-hit-art");
  if (!art) return;
  const markup = imgTag(resolveCard(card), "low", true);
  if (!markup.includes("<img")) return;
  art.innerHTML = markup;
  const img = art.querySelector("img");
  if (img instanceof HTMLImageElement) revealScan(img);
}

async function hydrateBinderScans() {
  const token = ++binderScanToken;
  const query = state.binderQuery;
  const missing = state.binderHits.filter((card) => !imgTag(resolveCard(card), "low", true).includes("<img"));
  if (!missing.length) return;
  await pool(missing, 4, async (brief) => {
    if (token !== binderScanToken || state.binderQuery !== query) return;
    try {
      const full = await getCard(brief.id, brief.lang || state.market);
      if (token !== binderScanToken || state.binderQuery !== query) return;
      const index = state.binderHits.findIndex((item) => item.id === brief.id);
      if (index >= 0) state.binderHits[index] = { ...state.binderHits[index], ...full, id: brief.id };
      paintBinderArt(brief.id);
    } catch {
      /* Le monogramme reste si aucun scan n'existe. */
    }
  });
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
    const list = await cartesParNom(query);
    if (state.binderQuery !== query) return;
    state.binderHits = binderHitList(list);
  } catch {
    if (state.binderQuery !== query) return;
    state.binderHits = [];
  }
  paintBinder();
}

function boxKind(value) {
  return value === "etb" || value === "upc" || value === "coffret" ? value : "";
}

function boxShot(id) {
  return `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_400x400.jpg`;
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

function imageLocale(url) {
  return typeof url === "string" && /^(?:jeux|jouets)\/[a-z0-9-]+\.jpg$/.test(url) ? url : "";
}

function imagePiece(url) {
  if (typeof url !== "string") return "";
  if (imageLocale(url)) return url;
  if (url.startsWith("https://archives.bulbagarden.net/")) return url;
  if (/^https:\/\/tcgplayer-cdn\.tcgplayer\.com\/product\/\d+_in_\d+x\d+\.jpg$/.test(url)) return url;
  return "";
}

function loadCollection() {
  try {
    const raw = lireCabinet("collection") || {};
    const items = Array.isArray(raw.items) ? raw.items : [];
    return {
      name: looseName(raw.name).trim(),
      named: raw.named !== false,
      shareFavs: raw.shareFavs === true,
      items: items.filter((item) => item && cleanId(item.id, "") && item.name).flatMap((item) => {
        const sealed = boxKind(item.box);
        const univers = universKind(item.box);
        if (item.box && !sealed && !univers) return [];
        if (sealed && !/^\d+$/.test(item.id)) return [];
        const piece = sealed || univers;
        const row = {
          id: item.id,
          name: looseNote(item.name).trim() || (piece ? pieceLabel(piece) : "Carte"),
          image: sealed
            ? boxShot(item.id)
            : (univers
              ? (imagePiece(item.image) || (/^\d+$/.test(item.id) ? boxShot(item.id) : ""))
              : urlCarte(item.image)),
          setName: looseNote(item.setName).trim(),
          localId: piece ? "" : looseNote(item.localId).trim().slice(0, 16),
          note: looseNote(item.note).trim(),
          trend: piece || typeof item.trend !== "number" || item.trend < 0 ? null : item.trend,
          lang: piece ? "fr" : (MARKETS[item.lang] ? item.lang : "fr"),
        };
        if (piece) {
          row.box = piece;
          row.usd = typeof item.usd === "number" && item.usd >= 0 ? item.usd : null;
        }
        row.want = item.want === true;
        row.honor = item.honor === true && item.want !== true;
        return [row];
      }),
    };
  } catch {
    return blankCollection();
  }
}

function saveCollection() {
  noterStockage(ecrireCabinet("collection", state.collection));
}

function ligneCollection(id, lang = state.market) {
  const key = String(id ?? "");
  return state.collection.items.find((item) => {
    if (item.id !== key) return false;
    if (item.box) return true;
    return (item.lang || "fr") === (lang || "fr");
  }) || null;
}

function possede(id, lang = state.market) {
  const row = ligneCollection(id, lang);
  return Boolean(row && !row.want);
}

function cherchePiece(id, lang = state.market) {
  const row = ligneCollection(id, lang);
  return Boolean(row && row.want);
}

function inCollection(id, lang = state.market) {
  return Boolean(ligneCollection(id, lang));
}

function collectionFromCard(card, note = "") {
  return {
    id: card.id,
    name: card.name,
    image: imageDe(card) || (typeof card.image === "string" ? card.image : ""),
    setName: card.set?.name || card.setName || "",
    localId: card.localId || "",
    note: looseNote(note).trim(),
    lang: card.lang || state.market || "fr",
    trend: typeof card.pricing?.cardmarket?.trend === "number" ? card.pricing.cardmarket.trend : (typeof card.trend === "number" ? card.trend : null),
  };
}

function collectionFromBox(item, note = "") {
  const id = String(item.id);
  const kind = boxKind(item.kind || item.box);
  return {
    id,
    name: looseNote(item.name).trim() || sealedLabel(kind),
    image: boxShot(id),
    setName: looseNote(item.set || item.setName || "").trim(),
    localId: "",
    note: looseNote(note).trim(),
    lang: "fr",
    trend: null,
    box: kind,
    usd: typeof item.usd === "number" && item.usd >= 0 ? item.usd : null,
  };
}

function addToCollection(card, want = false) {
  const lang = card?.lang || state.market;
  if (!card?.id) return;
  const row = ligneCollection(card.id, lang);
  if (row) {
    row.want = Boolean(want);
    if (want) row.honor = false;
    saveCollection();
    return;
  }
  const item = collectionFromCard(card);
  item.want = Boolean(want);
  item.honor = false;
  state.collection.items.unshift(item);
  saveCollection();
}

function addBox(item, want = false) {
  const id = String(item?.id ?? "");
  if (!/^\d+$/.test(id) || !boxKind(item?.kind)) return;
  const row = ligneCollection(id);
  if (row) {
    row.want = Boolean(want);
    if (want) row.honor = false;
    saveCollection();
    return;
  }
  const created = collectionFromBox(item);
  created.want = Boolean(want);
  created.honor = false;
  state.collection.items.unshift(created);
  saveCollection();
}

function collectionFromUnivers(item, note = "") {
  const id = String(item.id);
  const kind = universKind(item.kind || item.box);
  const montant = universMontant(item);
  return {
    id,
    name: looseNote(item.name).trim() || universLabel(kind),
    image: imagePiece(universSrc(item)),
    setName: looseNote(item.set || item.setName || "").trim(),
    localId: "",
    note: looseNote(note).trim(),
    lang: "fr",
    trend: null,
    box: kind,
    usd: typeof montant === "number" && montant >= 0 ? montant : null,
  };
}

function addUnivers(item, want = false) {
  const id = cleanId(String(item?.id ?? ""), "");
  if (!id || !universKind(item?.kind)) return;
  const row = ligneCollection(id);
  if (row) {
    row.want = Boolean(want);
    if (want) row.honor = false;
    saveCollection();
    return;
  }
  const created = collectionFromUnivers({ ...item, id });
  created.want = Boolean(want);
  created.honor = false;
  state.collection.items.unshift(created);
  saveCollection();
}

function basculerHonneur(id, lang) {
  const row = ligneCollection(id, lang);
  if (!row || row.want) return;
  if (row.honor) {
    row.honor = false;
    saveCollection();
    return;
  }
  const autres = state.collection.items.filter((item) => item !== row && item.honor && !item.want);
  while (autres.length >= HONOR_MAX) {
    const vieux = autres.pop();
    if (vieux) vieux.honor = false;
  }
  row.honor = true;
  saveCollection();
}

function gesteCollection(mode, id, lang, family) {
  const row = ligneCollection(id, lang);
  if (mode === "honneur") {
    basculerHonneur(id, lang);
    return Promise.resolve();
  }
  const want = mode === "cherche";
  if (row && ((want && row.want) || (!want && !row.want))) {
    removeFromCollection(id, lang);
    return Promise.resolve();
  }
  const fini = () => {
    if (mode === "pose" && possede(id, lang)) state.fraisId = String(id);
  };
  if (family === "univers" || family === "sealed") {
    const apply = (item) => {
      if (!item && !row) return;
      if (family === "univers") addUnivers(item || { id, kind: row?.box }, want);
      else addBox(item || { id, kind: row?.box }, want);
      fini();
    };
    const list = family === "univers" ? state.univers : state.sealed;
    const item = (list || []).find((entry) => String(entry.id) === String(id));
    if (item || row || family === "sealed") {
      apply(item);
      return Promise.resolve();
    }
    return loadUnivers().then(() => {
      apply((state.univers || []).find((entry) => String(entry.id) === String(id)));
    });
  }
  const known = cache.get(cacheKey(id, lang))
    || state.setCards.find((card) => card.id === id)
    || state.searchCards.find((card) => card.id === id);
  if (known?.name) {
    addToCollection(known, want);
    fini();
    return Promise.resolve();
  }
  return getCard(id, lang).then((card) => {
    addToCollection(card, want);
    fini();
  }).catch(() => {});
}

function rafraichirApresGeste() {
  const y = window.scrollY;
  const relief = document.getElementById("relief");
  if (relief?.open && relief.dataset.card) {
    const lang = relief.dataset.lang || state.market;
    const card = cache.get(cacheKey(relief.dataset.card, lang)) || carteConnue(relief.dataset.card, lang);
    if (card?.name) relief.innerHTML = reliefHTML({ ...card, id: relief.dataset.card, lang: card.lang || lang }, relief.dataset.mode === "random" ? "random" : "");
  }
  const dialog = document.getElementById("fiche");
  if (productOpen && dialog?.open) paintOpenProduct();
  else if (dialog?.open && dialog.dataset.current && !dialog.querySelector(".pending")) {
    const lang = dialog.dataset.lang || state.market;
    const card = cache.get(cacheKey(dialog.dataset.current, lang));
    if (card) dialog.innerHTML = ficheHTML(card);
  }
  if (state.visit) {
    window.scrollTo(0, y);
    return;
  }
  if (state.tab === "etb" && document.getElementById("sealed-grid")) paintSealed();
  else if (state.tab === "univers" && document.getElementById("univers-grid")) paintUnivers();
  else render();
  state.fraisId = "";
  window.scrollTo(0, y);
}

function gestesCourts(id, lang) {
  const row = ligneCollection(id, lang);
  const on = Boolean(row && !row.want);
  const want = Boolean(row && row.want);
  const commun = `data-id="${esc(id)}" data-lang="${esc(lang || "fr")}"`;
  return `
      <button class="btn solid" type="button" data-action="coll-pose" ${commun}>${on ? "Retirer du cabinet" : "Je l'ai"}</button>
      <button class="btn" type="button" data-action="coll-cherche" ${commun}>${want ? "Ne plus chercher" : "Je la cherche"}</button>
      ${on ? `<button class="btn" type="button" data-action="coll-honneur" ${commun}>${row.honor ? "Retirer du présentoir" : "À l'honneur"}</button>` : ""}`;
}

function gestesHTML(id, lang, family) {
  const row = ligneCollection(id, lang);
  const on = Boolean(row && !row.want);
  const want = Boolean(row && row.want);
  const familyAttr = family ? ` data-family="${esc(family)}"` : "";
  const commun = `data-id="${esc(id)}" data-lang="${esc(lang || "fr")}"${familyAttr}`;
  const classeur = family ? "" : `<button class="btn" type="button" data-action="binder-add" data-id="${esc(id)}" data-lang="${esc(lang || state.market)}">${binderFind(id) ? "Voir dans le classeur" : "Ranger dans le classeur"}</button>`;
  const note = row ? `<label class="coll-label">Commentaire
        <textarea data-coll-note="${esc(id)}" data-lang="${esc(lang || "fr")}" maxlength="${NOTE_MAX}" rows="2" placeholder="État, souvenir, emplacement.">${esc(row.note || "")}</textarea>
      </label>` : "";
  return `
    <div class="fiche-actions">
      ${classeur}
      <button class="btn solid" type="button" data-action="coll-pose" ${commun}>${on ? "Retirer du cabinet" : "Je l'ai"}</button>
      <button class="btn" type="button" data-action="coll-cherche" ${commun}>${want ? "Ne plus chercher" : "Je la cherche"}</button>
      ${on ? `<button class="btn" type="button" data-action="coll-honneur" ${commun}>${row.honor ? "Retirer du présentoir" : "Mettre à l'honneur"}</button>` : ""}
    </div>
    ${note}`;
}

function removeFromCollection(id, lang = state.market) {
  const key = String(id ?? "");
  state.collection.items = state.collection.items.filter((item) => {
    if (item.id !== key) return true;
    if (item.box) return false;
    return (item.lang || "fr") !== (lang || "fr");
  });
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
  };
  if (!item.box) row.l = looseNote(item.localId).trim().slice(0, 16);
  if (withNote) row.c = looseNote(item.note).trim();
  if (!item.box && MARKETS[item.lang] && item.lang !== "fr") row.g = item.lang;
  if (item.box) {
    row.k = item.box;
    if (typeof item.usd === "number") row.u = Math.round(item.usd * 100) / 100;
  }
  return row;
}

function sharePayload() {
  const mine = state.collection;
  const items = presentoirItems().map((item) => shareRow(item, true));
  if (!items.length) return null;
  return { v: 1, n: mine.named ? looseName(mine.name).trim() : "", items, favs: [] };
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
  // Le lien tient dans une adresse. Au-delà, le message est gonflé.
  return rows.slice(0, 400).flatMap((row) => {
    const id = cleanId(row?.i, "");
    const name = looseNote(row?.a).trim();
    if (!id || !name) return [];
    const sealed = boxKind(row?.k);
    const univers = universKind(row?.k);
    if (row?.k && !sealed && !univers) return [];
    if (sealed && !/^\d+$/.test(id)) return [];
    const piece = sealed || univers;
    const usd = typeof row?.u === "number" && Number.isFinite(row.u) && row.u >= 0 && row.u < 1e7
      ? Math.round(row.u * 100) / 100
      : null;
    const item = {
      id,
      name,
      image: sealed ? boxShot(id) : (univers && /^\d+$/.test(id) ? boxShot(id) : ""),
      setName: looseNote(row?.s).trim(),
      localId: piece ? "" : looseNote(row?.l).trim().slice(0, 16),
      note: withNote ? looseNote(row?.c).trim() : "",
      lang: piece ? "fr" : (MARKETS[row?.g] ? row.g : "fr"),
      trend: null,
    };
    if (piece) {
      item.box = piece;
      item.usd = usd;
    }
    return [item];
  });
}

async function decodeShare(token) {
  try {
  if (typeof token !== "string" || token.length < 4 || token.length > 4000) return null;
  const kind = token[0];
  const bytes = b64urlToBytes(token.slice(1));
  let json = "";
  if (kind === "z" && typeof DecompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    json = await new Response(stream).text();
  } else if (kind === "j") json = new TextDecoder().decode(bytes);
  else return null;
  if (json.length > 200000) return null;
  const data = JSON.parse(json);
  if (!data || data.v !== 1) return null;
  const items = sanitizeRows(data.items, true);
  const favs = sanitizeRows(data.favs, false);
  if (!items.length && !favs.length) return null;
  return { name: looseName(data.n).trim(), items, favs };
  } catch {
    return null;
  }
}

function collBox(item, editable) {
  const label = pieceLabel(item.box);
  const family = universKind(item.box) ? "univers" : "sealed";
  const bits = [label];
  if (item.setName) bits.push(item.setName);
  const price = boxPriceHTML(item.usd);
  const src = item.image || (family === "sealed" || /^\d+$/.test(item.id) ? boxShot(item.id) : "");
  const repli = family === "sealed" && /^\d+$/.test(String(item.id))
    ? ` data-fallbacks="${esc(boxFallbacks(item.id, ["high", "200w"]))}"`
    : "";
  const art = src
    ? `<img${family === "sealed" ? "" : ` class="shot"`} src="${esc(src)}"${repli} alt="${esc(item.name)}" decoding="async">`
    : `<span class="monogram">${esc(initials(item.name))}</span>`;
  const note = editable
    ? `<label class="coll-label">Commentaire
        <textarea data-coll-note="${esc(item.id)}" data-lang="fr" maxlength="${NOTE_MAX}" rows="2" placeholder="État, souvenir, emplacement.">${esc(item.note || "")}</textarea>
      </label>
      <button class="btn unfav" type="button" data-action="coll-remove" data-id="${esc(item.id)}" data-lang="fr">Retirer</button>`
    : (item.note ? `<p class="coll-note">${esc(item.note)}</p>` : "");
  return `
    <article class="coll-card" data-card="${esc(item.id)}" data-box="${esc(item.box)}">
      <button class="coll-open" type="button" data-action="product" data-family="${family}" data-id="${esc(item.id)}" aria-label="${esc(item.name)}">
        <span class="art is-box" data-label="${esc(initials(item.name))}">${art}</span>
      </button>
      <div class="coll-body">
        <button class="coll-title" type="button" data-action="product" data-family="${family}" data-id="${esc(item.id)}">${esc(item.name)}</button>
        <p class="tile-meta">${esc(bits.join(" · "))}</p>
        <p class="price-line">${price}</p>
        ${note}
      </div>
    </article>`;
}

function collCard(card, editable) {
  if (card.box) return collBox(card, editable);
  const meta = metaLine({ ...card, set: { name: card.setName } });
  const price = typeof card.trend === "number"
    ? `<span class="price">${esc(eur(card.trend))}</span>`
    : `<span class="price-missing">Cote indisponible</span>`;
  const note = editable
    ? `<label class="coll-label">Commentaire
        <textarea data-coll-note="${esc(card.id)}" data-lang="${esc(card.lang || "fr")}" maxlength="${NOTE_MAX}" rows="2" placeholder="État, souvenir, emplacement dans le classeur.">${esc(card.note || "")}</textarea>
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

function boxEuro(usd) {
  const rate = fxRates?.USD;
  if (typeof usd !== "number" || typeof rate !== "number" || !(rate > 0)) return null;
  return Math.round((usd / rate) * 100) / 100;
}

function boxPriceHTML(usd) {
  if (typeof usd !== "number") return `<span class="price-missing">Cote indisponible</span>`;
  const euro = boxEuro(usd);
  if (euro == null) {
    if (fxPromise || usdDisplayMode() === "pending") return `<span class="price-missing">Conversion…</span>`;
    return `<span class="price-missing">Cote indisponible</span>`;
  }
  return `<span class="price">${esc(eur(euro))}</span>`;
}

function collectionWorth() {
  let sum = 0;
  let known = 0;
  let cards = 0;
  let boxes = 0;
  let boxKnown = 0;
  let pending = 0;
  let missing = 0;
  let total = 0;
  state.collection.items.forEach((item) => {
    if (item.want) return;
    total += 1;
    if (item.box) {
      boxes += 1;
      const euro = boxEuro(item.usd);
      if (euro == null) {
        if (typeof item.usd === "number" && (fxPromise || usdDisplayMode() === "pending")) pending += 1;
        else missing += 1;
        return;
      }
      sum += euro;
      known += 1;
      boxKnown += 1;
      return;
    }
    cards += 1;
    if (typeof item.trend !== "number") {
      missing += 1;
      return;
    }
    sum += item.trend;
    known += 1;
  });
  return { sum, known, total, cards, boxes, boxKnown, pending, missing };
}

function worthNote(worth) {
  const { cards, boxes, boxKnown, pending } = worth;
  const hasUnivers = state.collection.items.some((item) => universKind(item.box));
  const hasSealed = state.collection.items.some((item) => boxKind(item.box));
  if (!boxes) return "Somme des cotes Cardmarket, en euros. Chaque carte compte une fois. Pas un prix de vente.";
  if (!hasUnivers) {
    if (!cards) {
      if (pending) return "Cotes TCGPlayer en dollars. Conversion en cours. Pas une cote Cardmarket. Pas un prix de vente.";
      if (!boxKnown) return "Cotes TCGPlayer en dollars. La conversion est indisponible. Pas une cote Cardmarket. Pas un prix de vente.";
      return "Somme des cotes TCGPlayer, en euros après conversion. Chaque coffret compte une fois. Pas une cote Cardmarket. Pas un prix de vente.";
    }
    if (pending && !boxKnown) return "Les cartes sont en cotes Cardmarket. La conversion des coffrets est en cours. Chaque pièce compte une fois. Pas un prix de vente.";
    if (!boxKnown) return "Les cartes sont en cotes Cardmarket. La conversion des coffrets est indisponible. Chaque pièce compte une fois. Pas un prix de vente.";
    return "Les cartes sont en cotes Cardmarket. Les ETB, coffrets et UPC sont en cotes TCGPlayer, converties en euros. Chaque pièce compte une fois. Pas un prix de vente.";
  }
  const anyUsd = state.collection.items.some((item) => item.box && typeof item.usd === "number");
  if (!cards && !hasSealed) {
    if (pending) return "Prix en dollars. Conversion en cours. Chaque pièce compte une fois. Pas un prix de vente.";
    if (!anyUsd) return "Pas de cote pour ces pièces. Chaque pièce compte une fois. Pas un prix de vente.";
    if (!boxKnown) return "Prix en dollars. La conversion est indisponible. Chaque pièce compte une fois. Pas un prix de vente.";
    return "Somme des prix en euros après conversion. Chaque pièce compte une fois. Pas un prix de vente.";
  }
  if (pending && !boxKnown) return "Les cartes restent en cotes Cardmarket. La conversion du reste est en cours. Chaque pièce compte une fois. Pas un prix de vente.";
  if (anyUsd && !boxKnown) return "Les cartes restent en cotes Cardmarket. La conversion du reste est indisponible. Chaque pièce compte une fois. Pas un prix de vente.";
  return "Les cartes restent en cotes Cardmarket. Le reste est converti depuis les dollars. Chaque pièce compte une fois. Pas un prix de vente.";
}

function worthCourt() {
  const worth = collectionWorth();
  if (!worth.total) return "";
  if (!worth.known) return worthHTML();
  const hole = worth.missing ? `<span class="deal-note">${worth.missing} ${worth.missing > 1 ? "pièces" : "pièce"} sans cote.</span>` : "";
  return `
    <p class="coll-worth" id="coll-worth">
      <span class="kicker">Valeur indicative</span>
      <strong class="price">${esc(eur(worth.sum))}</strong>
      <span class="deal-note">Pas un prix de vente.</span>
      ${hole}
    </p>`;
}

function worthHTML() {
  const worth = collectionWorth();
  const { sum, known, total, boxes, pending, missing } = worth;
  if (!total) return "";
  const note = worthNote(worth);
  if (!known) {
    const label = pending ? "Conversion…" : "Valeur indisponible";
    return `<p class="coll-worth" id="coll-worth"><span class="price-missing">${label}</span><span class="deal-note">${esc(note)}</span></p>`;
  }
  const unit = boxes ? (missing > 1 ? "pièces" : "pièce") : (missing > 1 ? "cartes" : "carte");
  const hole = missing ? `<span class="deal-note">${missing} ${unit} sans cote.</span>` : "";
  return `
    <p class="coll-worth" id="coll-worth">
      <span class="kicker">Valeur indicative</span>
      <strong class="price">${esc(eur(sum))}</strong>
      <span class="deal-note">${esc(note)}</span>
      ${hole}
    </p>`;
}

function boxById(id) {
  const lists = state.visit
    ? [state.visit.items, state.visit.favs]
    : [state.collection.items];
  for (const list of lists) {
    const item = list?.find((row) => row?.box && row.id === id);
    if (item) return item;
  }
  return null;
}

function paintCollectionPrices() {
  if (state.tab !== "collection") return;
  if (!state.visit) {
    const slot = document.getElementById("coll-worth");
    const html = worthCourt();
    if (slot) slot.outerHTML = html || "";
    else if (html) document.getElementById("coll-form")?.insertAdjacentHTML("beforebegin", html);
  }
  document.querySelectorAll(".piece").forEach((node) => {
    const id = node.dataset.card;
    if (!id) return;
    const lang = node.dataset.lang || "fr";
    const item = state.collection.items.find((row) => {
      if (row.id !== id) return false;
      if (node.dataset.box) return row.box === node.dataset.box;
      return !row.box && (row.lang || "fr") === lang;
    });
    const line = node.querySelector(".price-line");
    if (item && line) line.innerHTML = piecePrix(item);
  });
  document.querySelectorAll(".coll-card[data-box]").forEach((node) => {
    const item = boxById(node.dataset.card);
    const line = node.querySelector(".price-line");
    if (!item || !line) return;
    line.innerHTML = boxPriceHTML(item.usd);
    const titre = node.querySelector(".coll-title");
    if (titre) titre.textContent = item.name;
    const meta = node.querySelector(".tile-meta");
    if (meta) meta.textContent = [pieceLabel(item.box), item.setName].filter(Boolean).join(" · ");
    const art = node.querySelector(".art");
    if (art && universKind(item.box)) {
      const src = item.image || "";
      const img = art.querySelector("img.shot");
      if (src && img) img.src = src;
      else if (src) art.innerHTML = `<img class="shot" src="${esc(src)}" alt="" decoding="async">`;
      else if (img) art.innerHTML = `<span class="monogram">${esc(initials(item.name))}</span>`;
    }
  });
}

function collectionHasBox() {
  if (state.visit) return [...(state.visit.items || []), ...(state.visit.favs || [])].some((item) => item.box);
  return state.collection.items.some((item) => item.box);
}

async function refreshCollection() {
  if (state.visit || state.tab !== "collection" || !state.collection.items.length) return;
  const token = ++collEpoch;
  const pieces = state.collection.items.filter((item) => item.box);
  const sealed = pieces.filter((item) => boxKind(item.box));
  const univers = pieces.filter((item) => universKind(item.box));
  const cards = state.collection.items.filter((item) => !item.box);
  if (pieces.length) {
    const jobs = [];
    if (sealed.length) jobs.push(loadSealed());
    if (univers.length) jobs.push(loadUnivers());
    jobs.push(loadFx());
    await Promise.all(jobs);
    if (token !== collEpoch || state.visit || state.tab !== "collection") return;
    sealed.forEach((item) => {
      const row = (state.sealed || []).find((entry) => String(entry.id) === item.id);
      if (!row) return;
      if (boxKind(row.kind)) item.box = row.kind;
      item.usd = typeof row.usd === "number" && row.usd >= 0 ? row.usd : null;
      if (row.name) item.name = looseNote(row.name).trim() || item.name;
      if (row.set) item.setName = looseNote(row.set).trim();
      item.image = boxShot(item.id);
    });
    univers.forEach((item) => {
      const row = (state.univers || []).find((entry) => String(entry.id) === item.id);
      if (!row) return;
      if (universKind(row.kind)) item.box = row.kind;
      const montant = universMontant(row);
      item.usd = typeof montant === "number" && montant >= 0 ? montant : null;
      if (row.name) item.name = looseNote(row.name).trim() || item.name;
      if (row.set) item.setName = looseNote(row.set).trim();
      const src = imagePiece(universSrc(row));
      if (src) item.image = src;
    });
  }
  await pool(cards, 4, async (item) => {
    try {
      const full = await getCard(item.id, item.lang || "fr");
      if (token !== collEpoch || state.visit || state.tab !== "collection") return;
      const trend = full.pricing?.cardmarket?.trend;
      item.trend = typeof trend === "number" ? trend : null;
      const scan = imageDe({ ...full, id: item.id, image: full.image || item.image }) || marketArt(full, "low") || editionArt(full, "low");
      if (scan) item.image = scan;
      patchCard(full);
    } catch {
      /* La dernière cote connue reste affichée. */
    }
  });
  if (token !== collEpoch || state.visit || state.tab !== "collection") return;
  saveCollection();
  paintCollectionPrices();
}

function familleDe(item) {
  if (!item?.box) return "cartes";
  if (item.box === "jeu") return "jeux";
  if (item.box === "etb" || item.box === "upc" || item.box === "coffret") return "scelles";
  if (item.box === "jouet" || item.box === "peluche" || item.box === "figurine") return "jouets";
  return "reste";
}

function presentoirItems() {
  const owned = state.collection.items.filter((item) => !item.want);
  const honors = owned.filter((item) => item.honor);
  return (honors.length ? honors : owned.slice(0, 4)).slice(0, HONOR_MAX);
}

function piecePrix(item) {
  if (item.box) return boxPriceHTML(item.usd);
  if (typeof item.trend === "number") return `<span class="price">${esc(eur(item.trend))}</span>`;
  return `<span class="price-missing">Cote indisponible</span>`;
}

function pieceBouton(item) {
  const family = item.box ? (universKind(item.box) ? "univers" : "sealed") : "";
  const open = item.box
    ? `data-action="product" data-family="${family}" data-id="${esc(item.id)}"`
    : `data-open="${esc(item.id)}" data-lang="${esc(item.lang || "fr")}"`;
  const nom = item.box ? item.name : prettyName(item.name);
  const mark = esc(initials(item.name));
  let art = `<span class="monogram">${mark}</span>`;
  if (item.box) {
    const src = item.image || "";
    if (src) {
      const shot = universKind(item.box) ? ` class="shot" referrerpolicy="no-referrer"` : "";
      art = `<img${shot} src="${esc(src)}" alt="" decoding="async">`;
    }
  } else {
    art = imgTag({ id: item.id, name: item.name, image: item.image, lang: item.lang || "fr" }, "low", false);
  }
  const boite = item.box ? ` data-box="${esc(item.box)}"` : "";
  return `
    <button class="piece" type="button" ${open} data-card="${esc(item.id)}" data-lang="${esc(item.lang || "fr")}"${boite} aria-label="${esc(nom)}">
      <span class="piece-art" data-label="${mark}">${art}</span>
      <span class="piece-nom">${esc(nom)}</span>
      <span class="price-line">${piecePrix(item)}</span>
    </button>`;
}

function etageresHTML(owned) {
  const groupes = [
    ["cartes", "Cartes"],
    ["jeux", "Jeux"],
    ["jouets", "Jouets"],
    ["scelles", "Scellés"],
    ["reste", "Autres"],
  ];
  return groupes.map(([id, label]) => {
    const rows = owned.filter((item) => familleDe(item) === id);
    if (!rows.length) return "";
    return `
      <h3 class="etagere-titre">${label}</h3>
      <div class="etagere">${rows.map((item) => pieceBouton(item)).join("")}</div>`;
  }).join("");
}

function collectionHTML() {
  if (state.visit) return visitHTML();
  const mine = state.collection;
  const owned = mine.items.filter((item) => !item.want);
  const wants = mine.items.filter((item) => item.want);
  const comptes = { cartes: 0, jeux: 0, jouets: 0, scelles: 0, reste: 0 };
  owned.forEach((item) => { comptes[familleDe(item)] += 1; });
  const noms = [
    ["cartes", "Cartes", comptes.cartes],
    ["jeux", "Jeux", comptes.jeux],
    ["jouets", "Jouets", comptes.jouets],
    ["scelles", "Scellés", comptes.scelles],
  ];
  if (comptes.reste) noms.push(["reste", "Autres", comptes.reste]);
  if (wants.length) noms.push(["chasse", "En chasse", wants.length]);
  const vide = !owned.length && !wants.length;
  const auto = !owned.some((item) => item.honor);
  const vitrine = presentoirItems();
  const chasse = wants.length
    ? `<h3 class="etagere-titre">Je les cherche</h3><div class="chasse">${wants.map((item) => pieceBouton(item)).join("")}</div>`
    : "";
  const corps = vide
    ? `
      <div class="niches" aria-hidden="true"><span class="niche"></span><span class="niche"></span><span class="niche"></span><span class="niche"></span></div>
      <p class="lede">Quatre places libres. Le musée est à côté : une carte, un jeu, une peluche, un coffret.</p>
      <button class="btn solid" type="button" data-tab="musee">Entrer dans le musée</button>`
    : `
      <div class="comptes">${noms.map(([, label, count]) => `<p><strong>${count}</strong><span>${label}</span></p>`).join("")}</div>
      ${worthCourt()}
      ${vitrine.length ? `<h3 class="etagere-titre">${auto ? "Dernières pièces" : "À l'honneur"}</h3><div class="presentoir">${vitrine.map((item) => pieceBouton(item)).join("")}</div>` : ""}
      ${chasse}
      ${etageresHTML(owned.filter((item) => !vitrine.includes(item)))}`;
  return `
    <section class="cabinet">
      <p class="kicker">Cabinet</p>
      <input id="coll-name" class="cabinet-nom" type="text" maxlength="24" value="${esc(mine.name)}" placeholder="Ma collection" aria-label="Nom de la collection" autocomplete="nickname">
      ${corps}
      <form class="cabinet-partage" id="coll-form">
        <label class="coll-check"><input id="coll-named" type="checkbox" ${mine.named ? "checked" : ""}> Montrer ce nom dans le lien</label>
        <button class="btn" type="button" data-action="coll-share">Partager le présentoir</button>
        <p class="note" id="coll-status">${esc(state.shareNote)}</p>
      </form>
      <p class="note">Le lien montre le présentoir. Sans pièce à l'honneur, il montre les dernières entrées. Il ne vend rien.</p>
    </section>`;
}

async function hydrateVisit() {
  if (!state.visit || state.visit.error || state.tab !== "collection") return;
  const token = ++visitEpoch;
  const all = [...(state.visit.items || []), ...(state.visit.favs || [])];
  const univers = all.filter((row) => universKind(row.box));
  if (univers.length) {
    await Promise.all([loadUnivers(), loadFx()]);
    if (token !== visitEpoch || state.tab !== "collection" || !state.visit) return;
    univers.forEach((row) => {
      const item = (state.univers || []).find((entry) => String(entry.id) === row.id);
      if (!item) return;
      const src = imagePiece(universSrc(item));
      if (src) row.image = src;
      const montant = universMontant(item);
      if (typeof montant === "number" && montant >= 0) row.usd = montant;
      if (item.name) row.name = looseNote(item.name).trim() || row.name;
      if (item.set) row.setName = looseNote(item.set).trim();
    });
    paintCollectionPrices();
  }
  const rows = all.filter((row) => !row.box);
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
    state.shareNote = "Ajoute une pièce avant de copier le lien.";
    if (status) status.textContent = state.shareNote;
    return;
  }
  const token = await encodeShare(payload);
  if (token.length > 1800) {
    state.shareNote = "Le lien est trop long. Raccourcis un commentaire ou retire une pièce.";
    if (status) status.textContent = state.shareNote;
    return;
  }
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("voir", token);
  url.hash = "collection";
  const link = url.toString();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Collection Aureum", url: link });
      state.shareNote = "Lien prêt à envoyer.";
      if (status) status.textContent = state.shareNote;
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        state.shareNote = "";
        if (status) status.textContent = "";
        return;
      }
    }
  }
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
  const salle = (html) => `${museeRail()}${html}`;
  if (state.tab === "galerie") app.innerHTML = salle(galleryHTML());
  else if (state.tab === "extensions") app.innerHTML = salle(extensionsHTML());
  else if (state.tab === "etb") app.innerHTML = salle(etbHTML());
  else if (state.tab === "univers") app.innerHTML = salle(universHTML());
  else if (state.tab === "cotes") app.innerHTML = salle(cotesHTML());
  else if (state.tab === "classeur") {
    app.innerHTML = binderHTML();
    hydrateBinderFoils();
    hydrateBinderScans();
  }
  else if (state.tab === "collection") app.innerHTML = collectionHTML();
  else {
    app.innerHTML = binderHTML();
    hydrateBinderFoils();
    hydrateBinderScans();
  }
  if (state.tab === "galerie") renderGrid();
  updateFavCount();
  watchMore();
  wakeScans(app);
  window.setTimeout(() => wakeScans(app), 800);
  window.setTimeout(() => {
    app.querySelectorAll("img.is-trying").forEach((img) => {
      if (img.naturalWidth > 0) img.classList.remove("is-trying", "is-broken");
      else img.classList.remove("is-trying");
      marquerScan(img);
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
    return;
  }
  if (kind === "cotes") {
    if (state.cotePage * PAGE_SIZE >= coteEntries().length) return;
    state.cotePage += 1;
    paintCotes();
  }
}

let coteObserver = null;

function suivreCotes() {
  if (!coteObserver) {
    coteObserver = new IntersectionObserver((entries) => {
      const briefs = [];
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        coteObserver.unobserve(entry.target);
        const id = entry.target.getAttribute("data-card");
        const card = activeCards().find((item) => item.id === id);
        if (!card?.id || cache.has(cacheKey(card.id, langueCarte(card)))) return;
        briefs.push(card);
      });
      if (briefs.length) {
        pool(briefs, 4, async (brief) => {
          const token = epoch;
          try {
            const full = await getCard(brief.id, langueCarte(brief));
            if (token !== epoch) return;
            patchCard(full);
          } catch {
            /* Une carte sans cote ne bloque pas les autres. */
          }
        });
      }
    }, { rootMargin: "900px 0px" });
  }
  coteObserver.disconnect();
  document.querySelectorAll("#grille .tile[data-card]").forEach((node) => {
    const id = node.getAttribute("data-card");
    const card = activeCards().find((item) => item.id === id);
    if (!card?.id || cache.has(cacheKey(card.id, langueCarte(card)))) return;
    coteObserver.observe(node);
  });
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
  suivreCotes();
}

function risePage() {
  if (!motionOK) return;
  const app = document.getElementById("app");
  if (!app) return;
  app.classList.remove("is-rising");
  void app.offsetWidth;
  app.classList.add("is-rising");
}

function setTab(tab) {
  if (tab === "favoris") tab = "classeur";
  if (tab === "musee") tab = MUSEE.includes(state.museeSalle) ? state.museeSalle : "galerie";
  const relief = document.getElementById("relief");
  if (relief?.open) relief.close();
  const changed = TABS.includes(tab) && tab !== state.tab;
  if (tab !== "collection") {
    const url = new URL(location.href);
    if (url.searchParams.has("voir")) {
      url.searchParams.delete("voir");
      url.hash = tab;
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }
  if (MUSEE.includes(tab)) state.museeSalle = tab;
  if (tab === "cotes" || ((tab === "etb" || tab === "univers") && activeCurrency() !== "USD")) loadFx();
  rememberTab(tab);
  render();
  if (changed) risePage();
  window.scrollTo(0, 0);
  if (tab === "extensions") selectSeries(state.browseSeriesId);
  if (tab === "collection") {
    hydrateVisit();
    refreshCollection();
    if (collectionHasBox()) loadFx().then(() => paintCollectionPrices());
  }
  if (tab === "etb") {
    loadSealed();
    settleUsdFx("etb");
  }
  if (tab === "univers") {
    loadUnivers();
    settleUsdFx("univers");
  }
  if (tab === "cotes") {
    loadHall();
    loadSealed();
    settleUsdFx("cotes");
  }
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

async function cartesDuSet(detail, lang) {
  const cartes = (Array.isArray(detail?.cards) ? detail.cards : [])
    .filter((card) => card?.id)
    .map((card) => ({ ...card, lang }));
  const attendu = Number(detail?.cardCount?.total) || 0;
  if (lang === "en" || cartes.length >= attendu) return cartes;
  try {
    const autre = await fetchJSON(`/sets/${encodeURIComponent(detail.id)}`, "en");
    const connus = new Set(cartes.map((card) => card.id));
    (Array.isArray(autre?.cards) ? autre.cards : []).forEach((card) => {
      if (!card?.id || connus.has(card.id)) return;
      connus.add(card.id);
      cartes.push({ ...card, lang: "en" });
    });
  } catch {
    /* Le catalogue de la langue choisie reste affiché. */
  }
  return cartes;
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
    const cartes = await cartesDuSet(detail, state.market);
    if (token !== epoch) return;
    state.setDetail = detail;
    state.setCards = cartes;
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

function languesCatalogue() {
  return [...new Set([state.market || "fr", "fr", "en"])];
}

async function cartesParNom(query) {
  const langues = languesCatalogue();
  const listes = await Promise.all(langues.map(async (lang) => {
    try {
      const list = await fetchJSON(`/cards?name=${encodeURIComponent(query)}`, lang);
      return (Array.isArray(list) ? list : []).map((card) => ({ ...card, lang }));
    } catch {
      return [];
    }
  }));
  const marche = state.market || "fr";
  const ordre = langues.map((lang, index) => index).sort((a, b) => Number(langues[a] === marche) - Number(langues[b] === marche));
  const parId = new Map();
  ordre.forEach((index) => {
    listes[index].forEach((card) => {
      if (card?.id) parId.set(card.id, card);
    });
  });
  return [...parId.values()];
}

async function runSearch(raw) {
  const query = String(raw || "").trim();
  state.query = query;
  const clear = document.getElementById("clear-q");
  if (clear) clear.hidden = query.length === 0;
  if (query.length < 2) {
    state.searchGames = [];
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
  state.searchGames = [];
  state.searchTotal = 0;
  rememberTab("galerie");
  render();
  try {
    const [rows] = await Promise.all([
      cartesParNom(query),
      loadUnivers(),
    ]);
    if (token !== epoch) return;
    state.searchTotal = rows.length;
    state.searchCards = rows;
    state.searchGames = jeuxCorrespondants(query);
    state.loading = false;
    render();
    hydrateShown(token);
  } catch {
    if (token !== epoch) return;
    state.searchGames = jeuxCorrespondants(query);
    state.loading = false;
    state.error = "La recherche n'a pas abouti.";
    render();
  }
}

function langueCarte(card) {
  return MARKETS[card?.lang] ? card.lang : state.market;
}

function cardsToHydrate() {
  const source = shownCards();
  const slice = state.view === "set" ? source.slice(0, 24) : source;
  return slice.filter((card) => card?.id);
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
      const full = await getCard(brief.id, langueCarte(brief));
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
  if (setsCache.has(cacheKey(id))) {
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
      const full = await getCard(brief.id, langueCarte(brief));
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
  return `<div class="fiche-bar">${next}${boutonBug()}<button class="close" type="button" data-action="close">Fermer</button></div>`;
}

function nextRandomCard() {
  const poolCards = state.setCards.length ? state.setCards : activeCards();
  if (!poolCards.length) return null;
  const current = document.getElementById("relief")?.dataset.card || document.getElementById("fiche")?.dataset.current || "";
  const others = poolCards.filter((card) => card.id !== current);
  const source = others.length ? others : poolCards;
  return source[Math.floor(Math.random() * source.length)];
}

function ficheHTML(card) {
  const types = Array.isArray(card.types) ? card.types : [];
  const when = formatDay(card.pricing?.cardmarket?.updated);
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
        ${gestesHTML(card.id, card.lang || state.market)}
        <p class="hint">Cote indicative Cardmarket, pas une offre d'achat.</p>
      </div>
    </article>`;
}

function fichePending() {
  return `<div class="pending">${ficheBar()}<div class="pending-body" role="status"><span class="mark lg" aria-hidden="true"></span><p>Ouverture de la fiche…</p></div></div>`;
}

function productHTML(item, family) {
  const label = family === "univers" ? universLabel(item.kind) : sealedLabel(item.kind);
  const day = family === "univers"
    ? releasedLabel(item.released)
    : formatDay(item.released ? `${item.released}T12:00:00` : "");
  const bits = [label];
  if (item.set) bits.push(item.set);
  if (day) bits.push(day);
  const faces = family === "univers" ? universFaces(item) : [];
  const shot = family === "univers"
    ? (faces[0]?.image || universSrc(item)).replace("_in_400x400", "_in_1000x1000")
    : (/^\d+$/.test(String(item.id)) ? boxSrc(item.id, "high") : "");
  const art = faces.length >= 2
    ? faces.map((face) => `<img class="shot" src="${esc(face.image)}" alt="${esc(face.name)}" decoding="async" referrerpolicy="no-referrer">`).join("")
    : !shot
      ? `<span class="monogram">${esc(initials(item.name))}</span>`
      : family === "sealed"
        ? `<img src="${esc(shot)}" data-fallbacks="${esc(boxFallbacks(item.id, ["low", "200w"]))}" alt="${esc(item.name)}">`
        : `<img class="shot" src="${esc(shot)}" alt="${esc(item.name)}" decoding="async" referrerpolicy="no-referrer">`;
  const asOf = family === "univers" ? state.universAsOf : state.sealedAsOf;
  const when = typeof item.usd === "number" ? formatDay(asOf ? `${asOf}T12:00:00` : "") : "";
  const montant = family === "univers" ? universMontant(item) : (typeof item.usd === "number" ? item.usd : null);
  const parts = family === "univers" ? universParts(item) : [];
  const note = typeof item.usd === "number"
    ? tcgplayerNote(when)
    : (family === "univers" ? venteNote(item) : "Pas de cote unitaire pour cette ligne.");
  const prix = parts.length >= 2
    ? parts.map((part) => `<p class="cote-price is-part"><span class="price-name">${esc(part.name)}</span> ${esc(usdPlain(part.usd))}</p>`).join("")
    : (typeof montant === "number" ? `<p class="cote-price">${esc(usdPlain(montant))}</p>` : "");
  const cherche = state.photoBusy === String(item.id);
  const gestes = gestesHTML(String(item.id), "fr", family);
  const photoBtn = family === "univers" ? `
        <div class="fiche-actions">
          <button class="btn" type="button" data-action="autre-photo" data-id="${esc(item.id)}" ${cherche ? "disabled" : ""}>${cherche ? "Recherche…" : (shot ? "Autre photo" : "Chercher une photo")}</button>
        </div>
        ${gestes}
        ${state.photoNote && productOpen?.id === String(item.id) ? `<p class="note">${esc(state.photoNote)}</p>` : ""}` : gestes;
  return `
    <article class="fiche">
      ${ficheBar()}
      <div class="fiche-art">
        <div class="stage is-box${faces.length >= 2 ? " is-pair" : ""}" data-label="${esc(initials(item.name))}">${art}</div>
      </div>
      <div class="fiche-body">
        <p class="kicker">${esc(bits.join(" · "))}</p>
        <h2>${esc(item.name)}</h2>
        ${prix}
        <p class="note">${esc(note)}</p>
        ${photoBtn}
      </div>
    </article>`;
}

function openProduct(item, family) {
  const meme = productOpen?.id === String(item.id) && productOpen?.family === family;
  if (!meme) state.photoNote = "";
  productOpen = { id: String(item.id), family };
  const dialog = document.getElementById("fiche");
  keepFiche();
  dialog.dataset.mode = "";
  dialog.dataset.current = "";
  dialog.innerHTML = productHTML(item, family);
  lockSheet();
  if (!dialog.open) dialog.showModal();
}

function produitIntrouvable(message) {
  productOpen = null;
  const dialog = document.getElementById("fiche");
  keepFiche();
  dialog.dataset.mode = "";
  dialog.dataset.current = "";
  dialog.innerHTML = `<div class="fiche-error">${ficheBar()}<p>${esc(message)}</p></div>`;
  dialog.removeAttribute("aria-busy");
  lockSheet();
  if (!dialog.open) dialog.showModal();
}

async function openFiche(id, modeOrOpts) {
  productOpen = null;
  const opts = typeof modeOrOpts === "string" ? { mode: modeOrOpts } : (modeOrOpts || {});
  const lang = opts.lang || state.market;
  const safe = cleanId(id, "");
  if (!safe) return;
  const dialog = document.getElementById("fiche");
  keepFiche();
  dialog.dataset.current = safe;
  dialog.dataset.lang = lang;
  dialog.dataset.mode = opts.mode === "random" ? "random" : "";
  dialog.setAttribute("aria-busy", "true");
  dialog.innerHTML = fichePending();
  lockSheet();
  if (!dialog.open) dialog.showModal();
  try {
    const card = await getCard(safe, lang);
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = ficheHTML(card);
    dialog.removeAttribute("aria-busy");
    touchFav(card);
  } catch {
    if (dialog.dataset.current !== safe) return;
    dialog.innerHTML = `<div class="fiche-error">${ficheBar()}<p>Impossible d'ouvrir cette fiche.</p></div>`;
    dialog.removeAttribute("aria-busy");
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

const SIGNAL_KEY = "aureum.signalements";
const SIGNAL_MAX = 12;

function horlogeParis(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function idFichier(id) {
  return String(id || "sans-id").replace(/[^\w.-]+/g, "").slice(0, 48) || "sans-id";
}

function srcCapture(shot) {
  if (typeof shot !== "string") return "";
  const propre = shot.replace(/\s/g, "");
  return /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(propre) ? propre : "";
}

function idSignal() {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const lire = (type) => parts.find((part) => part.type === type)?.value || "00";
  const suffixe = Math.random().toString(36).slice(2, 6);
  return `${lire("year")}${lire("month")}${lire("day")}-${lire("hour")}${lire("minute")}-${suffixe}`;
}

function lireSignaux() {
  try {
    const brut = JSON.parse(localStorage.getItem(SIGNAL_KEY) || "[]");
    return Array.isArray(brut) ? brut : [];
  } catch {
    return [];
  }
}

function ecrireSignaux(liste) {
  const garde = liste.slice(0, SIGNAL_MAX);
  const tenter = (valeur) => {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify(valeur));
  };
  try {
    tenter(garde);
    return true;
  } catch {
    try {
      tenter(garde.map((item, index) => (index === 0 ? item : { ...item, shot: "" })));
      return true;
    } catch {
      return false;
    }
  }
}

function contexteSignal() {
  const fiche = document.getElementById("fiche");
  const relief = document.getElementById("relief");
  const bouts = [`Onglet ${state.tab || "galerie"}`];
  if (state.view && state.view !== "set") bouts.push(state.view);
  if (state.setId) bouts.push(`Extension ${state.setId}`);
  if (fiche?.open && fiche.dataset.current) bouts.push(`Fiche ${fiche.dataset.current}`);
  if (relief?.open && relief.dataset.card) bouts.push(`Relief ${relief.dataset.card}`);
  bouts.push(`${window.innerWidth} × ${window.innerHeight}`);
  return bouts.join(" · ");
}

function chargerCapture() {
  if (typeof window.html2canvas === "function") return Promise.resolve(window.html2canvas);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("vendor/html2canvas.min.js?v=84", location.href).href;
    script.onload = () => {
      if (typeof window.html2canvas === "function") resolve(window.html2canvas);
      else reject(new Error("capture"));
    };
    script.onerror = () => reject(new Error("capture"));
    document.head.appendChild(script);
  });
}

function moderniserCouleur(value) {
  return String(value).replace(/color\(\s*srgb(?:-linear)?\s+([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi, (_, r, g, b, a) => {
    const canal = (part) => {
      const texte = String(part);
      return texte.endsWith("%") ? Math.round(parseFloat(texte) * 2.55) : Math.round(parseFloat(texte) * 255);
    };
    const rouge = canal(r);
    const vert = canal(g);
    const bleu = canal(b);
    if (a == null) return `rgb(${rouge}, ${vert}, ${bleu})`;
    const alpha = String(a).endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
    return `rgba(${rouge}, ${vert}, ${bleu}, ${alpha})`;
  });
}

function remplacerScanPrive(img) {
  const src = img.getAttribute("src") || "";
  if (!src.includes("tcgplayer")) return;
  const urls = (img.dataset.fallbacks || "").split("|").filter((url) => url.includes("assets.tcgdex.net"));
  const secours = urls.find((url) => /\.(png|jpe?g)(?:$|\?)/i.test(url)) || urls[0];
  if (!secours) return;
  img.crossOrigin = "anonymous";
  img.setAttribute("src", secours);
}

function figerCouleurs(doc) {
  const props = ["color", "backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "boxShadow", "backgroundImage", "webkitMaskImage", "maskImage", "textDecorationColor"];
  const vue = doc.defaultView;
  doc.documentElement.classList.add("is-capture");
  const corps = doc.body;
  corps.classList.remove("sheet-open");
  corps.style.position = "static";
  corps.style.top = "0";
  corps.style.left = "0";
  doc.querySelectorAll("img").forEach(remplacerScanPrive);
  doc.querySelectorAll("dialog[open]").forEach((dialog) => {
    dialog.style.display = "block";
    dialog.style.opacity = "1";
    dialog.style.transform = "none";
  });
  doc.querySelectorAll("*").forEach((element) => {
    const style = vue.getComputedStyle(element);
    if (style.backdropFilter && style.backdropFilter !== "none") element.style.backdropFilter = "none";
    props.forEach((prop) => {
      const value = style[prop];
      if (!value) return;
      if ((prop === "backgroundImage" || prop === "webkitMaskImage" || prop === "maskImage") && /svg|https?:/i.test(value)) {
        element.style[prop] = "none";
        return;
      }
      if (/color-mix\(|oklch\(|oklab\(/.test(value)) {
        element.style[prop] = prop === "backgroundImage" ? "none" : "#14120f";
        return;
      }
      if (value.includes("color(")) element.style[prop] = moderniserCouleur(value);
    });
  });
}

function poserComme(copie, source) {
  const box = source.getBoundingClientRect();
  copie.style.position = "absolute";
  copie.style.inset = "auto";
  copie.style.margin = "0";
  copie.style.transform = "none";
  copie.style.top = `${box.top}px`;
  copie.style.left = `${box.left}px`;
  copie.style.width = `${box.width}px`;
}

function figerInstant() {
  const width = Math.max(1, Math.round(window.innerWidth));
  const height = Math.max(1, Math.round(window.innerHeight));
  const hote = document.createElement("div");
  hote.id = "capture-hote";
  hote.setAttribute("aria-hidden", "true");
  hote.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${height}px;overflow:hidden;opacity:0;pointer-events:none;background:#0b0a08;z-index:0;`;
  const feuille = ["relief", "fiche"].map((id) => document.getElementById(id)).find((dialog) => dialog?.open) || null;
  if (feuille) {
    const copie = feuille.cloneNode(true);
    copie.removeAttribute("open");
    copie.style.display = "block";
    copie.style.opacity = "1";
    copie.style.maxHeight = "none";
    copie.style.overflow = "hidden";
    poserComme(copie, feuille);
    copie.style.height = `${feuille.getBoundingClientRect().height}px`;
    hote.appendChild(copie);
    const sourceCorps = feuille.querySelector(".fiche-body, .relief-copy");
    const copieCorps = copie.querySelector(".fiche-body, .relief-copy");
    if (sourceCorps && copieCorps && sourceCorps.scrollTop) {
      copieCorps.style.transform = `translateY(-${sourceCorps.scrollTop}px)`;
    }
  } else {
    const entete = document.querySelector("header");
    const corps = document.querySelector("main");
    if (entete) {
      const copie = entete.cloneNode(true);
      copie.style.zIndex = "2";
      poserComme(copie, entete);
      hote.appendChild(copie);
    }
    if (corps) {
      const copie = corps.cloneNode(true);
      poserComme(copie, corps);
      hote.appendChild(copie);
    }
  }
  hote.querySelectorAll("#signal, #porte, #journal").forEach((element) => element.remove());
  document.body.appendChild(hote);
  return { hote, width, height };
}

function dessinOk(img) {
  if (!(img instanceof HTMLImageElement) || !img.naturalWidth) return false;
  try {
    const toile = document.createElement("canvas");
    toile.width = 1;
    toile.height = 1;
    toile.getContext("2d").drawImage(img, 0, 0, 1, 1);
    toile.toDataURL();
    return true;
  } catch {
    return false;
  }
}

function imageEnData(img) {
  const toile = document.createElement("canvas");
  toile.width = img.naturalWidth;
  toile.height = img.naturalHeight;
  toile.getContext("2d").drawImage(img, 0, 0);
  img.removeAttribute("srcset");
  img.src = toile.toDataURL("image/jpeg", 0.82);
}

function oterImage(img) {
  img.removeAttribute("src");
  img.removeAttribute("srcset");
}

async function imageAnonyme(src) {
  const copie = new Image();
  copie.crossOrigin = "anonymous";
  const ok = await new Promise((resolve) => {
    copie.onload = () => resolve(copie.naturalWidth > 0);
    copie.onerror = () => resolve(false);
    copie.src = src;
  });
  return ok ? copie : null;
}

async function figerImages(hote) {
  const images = [...hote.querySelectorAll("img")];
  await Promise.race([
    Promise.all(images.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      if (dessinOk(img)) {
        try {
          imageEnData(img);
        } catch {
          oterImage(img);
        }
        return;
      }
      const copie = await imageAnonyme(src);
      if (copie && dessinOk(copie)) {
        try {
          imageEnData(copie);
          img.removeAttribute("srcset");
          img.src = copie.src;
          return;
        } catch {
          /* Le visuel externe reste dehors : la page, elle, part quand même. */
        }
      }
      oterImage(img);
    })),
    new Promise((resolve) => setTimeout(resolve, 1800)),
  ]);
  hote.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src && !src.startsWith("data:")) oterImage(img);
  });
}

async function toileHtml(html2canvas, hote, width, height) {
  return html2canvas(hote, {
    x: 0,
    y: 0,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    scale: 1,
    useCORS: false,
    allowTaint: false,
    backgroundColor: "#0b0a08",
    logging: false,
    imageTimeout: 1200,
    ignoreElements: (element) => element.id === "signal" || element.id === "porte" || element.id === "journal" || Boolean(element.closest?.("#signal, #porte, #journal")),
    onclone: (doc) => {
      try {
        const copie = doc.getElementById("capture-hote");
        doc.querySelectorAll("#signal, #porte, #journal").forEach((element) => element.remove());
        if (copie && doc.body) {
          [...doc.body.children].forEach((element) => {
            if (element !== copie) element.remove();
          });
          copie.style.opacity = "1";
        }
        figerCouleurs(doc);
        const style = doc.createElement("style");
        style.textContent = "html.is-capture *::before,html.is-capture *::after{background-image:none!important;mask-image:none!important;-webkit-mask-image:none!important}";
        doc.head?.appendChild(style);
        copie?.querySelectorAll("img").forEach((img) => {
          const src = img.getAttribute("src") || "";
          if (src && !src.startsWith("data:")) oterImage(img);
        });
      } catch {
        /* Une couleur récente ne doit pas empêcher la photo. */
      }
    },
  });
}

async function priseEcran(instant) {
  const html2canvas = await chargerCapture();
  const { hote, width, height } = instant;
  hote.querySelectorAll(".tile, .set-tile, .coll-card, .pocket").forEach((element) => {
    if (element.getBoundingClientRect().top > height + 40) element.remove();
  });
  await figerImages(hote);
  let toile;
  try {
    toile = await toileHtml(html2canvas, hote, width, height);
  } catch {
    hote.querySelectorAll("img").forEach(oterImage);
    toile = await toileHtml(html2canvas, hote, width, height);
  }
  if (!toile) throw new Error("capture");
  try {
    return jpegToile(toile);
  } catch {
    hote.querySelectorAll("img").forEach(oterImage);
    try {
      const autre = await toileHtml(html2canvas, hote, width, height);
      return jpegToile(autre);
    } catch {
      return photoTexte(hote, width, height);
    }
  }
}

function jpegToile(toile) {
  return toile.toDataURL("image/jpeg", 0.6);
}

function photoTexte(hote, width, height) {
  const toile = document.createElement("canvas");
  toile.width = width;
  toile.height = height;
  const ctx = toile.getContext("2d");
  ctx.fillStyle = "#0b0a08";
  ctx.fillRect(0, 0, width, height);
  const origine = hote.getBoundingClientRect();
  ctx.textBaseline = "top";
  hote.querySelectorAll("h1, h2, p, button, a, span, label, strong, li").forEach((element) => {
    const texte = [...element.childNodes].filter((noeud) => noeud.nodeType === 3).map((noeud) => noeud.textContent.trim()).filter(Boolean).join(" ");
    if (!texte) return;
    const box = element.getBoundingClientRect();
    const y = box.top - origine.top;
    const x = box.left - origine.left;
    if (y > height || y < -30 || x > width) return;
    ctx.fillStyle = /^h[12]$/i.test(element.tagName) ? "#f4efe6" : "#d9d0c3";
    ctx.font = /^h[12]$/i.test(element.tagName) ? "600 28px Georgia, serif" : "16px Georgia, serif";
    try {
      ctx.fillText(texte.slice(0, 90), Math.max(8, x), Math.max(0, y));
    } catch {
      /* Une ligne illisible ne bloque pas le reste. */
    }
  });
  hote.querySelectorAll("img").forEach((img) => {
    if (!dessinOk(img)) return;
    const box = img.getBoundingClientRect();
    try {
      ctx.drawImage(img, box.left - origine.left, box.top - origine.top, box.width || img.naturalWidth, box.height || img.naturalHeight);
    } catch {
      /* Une image refusée reste dehors. */
    }
  });
  return toile.toDataURL("image/jpeg", 0.6);
}

function brouillonSignal(shot) {
  return {
    id: idSignal(),
    when: horlogeParis(),
    where: contexteSignal(),
    url: location.href,
    ua: navigator.userAgent,
    errors: [...(window.aureumErreurs || [])].slice(0, 6),
    qui: emailSession() || "",
    text: "",
    shot: shot || "",
  };
}

const NTFY_TOPIC = "aureum-signalements-k7m3p9";
let signauxVisibles = [];
let identifiantsRetires = new Set();

function srcVisuel(report) {
  const local = srcCapture(report?.shot);
  if (local) return local;
  if (typeof report?.image === "string" && /^[\w.-]+\.jpg$/.test(report.image)) {
    return new URL(`signalements/${report.image}`, location.href).href;
  }
  if (typeof report?.file === "string" && report.file.startsWith("https://ntfy.sh/file/")) return report.file;
  return "";
}

function fusionSignaux(listes) {
  const map = new Map();
  listes.flat().forEach((report) => {
    if (!report?.id) return;
    const deja = map.get(report.id) || {};
    map.set(report.id, {
      ...deja,
      ...report,
      shot: report.shot || deja.shot || "",
      file: report.file || deja.file || "",
      image: report.image || deja.image || "",
      text: report.text || deja.text || "",
      traite: Boolean(report.traite || deja.traite),
    });
  });
  return [...map.values()]
    .filter((report) => !identifiantsRetires.has(report.id))
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));
}

async function lireDepot() {
  try {
    const reponse = await fetch(new URL("signalements/journal.json", location.href), { cache: "no-store" });
    if (!reponse.ok) return [];
    const data = await reponse.json();
    identifiantsRetires = new Set(
      (Array.isArray(data?.retires) ? data.retires : []).filter((id) => typeof id === "string" && id),
    );
    return Array.isArray(data?.reports) ? data.reports : [];
  } catch {
    return [];
  }
}

async function lireNtfy() {
  try {
    const reponse = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/json?poll=1&since=24h`);
    if (!reponse.ok) return [];
    const texte = await reponse.text();
    const rapports = [];
    texte.split("\n").forEach((ligne) => {
      if (!ligne.trim()) return;
      let evenement;
      try {
        evenement = JSON.parse(ligne);
      } catch {
        return;
      }
      if (evenement?.event !== "message") return;
      const corps = decoderMessage(evenement.message);
      if (!corps) return;
      if (corps?.cabinet !== "aureum" || !corps.id || !corps.text) return;
      const file = evenement.attachment?.url;
      rapports.push({
        id: String(corps.id),
        when: String(corps.when || ""),
        where: String(corps.where || ""),
        url: String(corps.url || ""),
        qui: String(corps.qui || ""),
        text: String(corps.text),
        errors: Array.isArray(corps.errors) ? corps.errors.map((item) => String(item)) : [],
        file: typeof file === "string" && file.startsWith("https://ntfy.sh/file/") ? file : "",
        image: "",
        shot: "",
      });
    });
    return rapports;
  } catch {
    return [];
  }
}

async function chargerSignaux() {
  const [depot, frais] = await Promise.all([lireDepot(), lireNtfy()]);
  signauxVisibles = fusionSignaux([depot, frais, lireSignaux()]);
  paintSignaux();
}

function messageSignal(report) {
  return JSON.stringify({
    cabinet: "aureum",
    id: report.id,
    when: report.when,
    where: report.where,
    url: report.url,
    qui: emailSession() || "",
    text: report.text,
    errors: (report.errors || []).slice(0, 6).map((ligne) => String(ligne).slice(0, 240)),
  });
}

function coderMessage(report) {
  const octets = new TextEncoder().encode(messageSignal(report));
  let binaire = "";
  octets.forEach((octet) => {
    binaire += String.fromCharCode(octet);
  });
  return `b64:${btoa(binaire)}`;
}

function decoderMessage(message) {
  if (typeof message !== "string" || !message) return null;
  try {
    let json = message;
    if (message.startsWith("b64:")) {
      const binaire = atob(message.slice(4));
      const octets = Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
      json = new TextDecoder().decode(octets);
    }
    const corps = JSON.parse(json);
    return corps && typeof corps === "object" ? corps : null;
  } catch {
    return null;
  }
}

async function publierNtfy(report) {
  const message = coderMessage(report);
  const headers = { Title: report.id, Message: message };
  let body = message;
  const src = srcCapture(report.shot);
  if (src) {
    const image = await fetch(src);
    body = await image.blob();
    headers.Filename = `signalement-${idFichier(report.id)}.jpg`;
    headers["Content-Type"] = "image/jpeg";
  }
  const reponse = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, { method: "POST", body, headers });
  if (!reponse.ok) throw new Error(String(reponse.status));
  const data = await reponse.json();
  const file = data?.attachment?.url;
  return typeof file === "string" && file.startsWith("https://ntfy.sh/file/") ? file : "";
}

function memoriserSignal(report) {
  const leger = { ...report, shot: report.file || report.image ? "" : (report.shot || "") };
  const autres = lireSignaux().filter((item) => item.id !== report.id);
  return ecrireSignaux([leger, ...autres]);
}

function paintSignaux() {
  const liste = document.getElementById("signal-list");
  if (!liste) return;
  if (!signauxVisibles.length) {
    liste.innerHTML = `<p class="hint signal-vide">Aucun signalement.</p>`;
    return;
  }
  liste.innerHTML = signauxVisibles.map((report) => {
    const src = srcVisuel(report);
    const traite = report.traite === true;
    return `
    <div class="signal-item${traite ? " is-traite" : ""}">
      ${src ? `<img src="${esc(src)}" alt="">` : `<span class="signal-manque" aria-hidden="true"></span>`}
      <div class="signal-voir">
        <p class="signal-ligne">
          <strong>${esc(report.when || "Signalement")}</strong>
          ${traite ? `<span class="signal-etat">Traité</span>` : ""}
        </p>
        <span class="signal-texte">${esc(report.text || "")}</span>
      </div>
    </div>`;
  }).join("");
}

let signalCourant = null;

function montrerSignal(report, note) {
  signalCourant = report;
  const apercu = document.getElementById("signal-apercu");
  const contexte = document.getElementById("signal-contexte");
  const texte = document.getElementById("signal-texte");
  const ligne = document.getElementById("signal-note");
  if (apercu) {
    const src = srcCapture(report.shot);
    apercu.src = src;
    apercu.hidden = !src;
  }
  if (contexte) contexte.textContent = report.where || "";
  if (texte && document.activeElement !== texte) texte.value = report.text || "";
  if (ligne && note) ligne.textContent = note;
}

let signalOuverture = false;
let signalGeneration = 0;
let signalPhoto = Promise.resolve("");
let signalEchec = "";

async function ouvrirSignal() {
  const dialog = document.getElementById("signal");
  if (!dialog || dialog.open || signalOuverture) return;
  const generation = ++signalGeneration;
  signalOuverture = true;
  const instant = figerInstant();
  const report = brouillonSignal("");
  montrerSignal(report, "La photo se prépare.");
  const texte = document.getElementById("signal-texte");
  if (texte) texte.value = "";
  paintSignaux();
  dialog.showModal();
  lockSheet();
  texte?.focus();
  chargerSignaux();
  const promesse = priseEcran(instant).then((photo) => {
    if (srcCapture(photo)) {
      signalEchec = "";
      return photo;
    }
    if (!signalEchec) signalEchec = "La photo n'était pas prête.";
    return "";
  }).catch((erreur) => {
    signalEchec = String(erreur && erreur.message || erreur || "capture").slice(0, 180);
    return "";
  }).finally(() => instant.hote.remove());
  signalPhoto = promesse;
  let shot = "";
  try {
    shot = await Promise.race([
      promesse,
      new Promise((_, reject) => setTimeout(() => reject(new Error("lent")), 12000)),
    ]);
  } catch {
    shot = "";
    if (!signalEchec) signalEchec = "La photo n'était pas prête.";
  } finally {
    signalOuverture = false;
  }
  const poser = (photo) => {
    if (!photo || generation !== signalGeneration || !dialog.open) return;
    report.shot = photo;
    montrerSignal(report, "La photo est prise. Dis ce qui cloche, puis envoie.");
  };
  if (shot) {
    poser(shot);
    return;
  }
  promesse.then(poser);
  if (generation !== signalGeneration || !dialog.open) return;
  montrerSignal(report, "La photo n'a pas pu être prise. Le texte suffit.");
}

function fermerSignal() {
  signalGeneration += 1;
  const dialog = document.getElementById("signal");
  if (dialog?.open) dialog.close();
  unlockSheet();
}

function reportDepuisFormulaire() {
  const texte = document.getElementById("signal-texte")?.value.trim() || "";
  const base = signalCourant || brouillonSignal("");
  return { ...base, text: texte };
}

function bindSignal() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-signaler]")) return;
    ouvrirSignal();
  });
  const dialog = document.getElementById("signal");
  const form = document.getElementById("signal-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const report = reportDepuisFormulaire();
    if (!report.text) return;
    const bouton = form.querySelector("[type='submit']");
    const note = document.getElementById("signal-note");
    if (bouton) {
      bouton.disabled = true;
      bouton.textContent = "Envoi…";
    }
    try {
      if (!srcCapture(report.shot)) {
        if (note) note.textContent = "La photo se joint à l'envoi.";
        const photo = await Promise.race([
          signalPhoto,
          new Promise((resolve) => setTimeout(() => resolve(""), 12000)),
        ]);
        if (srcCapture(photo)) report.shot = photo;
      }
      if (!srcCapture(report.shot)) {
        const pourquoi = signalEchec || "La photo n'était pas prête.";
        const nav = (navigator.userAgent || "").replace(/\s+/g, " ").slice(0, 140);
        report.errors = [...(report.errors || []), pourquoi, nav].filter(Boolean).slice(0, 6);
        report.shot = "";
      }
      const file = await publierNtfy(report);
      memoriserSignal({ ...report, file, shot: "" });
      const texte = document.getElementById("signal-texte");
      if (texte) texte.value = "";
      signalCourant = brouillonSignal("");
      fermerSignal();
      await chargerSignaux();
    } catch {
      memoriserSignal(report);
      signauxVisibles = fusionSignaux([signauxVisibles, lireSignaux()]);
      paintSignaux();
      if (note) note.textContent = "L'envoi n'a pas abouti. Le signalement reste sur cet appareil.";
    } finally {
      if (bouton) {
        bouton.disabled = false;
        bouton.textContent = "Envoyer";
      }
    }
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target.closest("[data-signal='close']")) fermerSignal();
  });
  dialog?.addEventListener("close", () => {
    unlockSheet();
  });
}

function bind() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("q");
  const clear = document.getElementById("clear-q");
  const dialog = document.getElementById("fiche");
  dialog.addEventListener("close", () => {
    dialog.classList.remove("is-leaving");
    productOpen = null;
  });

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
      const noteLang = event.target.dataset.lang || "fr";
      const item = state.collection.items.find((row) => {
        if (row.id !== noteId) return false;
        if (row.box) return true;
        return (row.lang || "fr") === noteLang;
      });
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
    if (event.target.id === "univers-console") {
      state.universConsole = event.target.value;
      if (state.universConsole) {
        state.universKind = "jeu";
        state.universMarque = "";
      }
      state.universPage = 1;
      render();
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
  dialog.addEventListener("close", unlockSheet);
  relief?.addEventListener("close", () => {
    foilTilt.finger = false;
    foilTilt.stage = null;
    reliefLeaving = false;
    unlockSheet();
  });
  relief?.addEventListener("cancel", (event) => {
    event.preventDefault();
    leaveRelief();
  });
  relief?.addEventListener("click", (event) => {
    if (event.target === relief) leaveRelief();
  });

  document.addEventListener("pointerdown", (event) => {
    const pocket = event.target.closest?.("[data-pocket]");
    if (!pocket || state.tab !== "classeur") return;
    if (event.button != null && event.button !== 0) return;
    const index = Number(pocket.dataset.pocket);
    const id = state.binder.pages[state.binder.page]?.[index] || "";
    lift = { id, from: index, x: event.clientX, y: event.clientY, moved: false, scrolling: false, pointerId: event.pointerId, pocket };
  });

  document.addEventListener("pointermove", (event) => {
    if (!lift || event.pointerId !== lift.pointerId || lift.scrolling) return;
    const dx = event.clientX - lift.x;
    const dy = event.clientY - lift.y;
    if (!lift.moved) {
      if (dx * dx + dy * dy < 64) return;
      if (!lift.id || Math.abs(dy) >= Math.abs(dx)) {
        lift.scrolling = true;
        return;
      }
      lift.moved = true;
      lift.pocket?.setPointerCapture?.(lift.pointerId);
    }
    event.preventDefault();
    showGhost(lift.id, event.clientX, event.clientY);
  });

  document.addEventListener("pointerup", (event) => {
    if (!lift || event.pointerId !== lift.pointerId) return;
    const current = lift;
    lift = null;
    hideGhost();
    if (current.scrolling) {
      suppressPocketClick = true;
      return;
    }
    if (!current.moved) {
      if (current.id) openRelief(current.id, current.from);
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

  dialog.addEventListener("cancel", (event) => {
    if (!motionOK || !dialog.open || dialog.classList.contains("is-leaving")) return;
    event.preventDefault();
    leaveFiche();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) leaveFiche();
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
    if (binderEl?.dataset.binder === "remove") {
      const slot = Number(binderEl.dataset.slot);
      const page = binderEl.dataset.page === undefined || binderEl.dataset.page === ""
        ? state.binder.page
        : Number(binderEl.dataset.page);
      leaveRelief(() => removeSlot(page, slot));
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
        state.universMarque = "";
        if (state.universKind !== "tous" && state.universKind !== "jeu") state.universConsole = "";
        state.universPage = 1;
        render();
      }
      if (universEl.dataset.univers === "marque") {
        state.universMarque = universEl.dataset.marque || "";
        state.universKind = "tous";
        state.universConsole = "";
        state.universPage = 1;
        render();
      }
    }

    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === "close") {
        const host = actionEl.closest("dialog");
        if (host?.id === "relief") leaveRelief();
        else leaveFiche();
      }
      if (action === "retry") {
        if (state.view === "search") runSearch(state.query);
        else loadSet(state.gallerySeriesId, state.setId);
      }
      if (action === "jeux-recherche") {
        state.universQuery = state.query;
        state.universKind = "jeu";
        state.universMarque = "";
        state.universConsole = "";
        state.universSort = "ancien";
        state.universPage = 1;
        rememberTab("univers");
        render();
      }
      if (action === "quote") quoteSet();
      if (action === "product") {
        const family = actionEl.dataset.family === "univers" ? "univers" : "sealed";
        const id = actionEl.dataset.id;
        const list = family === "univers" ? state.univers : state.sealed;
        const item = (list || []).find((row) => String(row.id) === id);
        if (item) openProduct(item, family);
        else if (family === "univers") loadUnivers().then(() => {
          const found = (state.univers || []).find((row) => String(row.id) === id);
          if (found) openProduct(found, "univers");
          else produitIntrouvable("Cette pièce n'est plus dans le catalogue.");
        });
        else loadSealed().then(() => {
          const found = (state.sealed || []).find((row) => String(row.id) === id);
          if (found) openProduct(found, "sealed");
          else produitIntrouvable("Ce coffret n'est plus dans le catalogue.");
        });
      }
      if (action === "autre-photo") autrePhoto(actionEl.dataset.id);
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
        const id = actionEl.dataset.id;
        const partir = (card) => {
          if (!card?.id) return;
          if (dialog.open) dialog.close();
          leaveRelief(() => rangerCard(card));
        };
        const card = cache.get(cacheKey(id, lang)) || carteConnue(id, lang);
        if (card?.name) partir(card);
        else getCard(id, lang).then(partir).catch(() => {});
      }
      if (action === "open-fiche") {
        const id = actionEl.dataset.id;
        const lang = actionEl.dataset.lang || state.market;
        leaveRelief(() => openFiche(id, { lang }));
      }
      if (action === "galerie-filtre") {
        state.galerieFiltre = actionEl.dataset.filtre || "toutes";
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
      }
      if (action === "coll-pose" || action === "coll-cherche" || action === "coll-honneur") {
        const id = String(actionEl.dataset.id || "");
        const lang = actionEl.dataset.lang || state.market;
        const family = actionEl.dataset.family || "";
        const mode = action === "coll-honneur" ? "honneur" : action === "coll-cherche" ? "cherche" : "pose";
        Promise.resolve(gesteCollection(mode, id, lang, family)).then(() => rafraichirApresGeste());
      }
      if (action === "coll-add") {
        const finish = (id, lang) => {
          const on = inCollection(id, lang);
          actionEl.textContent = on ? "Retirer de ma collection" : "Ajouter à ma collection";
          actionEl.disabled = false;
          if (state.tab === "collection" && !state.visit) render();
        };
        if (actionEl.dataset.family === "sealed" || actionEl.dataset.family === "univers") {
          const id = String(actionEl.dataset.id || "");
          const univers = actionEl.dataset.family === "univers";
          const appliquer = (item) => {
            if (inCollection(id)) removeFromCollection(id);
            else if (univers) addUnivers(item);
            else if (item) addBox(item);
            finish(id, "fr");
            if (collectionHasBox()) loadFx().then(() => paintCollectionPrices());
          };
          const list = univers ? state.univers : state.sealed;
          const item = (list || []).find((row) => String(row.id) === id);
          if (item || inCollection(id) || !univers) appliquer(item);
          else loadUnivers().then(() => appliquer((state.univers || []).find((row) => String(row.id) === id)));
        } else {
          const id = actionEl.dataset.id;
          const lang = actionEl.dataset.lang || state.market;
          const card = cache.get(cacheKey(id, lang));
          if (inCollection(id, lang)) removeFromCollection(id, lang);
          else if (card) addToCollection(card);
          finish(id, lang);
        }
      }
      if (action === "coll-remove") {
        removeFromCollection(actionEl.dataset.id, actionEl.dataset.lang || state.market);
        if (state.tab === "collection") render();
      }
      if (action === "coll-share") copyCollectionLink();
      if (action === "coll-mine") leaveVisit();
      if (action === "cote-sort") {
        state.coteSort = actionEl.dataset.sort === "asc" ? "asc" : "desc";
        state.cotePage = 1;
        render();
      }
      if (action === "cote-famille") {
        const famille = actionEl.dataset.famille;
        if (COTES_FAMILLES.some(([id]) => id === famille)) {
          state.coteFamille = famille;
          state.cotePage = 1;
          if (famille !== "cartes") {
            loadSealed();
            settleUsdFx("cotes");
          }
          const pret = famille === "cartes" ? state.hallCards.length > 0 || state.hallFailed : Array.isArray(state.sealed);
          if (pret && state.coteGen !== "toutes" && !coteEntries(famille, state.coteGen).length) state.coteGen = "toutes";
          render();
        }
      }
      if (action === "cote-gen") {
        const gen = actionEl.dataset.gen || "toutes";
        const connu = gen === "toutes" || gen === "autres" || COTES_GENS.some(([id]) => id === gen);
        if (connu) {
          state.coteGen = gen;
          state.cotePage = 1;
          render();
        }
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
        const pick = nextRandomCard();
        if (pick) openRelief(pick.id, null, langueCarte(pick), "random");
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

    if (openEl) openRelief(openEl.dataset.open, null, openEl.dataset.lang || state.market);
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
      const paint = () => {
        render();
        paintOpenProduct();
      };
      const code = activeCurrency();
      const cardsNeedFx = code !== "EUR" && typeof fxRates?.[code] !== "number";
      if (cardsNeedFx) {
        loadFx().then(paint);
        return;
      }
      if (code !== "USD" && usdDisplayMode() !== "converted") loadFx();
      paint();
      if (code !== "USD" && usdDisplayMode() !== "converted") {
        loadFx().then(() => {
          if (state.tab === "etb" || state.tab === "univers") repaintUsdTab();
          else paintOpenProduct();
          paintCollectionPrices();
        });
      }
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

  document.addEventListener("pointerdown", (event) => {
    const stage = event.target.closest?.("#relief [data-tilt]");
    if (!stage || !motionOK || reliefLeaving) return;
    event.preventDefault();
    foilTilt.stage = stage;
    foilTilt.finger = true;
    foilTilt.pointer = event.pointerId;
    stage.setPointerCapture?.(event.pointerId);
    aimFoil(stage, event.clientX, event.clientY);
  });

  document.addEventListener("pointermove", (event) => {
    if (foilTilt.finger && event.pointerId === foilTilt.pointer && foilTilt.stage) {
      aimFoil(foilTilt.stage, event.clientX, event.clientY);
      return;
    }
    if (!motionOK) return;
    const stage = event.target.closest?.("[data-tilt]");
    if (!stage || stage.closest("#relief")) return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    stage.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    stage.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    stage.style.setProperty("--mx", `${x * 100}%`);
    stage.style.setProperty("--my", `${y * 100}%`);
  });

  document.addEventListener("pointerup", (event) => {
    if (!foilTilt.finger || event.pointerId !== foilTilt.pointer) return;
    releaseFoil();
  });

  document.addEventListener("pointercancel", (event) => {
    if (!foilTilt.finger || event.pointerId !== foilTilt.pointer) return;
    releaseFoil();
  });

  document.addEventListener("pointerout", (event) => {
    const stage = event.target.closest?.("[data-tilt]");
    if (!stage || stage.closest("#relief") || stage.contains(event.relatedTarget)) return;
    stage.style.removeProperty("--rx");
    stage.style.removeProperty("--ry");
    stage.style.removeProperty("--mx");
    stage.style.removeProperty("--my");
  });

  document.addEventListener("load", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    img.classList.remove("is-trying", "is-broken");
    marquerScan(img);
  }, true);

  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const boite = img.closest(".art.is-box, .stage.is-box, .rank-art.is-box");
    const src = img.getAttribute("src") || "";
    if (boite && img.dataset.relance !== "1" && src && !src.startsWith("data:")) {
      img.dataset.relance = "1";
      img.dataset.probing = "";
      img.classList.remove("is-trying", "is-broken");
      img.removeAttribute("src");
      requestAnimationFrame(() => {
        if (img.isConnected) img.setAttribute("src", src);
      });
      return;
    }
    if (img.classList.contains("shot")) {
      if (img.naturalWidth > 0) img.classList.remove("is-trying", "is-broken");
      else markBroken(img);
      return;
    }
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
  if (hash === "favoris") return "classeur";
  if (hash === "musee") return "galerie";
  if (!hash) return "collection";
  return TABS.includes(hash) ? hash : "collection";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => registration.update()).catch(() => {});
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
  state.searchGames = [];
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
  const wanted = lang;
  loadFx().then(() => {
    if (state.market !== wanted) return;
    if (state.currency !== "EUR" || state.tab === "etb" || state.tab === "univers") {
      render();
      paintOpenProduct();
    } else {
      paintOpenProduct();
    }
  });
  openDefaultSet();
}

const JOURNAL_KEY = "aureum.journal";

// Ajouter les phrases à la fin de la liste, sans réécrire les anciennes.
// Qui a déjà lu ne revoit que la suite. Qui n'a pas lu voit les anciennes plus les nouvelles.
function entreesJournal() {
  return [...document.querySelectorAll("#journal .journal-list li")].flatMap((item) => {
    const texte = item.textContent.replace(/\s+/g, " ").trim();
    return texte ? [{ item, texte }] : [];
  });
}

function empreinteJournal(texte) {
  let hash = 2166136261;
  for (let i = 0; i < texte.length; i += 1) {
    hash ^= texte.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function marqueJournal() {
  const email = emailSession();
  if (!email) return "";
  try {
    const brut = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "{}");
    return String(brut?.[email] || "");
  } catch {
    return "";
  }
}

function indiceDejaLu(lignes, marque) {
  if (!marque) return 0;
  for (let i = lignes.length; i >= 0; i -= 1) {
    if (empreinteJournal(lignes.slice(0, i).join("\n")) === marque) return i;
  }
  return 0;
}

function preparerJournal() {
  const entrees = entreesJournal();
  if (!entrees.length || !emailSession()) return false;
  const deja = indiceDejaLu(entrees.map((entree) => entree.texte), marqueJournal());
  entrees.forEach((entree, index) => {
    entree.item.hidden = index < deja;
  });
  return deja < entrees.length;
}

function marquerJournal() {
  const lignes = entreesJournal().map((entree) => entree.texte);
  const email = emailSession();
  if (!lignes.length || !email) return;
  let brut = {};
  try {
    const lu = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "{}");
    if (lu && typeof lu === "object") brut = lu;
  } catch {
    brut = {};
  }
  brut[email] = empreinteJournal(lignes.join("\n"));
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(brut));
  } catch {
    /* On ferme quand même pour cette visite. */
  }
}

function fermerJournal() {
  marquerJournal();
  const dialog = document.getElementById("journal");
  if (dialog?.open) dialog.close();
}

function ouvrirJournal() {
  if (!preparerJournal()) return;
  const dialog = document.getElementById("journal");
  const bouton = document.getElementById("journal-lu");
  if (!dialog || dialog.open) return;
  bouton?.addEventListener("click", fermerJournal, { once: true });
  dialog.addEventListener("cancel", (event) => event.preventDefault());
  dialog.addEventListener("close", () => unlockSheet());
  lockSheet();
  dialog.showModal();
  bouton?.focus();
}

function boot() {
  migrerFavoris();
  ouvrirJournal();
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) ouvrirJournal();
  });
  const email = emailSession();
  const mail = document.getElementById("compte-email");
  if (mail && email) mail.textContent = email;
  document.getElementById("quitter")?.addEventListener("click", () => {
    quitter();
    location.reload();
  });
  bind();
  bindSignal();
  window.addEventListener("hashchange", () => {
    const hash = location.hash.replace("#", "");
    if (hash === "favoris") {
      if (state.tab !== "classeur") setTab("classeur");
      else rememberTab("classeur");
      return;
    }
    if (hash === "musee") {
      if (!MUSEE.includes(state.tab)) setTab("musee");
      return;
    }
    if (TABS.includes(hash) && hash !== state.tab) setTab(hash);
  });
  chargerCapture().catch(() => {});
  registerServiceWorker();
  const fxReady = activeCurrency() !== "USD" || state.currency !== "EUR" ? loadFx() : Promise.resolve(null);
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
  const visuelsReady = loadVisuels();
  Promise.all([openVisit, visuelsReady]).then(() => {
    const tab = state.visit ? "collection" : initialTab();
    rememberTab(tab);
    render();
    if ((state.tab === "etb" || state.tab === "univers") && activeCurrency() !== "USD") loadFx();
    if (state.tab === "etb") loadSealed();
    if (state.tab === "univers") loadUnivers();
    updateFavCount();
    if (state.tab === "collection") {
      hydrateVisit();
      refreshCollection();
      if (collectionHasBox()) loadFx().then(() => paintCollectionPrices());
    }
    if (state.tab === "cotes") {
      loadHall();
      loadSealed();
    }
    fxReady.then(() => {
      if (state.tab === "etb" || state.tab === "univers" || state.tab === "cotes") repaintUsdTab();
      else if (activeCurrency() !== "EUR" && (state.tab === "galerie" || state.tab === "cotes")) render();
      paintOpenProduct();
      paintCollectionPrices();
    });
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
