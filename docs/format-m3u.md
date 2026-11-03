# Format M3U et Xtream Codes

## Ce que l’atelier lit

```
#EXTM3U url-tvg="https://exemple.net/epg.xml.gz" x-tvg-url="https://exemple.net/epg.xml.gz"
#EXTINF:-1 tvg-id="info24.fr" tvg-name="Info 24" tvg-logo="https://…/info24.png" tvg-chno="1" group-title="FR | Information" catchup="default" catchup-days="7",FR: Info 24 HD
#EXTVLCOPT:http-user-agent=Mozilla/5.0
http://serveur.exemple:8080/utilisateur/motdepasse/1001.ts
```

| Élément | Traitement |
|---|---|
| `#EXTM3U` | Ses attributs forment l’en-tête de la playlist. Plusieurs fichiers importés à la suite fusionnent leurs en-têtes. |
| `#EXTINF:<durée> <attributs>,<titre>` | La durée est gardée telle quelle. Le titre commence à la **première virgule hors guillemets** : `tvg-name="A, B"` ne coupe pas le titre. Sans titre, `tvg-name` puis le nom de fichier de l’URL servent de nom. |
| Attributs | `clé="valeur"`, `clé='valeur'` ou `clé=valeur`. Les clés `tvg-*`, `group-*` et `catchup*` sont mises en minuscules, les autres gardent leur casse. |
| `#EXTGRP:<groupe>` | Devient `group-title` si l’entrée n’en a pas. |
| Autres lignes `#…` (`#EXTVLCOPT`, `#KODIPROP`, `#EXTHTTP`…) | Rattachées à l’entrée en cours et réécrites telles quelles. Celles placées avant `#EXTINF` sont rattachées à l’entrée suivante. |
| URL | Toute ligne non vide sans `#` termine l’entrée. Une URL sans `#EXTINF` devient une entrée nommée d’après l’URL. |
| BOM, fins de ligne Windows | Acceptés. |
| JSON | Un fichier qui commence par `[` ou `{` est lu comme un export JSON de l’atelier. |

## Ce que l’atelier écrit

- Une ligne `#EXTM3U` avec les attributs d’en-tête (option).
- Pour chaque entrée : `#EXTINF:<durée> <attributs>,<nom>`, puis `#EXTGRP` (option), les lignes d’options (option), puis l’URL.
- Les attributs vides sont omis. Ils sont écrits dans un ordre stable : `tvg-id`, `tvg-name`, `tvg-logo`, `tvg-chno`, `tvg-shift`, `group-title`, `catchup`, `catchup-days`, `catchup-source`, `timeshift`, puis les autres dans leur ordre d’origine.
- Un guillemet `"` dans une valeur est remplacé par `'`, la syntaxe M3U ne permettant pas de l’échapper.
- Les entrées désactivées et les groupes exclus ne sont pas écrits, sauf si l’export porte sur « Toutes ».

## Type de contenu

Déduit à chaque affichage, dans cet ordre :

| Type | Règle |
|---|---|
| Série | URL contenant `/series/`, ou nom contenant `S01E02` / `S01 E02`. |
| Film | URL contenant `/movie/`, ou extension `.mp4`, `.mkv`, `.avi`, `.mov`, `.wmv`, `.flv`. |
| Radio | Extension `.mp3`, `.aac`, `.ogg`, `.opus`, `.flac`, `.m4a`, ou groupe contenant « radio ». |
| Direct | Tout le reste. |

## Correspondance avec l’API Xtream Codes

Base : `<serveur>/player_api.php?username=<u>&password=<p>`. Un appel sans `action` vérifie le compte (`user_info.auth`, `user_info.status`).

| Action | Entrées produites |
|---|---|
| `get_live_categories` + `get_live_streams` | URL `<serveur>/live/<u>/<p>/<stream_id>.<ts\|m3u8>` ; `tvg-id` = `epg_channel_id`, `tvg-logo` = `stream_icon`, `group-title` = nom de catégorie. Si `tv_archive = 1` : `catchup="xc"` et `catchup-days` = `tv_archive_duration`. |
| `get_vod_categories` + `get_vod_streams` | URL `<serveur>/movie/<u>/<p>/<stream_id>.<container_extension>` ; affiche = `stream_icon` ; groupe `Films \| <catégorie>` (préfixe en option) ; année et note dans `meta`. |
| `get_series_categories` + `get_series` + `get_series_info&series_id=…` | Une entrée par épisode : URL `<serveur>/series/<u>/<p>/<episode.id>.<container_extension>`, nom `<Série> S01 E02`, affiche de l’épisode ou de la série, groupe par catégorie ou par série (`Séries \| …`). |

Le guide EPG du compte est `<serveur>/xmltv.php?username=<u>&password=<p>` ; il est écrit dans l’en-tête lors d’un import qui remplace la playlist.

L’adresse M3U équivalente, proposée en copie ou en chargement direct, est `<serveur>/get.php?username=<u>&password=<p>&type=m3u_plus&output=<ts|m3u8>`.

## URL Xtream reconnues par les outils

L’outil « Xtream Codes » repère les URL de la forme :

```
<serveur>/[live|movie|series|timeshift/]<identifiant>/<mot de passe>/<numéro>[.<extension>][?…]
```

Il les regroupe par compte (serveur, identifiant, mot de passe) pour changer l’un ou l’autre sur toutes les entrées concernées, ainsi que dans l’adresse du guide.
