import { readFile, writeFile } from "node:fs/promises";

const TOPIC = "aureum-signalements-k7m3p9";
const DOSSIER = new URL("../signalements/", import.meta.url);
const ID = /^\d{8}-\d{4}-[a-z0-9]{4}$/;

function nettoyer(valeur, max) {
  return String(valeur || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

function decoderMessage(message) {
  try {
    const brut = String(message || "");
    const json = brut.startsWith("b64:")
      ? Buffer.from(brut.slice(4), "base64").toString("utf8")
      : brut;
    const corps = JSON.parse(json);
    return corps && typeof corps === "object" ? corps : null;
  } catch {
    return null;
  }
}

async function lireJournal() {
  try {
    const data = JSON.parse(await readFile(new URL("journal.json", DOSSIER), "utf8"));
    return Array.isArray(data?.reports) ? data : { reports: [] };
  } catch {
    return { reports: [] };
  }
}

async function main() {
  const reponse = await fetch(`https://ntfy.sh/${TOPIC}/json?poll=1&since=48h`);
  if (!reponse.ok) {
    console.error(`Canal injoignable (${reponse.status}).`);
    process.exitCode = 1;
    return;
  }
  const journal = await lireJournal();
  const connus = new Set(journal.reports.map((report) => report.id));
  let ajoutes = 0;

  for (const ligne of (await reponse.text()).split("\n")) {
    if (!ligne.trim()) continue;
    let evenement;
    try {
      evenement = JSON.parse(ligne);
    } catch {
      continue;
    }
    if (evenement?.event !== "message") continue;
    const corps = decoderMessage(evenement.message);
    if (corps?.cabinet !== "aureum") continue;
    const id = String(corps.id || "");
    const text = nettoyer(corps.text, 800);
    if (!ID.test(id) || !text || connus.has(id)) continue;

    let image = "";
    const file = evenement.attachment?.url;
    if (typeof file === "string" && file.startsWith("https://ntfy.sh/file/")) {
      try {
        const photo = await fetch(file);
        const octets = Buffer.from(await photo.arrayBuffer());
        const jpeg = photo.ok && octets.length > 100 && octets.length < 2_500_000 && octets[0] === 0xff && octets[1] === 0xd8;
        if (jpeg) {
          await writeFile(new URL(`${id}.jpg`, DOSSIER), octets);
          image = `${id}.jpg`;
        }
      } catch {
        image = "";
      }
    }

    const when = nettoyer(corps.when, 80);
    const where = nettoyer(corps.where, 240);
    const url = nettoyer(corps.url, 300);
    const qui = nettoyer(corps.qui, 80);
    const errors = Array.isArray(corps.errors)
      ? corps.errors.map((ligneErreur) => nettoyer(ligneErreur, 240)).filter(Boolean).slice(0, 6)
      : [];
    const md = [
      `# Signalement ${id}`,
      "",
      `- Quand : ${when}`,
      `- Où : ${where}`,
      `- Adresse : ${url}`,
      `- Compte : ${qui || "inconnu"}`,
      image ? `- Photo : ${image}` : "- Photo : aucune",
      "",
      text,
      "",
      "Erreurs :",
      errors.length ? errors.map((ligneErreur) => `- ${ligneErreur}`).join("\n") : "- Aucune.",
      "",
    ].join("\n");
    await writeFile(new URL(`${id}.md`, DOSSIER), md, "utf8");
    journal.reports.push({ id, when, where, url, qui, text, errors, image });
    connus.add(id);
    ajoutes += 1;
  }

  if (!ajoutes) {
    console.log("Rien de neuf.");
    return;
  }
  journal.reports.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  journal.reports = journal.reports.slice(0, 40);
  await writeFile(new URL("journal.json", DOSSIER), `${JSON.stringify({ reports: journal.reports }, null, 2)}\n`, "utf8");
  console.log(`${ajoutes} signalement(s) enregistré(s).`);
}

await main();
