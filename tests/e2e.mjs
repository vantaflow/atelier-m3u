// Test de bout en bout : sert public/, simule un serveur Xtream (CORS ouvert) et pilote Chrome sans fenêtre.
// Usage : node tests/e2e.mjs [chemin-vers-playwright-core]
import http from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright-core");

const html = readFileSync(new URL("../public/index.html", import.meta.url));
const site = http.createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(html); }).listen(4801);
const J = (r, o) => { r.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" }); r.end(JSON.stringify(o)); };
const xt = http.createServer((q, r) => {
  const u = new URL(q.url, "http://x"), a = u.searchParams.get("action");
  if (u.searchParams.get("password") !== "secret") return J(r, { user_info: { auth: 0 } });
  if (!a) return J(r, { user_info: { auth: 1, status: "Active" } });
  if (a === "get_live_categories") return J(r, [{ category_id: "1", category_name: "FR | Info" }]);
  if (a === "get_live_streams") return J(r, [{ stream_id: 11, name: "Info 24", epg_channel_id: "info24.fr", stream_icon: "", category_id: "1", tv_archive: 1, tv_archive_duration: 3 }]);
  if (a === "get_vod_categories") return J(r, [{ category_id: "5", category_name: "Action" }]);
  if (a === "get_vod_streams") return J(r, [{ stream_id: 501, name: "Le Convoi (2023)", stream_icon: "", category_id: "5", container_extension: "mkv", rating: "7.4", year: "2023" }, { stream_id: 502, name: "Minuit", category_id: "5", container_extension: "mp4" }]);
  if (a === "get_series_categories") return J(r, [{ category_id: "9", category_name: "Policier" }]);
  if (a === "get_series") return J(r, [{ series_id: 70, name: "Brigade Nord", cover: "", category_id: "9", rating: "8" }]);
  if (a === "get_series_info") return J(r, { episodes: { 1: [{ id: 7001, episode_num: 1, title: "Pilote", container_extension: "mkv" }, { id: 7002, episode_num: 2, container_extension: "mkv" }], 2: [{ id: 7101, episode_num: 1, container_extension: "mp4" }] } });
  J(r, []);
}).listen(4802);

const errors = [];
const ok = (cond, msg) => { console.log((cond ? "OK   " : "ÉCHEC ") + msg); if (!cond) process.exitCode = 1; };
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.goto("http://localhost:4801/");
await page.waitForSelector(".row");
ok((await page.$$eval(".row", (r) => r.length)) > 10, "la playlist d’exemple s’affiche");
await page.click('#ttabs [data-t="film"]');
ok(await page.$(".rows.grid .card"), "l’onglet Films passe en vue affiches");
await page.click('#ttabs [data-t="serie"]');
ok((await page.$$eval(".card", (c) => c.length)) === 2, "l’onglet Séries montre les 2 épisodes d’exemple");
await page.click('#ttabs [data-t="all"]');
await page.click('#ttabs [data-vm="list"]');
// outils
for (const t of ["replace", "clean", "dups", "sort", "number", "regroup", "epg", "xtream", "props", "stats"]) {
  await page.click("#bTools"); await page.click(`[data-tool="${t}"]`);
  ok(await page.$(".ov .sheet"), "outil " + t + " s’ouvre"); await page.keyboard.press("Escape");
}
// nettoyage des noms sur tout
await page.click("#bTools"); await page.click('[data-tool="clean"]');
await page.click('.ov label:has(input[name=scope][value=all]) span'); await page.click("#cgo");
ok(await page.$eval("#rows", (r) => r.textContent.includes("Arena Sport 1") && !r.textContent.includes("FR: Arena")), "nettoyage des noms appliqué");
await page.click("#bUndo");
ok(await page.$eval("#rows", (r) => r.textContent.includes("FR: Arena")), "annulation fonctionne");
// sélection + inspecteur
await page.click(".row >> nth=0");
ok(await page.$("#f_name"), "l’inspecteur s’ouvre sur une chaîne");
await page.fill("#f_name", "Chaîne modifiée");
await page.waitForTimeout(250);
ok(await page.$eval("#rows", (r) => r.textContent.includes("Chaîne modifiée")), "modification du nom reflétée dans la liste");
// import Xtream API
await page.click("#bImport"); await page.click('#itabs [data-t="xtream"]');
await page.fill("#xh", "http://localhost:4802"); await page.fill("#xu", "demo"); await page.fill("#xp", "secret");
await page.click('label:has(input[name=imode][value=replace]) span');
await page.click("#xapi");
await page.waitForSelector(".ov", { state: "detached", timeout: 8000 });
const st = await page.evaluate(() => ({ n: S.chans.length, urls: S.chans.map((c) => c.url), groups: S.order, epg: S.header["url-tvg"], meta: S.chans.map((c) => c.meta || null) }));
ok(st.n === 6, `import Xtream : 6 entrées (1 direct, 2 films, 3 épisodes) — reçu ${st.n}`);
ok(st.urls.includes("http://localhost:4802/movie/demo/secret/501.mkv"), "URL de film correcte");
ok(st.urls.includes("http://localhost:4802/series/demo/secret/7101.mp4"), "URL d’épisode correcte");
ok(st.groups.includes("Films | Action") && st.groups.includes("Séries | Policier"), "groupes VOD préfixés");
ok(/xmltv\.php/.test(st.epg || ""), "guide EPG renseigné");
await page.click('#ttabs [data-t="serie"]');
ok(await page.$eval("#rows", (r) => r.textContent.includes("S01 E01 · Pilote")), "fiche épisode : saison, épisode et titre");
await page.click('#ttabs [data-t="film"]');
ok(await page.$eval("#rows", (r) => r.textContent.includes("★ 7.4")), "fiche film : note affichée");
// export
await page.click("#bExport");
const prev = await page.$eval("#xprev", (p) => p.textContent);
ok(prev.startsWith("#EXTM3U url-tvg=") && prev.includes('catchup="xc"'), "aperçu de l’export M3U");
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#xsave")]);
ok(/\.m3u$/.test(dl.suggestedFilename()), "téléchargement .m3u : " + dl.suggestedFilename());
await page.keyboard.press("Escape");
// mobile
await page.setViewportSize({ width: 390, height: 800 });
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
ok(sw <= 390, "pas de défilement horizontal sur mobile (" + sw + "px)");
await page.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + "/mobile.png" : "/dev/null" });
await page.setViewportSize({ width: 1440, height: 900 });
await page.click('#ttabs [data-t="all"]');
if (process.env.SHOT_DIR) await page.screenshot({ path: process.env.SHOT_DIR + "/desktop.png" });
await page.click('#ttabs [data-t="film"]');
if (process.env.SHOT_DIR) await page.screenshot({ path: process.env.SHOT_DIR + "/films.png" });
ok(errors.length === 0, "aucune erreur JavaScript" + (errors.length ? " : " + errors.join(" | ") : ""));
await browser.close(); site.close(); xt.close();
