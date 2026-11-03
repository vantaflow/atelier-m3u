# Atelier M3U

Éditeur de playlists IPTV en ligne : chaînes en direct, films et séries. Tout se passe dans le navigateur ; la playlist est enregistrée automatiquement en local.

**En ligne :** https://atelier-m3u.pages.dev

## Fonctions

- **Import** : fichiers .m3u / .m3u8 / .txt / .json (et .gz), texte collé, adresse web, compte **Xtream Codes** par l’API (`player_api.php`) : direct, films avec affiche, année et note, séries épisode par épisode.
- **Édition** : liste virtualisée (des dizaines de milliers d’entrées), vue en affiches pour la VOD, onglets Direct / Films / Séries / Radio, inspecteur complet des attributs EXTINF (`tvg-*`, `group-title`, `catchup*`, attributs libres, lignes `#EXTVLCOPT` / `#KODIPROP`), glisser-déposer, sélection multiple, annuler / rétablir.
- **Outils** : rechercher et remplacer (regex), nettoyage des noms, doublons, tri naturel, numérotation `tvg-chno`, regroupement automatique (préfixe, type, série, règles), association EPG depuis un XMLTV, changement de serveur ou d’identifiants Xtream, statistiques.
- **Export** : M3U, M3U8, JSON, CSV, liste d’URL ; un fichier unique, par type (Direct / Films / Séries) ou par groupe en .zip.

## Relais

`functions/api/fetch.js` est une Pages Function qui récupère une playlist, une réponse d’API Xtream ou un guide quand le serveur bloque la lecture directe depuis le navigateur (CORS, http sur page https). Il refuse les flux audio / vidéo, les réseaux privés, les appels venant d’un autre site, et limite la taille à 100 Mo. Rien n’est conservé.

## Développement

```bash
npm run build          # src/app.html -> public/index.html
npm run dev            # serveur local avec le relais (wrangler pages dev)
node tests/e2e.mjs <chemin/vers/playwright-core>   # test de bout en bout, Chrome sans fenêtre
npm run deploy         # déploiement manuel sur Cloudflare Pages
```

Chaque push sur `main` déploie automatiquement (secret `CLOUDFLARE_API_TOKEN` requis dans le dépôt).
