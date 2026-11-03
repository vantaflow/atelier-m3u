// Assemble public/index.html à partir de src/app.html (le corps de la page).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const body = readFileSync(new URL("../src/app.html", import.meta.url), "utf8");
const icon =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 22"><rect width="4" height="22" fill="#c0c0c0"/><rect x="4" width="4" height="22" fill="#c0c000"/><rect x="8" width="4" height="22" fill="#00c0c0"/><rect x="12" width="4" height="22" fill="#00c000"/><rect x="16" width="4" height="22" fill="#c000c0"/><rect x="20" width="4" height="22" fill="#c00000"/><rect x="24" width="4" height="22" fill="#0000c0"/></svg>'
  );
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Éditeur de playlists IPTV M3U en ligne : chaînes, films et séries, import Xtream Codes, nettoyage, doublons, guide EPG et export.">
<meta name="theme-color" content="#0e1318"><link rel="icon" href="${icon}">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${body}
</body></html>
`;
mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/index.html", import.meta.url), html);
console.log("public/index.html :", (html.length / 1024).toFixed(0), "Ko");
