// Relais de lecture pour l'Atelier M3U : récupère une playlist, une réponse d'API Xtream ou un guide XMLTV
// quand le serveur IPTV bloque la lecture directe depuis un navigateur (CORS, http sur une page https).
// Il ne transmet jamais de flux audio ou vidéo, ne conserve rien et n'est utilisable que depuis l'atelier lui-même.

const MAX_BYTES = 100 * 1024 * 1024;
const MEDIA_EXT = /\.(ts|m2ts|mkv|mp4|m4v|avi|mov|wmv|flv|webm|mp3|aac|m4a|flac|ogg|opus)$/i;
const MEDIA_TYPE = /^(video|audio|image)\/|mp2t/i;

const json = (status, error) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function isPrivateHost(host) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h || h === "localhost" || /\.(localhost|local|internal|lan|home)$/.test(h)) return true;
  if (/^(0|10|127)\./.test(h) || /^169\.254\./.test(h) || /^192\.168\./.test(h)) return true;
  const m = /^172\.(\d+)\./.exec(h);
  if (m && +m[1] >= 16 && +m[1] <= 31) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;
  if (h.includes(":") && (h === "::1" || /^(fc|fd|fe80)/.test(h))) return true;
  return false;
}

export async function onRequest({ request }) {
  if (request.method !== "GET") return json(405, "Méthode non autorisée");
  // En-tête propre à l'atelier : un autre site ne peut pas l'envoyer sans requête préalable CORS, que le relais n'accepte pas.
  if (request.headers.get("x-atelier") !== "1") return json(403, "Relais réservé à l’Atelier M3U");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return json(403, "Relais réservé à l’Atelier M3U");

  let target;
  try {
    target = new URL(new URL(request.url).searchParams.get("url") || "");
  } catch {
    return json(400, "adresse invalide");
  }
  if (!/^https?:$/.test(target.protocol)) return json(400, "seules les adresses http et https sont acceptées");
  if (isPrivateHost(target.hostname)) return json(400, "les adresses de réseau local sont refusées");
  if (MEDIA_EXT.test(target.pathname)) return json(415, "le relais ne transmet pas les flux vidéo ou audio");

  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; AtelierM3U/1.0)", accept: "*/*" },
    });
  } catch {
    return json(502, "le serveur distant ne répond pas");
  }
  const type = upstream.headers.get("content-type") || "";
  // Les playlists sont souvent servies en audio/x-mpegurl ou application/vnd.apple.mpegurl : ce sont des listes, pas des flux.
  if (MEDIA_TYPE.test(type) && !/mpegurl/i.test(type)) {
    upstream.body?.cancel();
    return json(415, "le relais ne transmet pas les flux vidéo ou audio");
  }
  if (!upstream.ok) {
    upstream.body?.cancel();
    return json(502, `le serveur distant a répondu ${upstream.status}`);
  }
  if (+(upstream.headers.get("content-length") || 0) > MAX_BYTES) {
    upstream.body?.cancel();
    return json(413, "fichier trop volumineux (100 Mo au maximum)");
  }

  let seen = 0;
  const limit = new TransformStream({
    transform(chunk, ctl) {
      seen += chunk.byteLength;
      if (seen > MAX_BYTES) ctl.error(new Error("fichier trop volumineux"));
      else ctl.enqueue(chunk);
    },
  });
  return new Response(upstream.body.pipeThrough(limit), {
    status: 200,
    headers: {
      "content-type": type || "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
