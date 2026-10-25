const COMPTES_KEY = "aureum.comptes";
const SESSION_KEY = "aureum.session";
const MIGRE_KEY = "aureum.migre";
const DEV_HASH = "89e9e5ec5945e92d11915bc11bafad7ce19bef3ce822a4f1412cc771f90ec705";
const ITERATIONS = 80000;
const COMPTE_MAX = 3;

let comptes = { users: {} };
let session = "";

function maintenant() {
  return new Date().toISOString();
}

function instant(valeur) {
  const n = Date.parse(valeur);
  return Number.isFinite(n) ? n : 0;
}

function copie(valeur) {
  if (valeur == null) return valeur;
  return JSON.parse(JSON.stringify(valeur));
}

function emailPropre(valeur) {
  const email = String(valeur || "").trim().toLowerCase();
  if (email.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function hex(octets) {
  return [...octets].map((octet) => octet.toString(16).padStart(2, "0")).join("");
}

function depuisHex(valeur) {
  if (typeof valeur !== "string" || !/^[0-9a-f]+$/i.test(valeur) || valeur.length % 2) return null;
  const octets = new Uint8Array(valeur.length / 2);
  for (let i = 0; i < octets.length; i += 1) octets[i] = Number.parseInt(valeur.slice(i * 2, i * 2 + 2), 16);
  return octets;
}

function pareil(a, b) {
  const gauche = String(a || "");
  const droite = String(b || "");
  let diff = gauche.length ^ droite.length;
  const taille = Math.max(gauche.length, droite.length);
  for (let i = 0; i < taille; i += 1) diff |= gauche.charCodeAt(i) ^ droite.charCodeAt(i);
  return diff === 0;
}

async function empreinteDev(texte) {
  const tampon = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return hex(new Uint8Array(tampon));
}

async function deriver(mot, saltHex, iterations) {
  const salt = saltHex ? depuisHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  if (!salt) throw new Error("sel");
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(mot), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt,
    iterations: iterations || ITERATIONS,
    hash: "SHA-256",
  }, cle, 256);
  return { salt: hex(salt), hash: hex(new Uint8Array(bits)), iterations: iterations || ITERATIONS };
}

function lireDisque() {
  try {
    const brut = JSON.parse(localStorage.getItem(COMPTES_KEY) || "{\"users\":{}}");
    return brut && typeof brut.users === "object" && brut.users ? brut : { users: {} };
  } catch {
    return { users: {} };
  }
}

function ecrireDisque() {
  localStorage.setItem(COMPTES_KEY, JSON.stringify(comptes));
  if (session) localStorage.setItem(SESSION_KEY, session);
  else localStorage.removeItem(SESSION_KEY);
}

function compteValide(compte) {
  if (!compte || typeof compte !== "object") return false;
  if (!depuisHex(compte.salt) || !depuisHex(compte.hash)) return false;
  const tours = Number(compte.iterations) || ITERATIONS;
  return tours >= 10000 && tours <= 200000;
}

function fusionner(distant) {
  const users = { ...comptes.users };
  const remote = distant && typeof distant.users === "object" ? distant.users : {};
  Object.entries(remote).forEach(([email, src]) => {
    const propre = emailPropre(email);
    if (!propre || !compteValide(src)) return;
    const ici = users[propre];
    if (!ici) {
      users[propre] = src;
      return;
    }
    const pass = instant(src.passwordAt) > instant(ici.passwordAt) ? src : ici;
    const data = instant(src.updatedAt) > instant(ici.updatedAt) ? src : ici;
    users[propre] = {
      salt: pass.salt,
      hash: pass.hash,
      iterations: Number(pass.iterations) || ITERATIONS,
      passwordAt: pass.passwordAt || ici.passwordAt,
      updatedAt: data.updatedAt || ici.updatedAt,
      favoris: data.favoris ?? ici.favoris ?? [],
      classeur: data.classeur ?? ici.classeur ?? null,
      collection: data.collection ?? ici.collection ?? null,
    };
  });
  const gardes = Object.entries(users)
    .filter(([, compte]) => compteValide(compte))
    .sort((a, b) => instant(b[1].updatedAt) - instant(a[1].updatedAt))
    .slice(0, COMPTE_MAX);
  comptes = { users: Object.fromEntries(gardes) };
}

function orphelins() {
  if (localStorage.getItem(MIGRE_KEY) === "1") return null;
  const lire = (cle) => {
    try {
      return JSON.parse(localStorage.getItem(cle) || "null");
    } catch {
      return null;
    }
  };
  const favoris = lire("aureum.favoris");
  const classeur = lire("aureum.classeur");
  const collection = lire("aureum.collection");
  const aDesFavoris = Array.isArray(favoris) && favoris.length > 0;
  const aDesCartes = Array.isArray(classeur?.pages) && classeur.pages.some((page) => Array.isArray(page) && page.some(Boolean));
  const aUneCollection = Array.isArray(collection?.items) && collection.items.length > 0;
  if (!aDesFavoris && !aDesCartes && !aUneCollection) return null;
  return {
    favoris: aDesFavoris ? favoris : [],
    classeur: aDesCartes ? classeur : null,
    collection: aUneCollection ? collection : null,
  };
}

export function aDesOrphelins() {
  return Boolean(orphelins());
}

export async function preparer() {
  comptes = lireDisque();
  const sauvee = emailPropre(localStorage.getItem(SESSION_KEY) || "");
  session = sauvee && comptes.users[sauvee] ? sauvee : "";
  try {
    const reponse = await fetch(new URL("comptes.json?v=53", location.href));
    if (reponse.ok) fusionner(await reponse.json());
  } catch {
    /* L'appareil garde sa copie si le fichier n'est pas joignable. */
  }
  if (session && !comptes.users[session]) session = "";
  ecrireDisque();
}

export function sessionActive() {
  return session;
}

export function emailSession() {
  return session;
}

export function lireCabinet(cle) {
  const compte = comptes.users[session];
  if (!compte || !Object.hasOwn(compte, cle)) return null;
  return copie(compte[cle]);
}

export function ecrireCabinet(cle, valeur) {
  const compte = comptes.users[session];
  if (!compte) return false;
  compte[cle] = copie(valeur);
  compte.updatedAt = maintenant();
  try {
    ecrireDisque();
    return true;
  } catch {
    return false;
  }
}

async function poserMot(compte, mot) {
  const secret = await deriver(mot, "", ITERATIONS);
  compte.salt = secret.salt;
  compte.hash = secret.hash;
  compte.iterations = secret.iterations;
  compte.passwordAt = maintenant();
}

export async function creer(email, mot) {
  const propre = emailPropre(email);
  if (!propre) return { ok: false, code: "email" };
  if (String(mot || "").length < 6) return { ok: false, code: "court" };
  if (comptes.users[propre]) return { ok: false, code: "existe" };
  if (Object.keys(comptes.users).length >= COMPTE_MAX) return { ok: false, code: "plein" };
  const reprise = orphelins();
  const compte = {
    salt: "",
    hash: "",
    iterations: ITERATIONS,
    passwordAt: "",
    updatedAt: maintenant(),
    favoris: reprise?.favoris || [],
    classeur: reprise?.classeur || null,
    collection: reprise?.collection || null,
  };
  await poserMot(compte, mot);
  comptes.users[propre] = compte;
  session = propre;
  try {
    ecrireDisque();
  } catch {
    delete comptes.users[propre];
    session = "";
    return { ok: false, code: "stockage" };
  }
  localStorage.setItem(MIGRE_KEY, "1");
  return { ok: true };
}

export async function entrer(email, mot) {
  const propre = emailPropre(email);
  const compte = propre && comptes.users[propre];
  if (!compte) return { ok: false, code: "mauvais" };
  const secret = await deriver(mot, compte.salt, Number(compte.iterations) || ITERATIONS);
  if (!pareil(secret.hash, compte.hash)) return { ok: false, code: "mauvais" };
  session = propre;
  try {
    ecrireDisque();
  } catch {
    session = "";
    return { ok: false, code: "stockage" };
  }
  return { ok: true };
}

export async function motDevOk(motDev) {
  const empreinte = await empreinteDev(motDev);
  return pareil(empreinte, DEV_HASH);
}

export async function reinitialiser(motDev, email, mot) {
  const empreinte = await empreinteDev(motDev);
  if (!pareil(empreinte, DEV_HASH)) return { ok: false, code: "dev" };
  const propre = emailPropre(email);
  const compte = propre && comptes.users[propre];
  if (!compte) return { ok: false, code: "absent" };
  if (String(mot || "").length < 6) return { ok: false, code: "court" };
  const ancien = { salt: compte.salt, hash: compte.hash, iterations: compte.iterations, passwordAt: compte.passwordAt };
  await poserMot(compte, mot);
  try {
    ecrireDisque();
  } catch {
    compte.salt = ancien.salt;
    compte.hash = ancien.hash;
    compte.iterations = ancien.iterations;
    compte.passwordAt = ancien.passwordAt;
    return { ok: false, code: "stockage" };
  }
  return { ok: true, email: propre };
}

export function fichierComptes() {
  return JSON.stringify(comptes, null, 2);
}

export function quitter() {
  session = "";
  localStorage.removeItem(SESSION_KEY);
}
