# Journal des versions

## 1.0.0 — 2026-11-03

Première version en ligne sur https://atelier-m3u.pages.dev.

### Ajouts
- Éditeur M3U complet : import (fichier, texte, adresse web, Xtream Codes), groupes, inspecteur des attributs EXTINF, sélection multiple, glisser-déposer, recherche et filtres, annuler / rétablir, enregistrement automatique.
- VOD : import par l’API Xtream des films (affiche, année, note) et des séries épisode par épisode, onglets Direct / Films / Séries / Radio, vue en affiches, regroupement par série, export découpé par type.
- Outils : rechercher et remplacer, nettoyage des noms, doublons, tri naturel, numérotation, regroupement automatique, association EPG XMLTV, changement de compte Xtream, propriétés de l’en-tête, statistiques.
- Export M3U, M3U8, JSON, CSV, liste d’URL, découpage en `.zip`.
- Relais Cloudflare `/api/fetch` pour les serveurs qui bloquent la lecture depuis le navigateur.
- Déploiement automatique sur Cloudflare Pages à chaque push sur `main`.

### Corrections
- Relais : les playlists servies en `audio/x-mpegurl` étaient refusées comme des flux audio.
- Fenêtre Xtream : libellés des cases à cocher éloignés de leur case, champs sans espacement.
- Inspecteur : libellés mal alignés sur les champs en trois colonnes.
