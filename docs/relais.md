# Relais `/api/fetch`

`functions/api/fetch.js` est une Cloudflare Pages Function. Elle récupère, pour le compte de l’atelier, un document que le navigateur ne peut pas lire lui-même :

- le serveur n’autorise pas la lecture depuis un autre site (pas d’en-tête CORS), ce qui est le cas de la plupart des serveurs IPTV ;
- le serveur est en `http` alors que l’atelier est en `https` (contenu mixte bloqué).

L’atelier essaie toujours la lecture directe d’abord et ne passe par le relais qu’en cas d’échec.

## Requête

```
GET /api/fetch?url=<adresse encodée>
x-atelier: 1
```

La réponse renvoie le corps du document distant avec son `content-type`, sans le modifier (un guide `.xml.gz` arrive compressé ; l’atelier le décompresse).

## Protections

| Règle | Raison |
|---|---|
| `GET` uniquement | Rien d’autre n’est nécessaire. |
| En-tête `x-atelier: 1` obligatoire, et `Sec-Fetch-Site` à `same-origin` quand il est présent | Un autre site ne peut pas envoyer cet en-tête sans requête préalable CORS, que le relais n’accepte pas : il ne sert pas de proxy ouvert aux autres pages web. |
| Adresses `http` et `https` seulement | Pas d’autres protocoles. |
| Réseaux privés refusés (`localhost`, `10.*`, `127.*`, `169.254.*`, `172.16-31.*`, `192.168.*`, `100.64/10`, IPv6 locales, `.local`, `.lan`…) | Empêche d’atteindre des machines internes. |
| Flux refusés : extensions `.ts`, `.mkv`, `.mp4`, `.mp3`… et types `video/*`, `audio/*`, `image/*`, `mp2t` | Le relais transporte des listes, pas de la vidéo. Les types `audio/x-mpegurl` et `application/vnd.apple.mpegurl` sont acceptés, car ce sont des playlists. |
| 100 Mo au plus, contrôlés à l’annonce (`content-length`) et pendant la transmission | Limite le coût et l’usage abusif. |
| Réponse en `cache-control: no-store`, `x-content-type-options: nosniff`, `content-security-policy: default-src 'none'; sandbox` | Le contenu relayé ne peut pas s’exécuter comme une page. |
| Aucune journalisation ni conservation | Les adresses contiennent souvent des identifiants Xtream. |

Les ports non standard des serveurs Xtream (8080, 25461…) fonctionnent.

## Erreurs

Toujours en JSON : `{"error": "…"}`. L’atelier affiche ce message tel quel.

| Code | Cas |
|---|---|
| 400 | Adresse invalide, protocole refusé, réseau privé. |
| 403 | Appel venant d’ailleurs que l’atelier. |
| 405 | Méthode autre que `GET`. |
| 413 | Document de plus de 100 Mo. |
| 415 | Flux audio, vidéo ou image. |
| 502 | Serveur distant injoignable, ou réponse en erreur (le code d’origine est cité). |

## Tester à la main

```bash
curl -H 'x-atelier: 1' 'https://atelier-m3u.pages.dev/api/fetch?url=https://iptv-org.github.io/iptv/index.m3u' | head
```
