/*
 * Cloudflare Worker die bijbeltekst ophaalt van herzienestatenvertaling.nl en
 * teruggeeft mét CORS-headers, zodat de gehoste app (GitHub Pages) hem kan
 * gebruiken. Deployen kan via het Cloudflare-dashboard, zie README.md.
 *
 *   GET /teksten/<boek>/<hoofdstuk>   ->  HTML van dat hoofdstuk
 *
 * Alles wat geen hoofdstuk-URL is, wordt geweigerd. De worker geeft dus alleen
 * bijbeltekst door en niets anders van de HSV-site.
 */

const HSV_ORIGIN = 'https://herzienestatenvertaling.nl'

// Websites die de proxy mogen gebruiken. Een lege lijst betekent: iedereen mag.
const ALLOWED_ORIGINS = ['https://michaelshaker.github.io']

// Laat ook pagina's op localhost toe, zodat een lokale productie-build
// (npm run build && npm run preview) blijft werken. Dit is geen gat: de browser
// bepaalt zelf de Origin-waarde, dus een andere website kan zich niet als
// localhost voordoen.
const ALLOW_LOCALHOST = true

// Bijbeltekst verandert niet, dus een week cachen is prima. (De Cloudflare-cache
// werkt alleen op een eigen domein; op *.workers.dev wordt elk verzoek gewoon
// doorgestuurd, wat voor deze app geen probleem is.)
const CACHE_SECONDS = 7 * 24 * 60 * 60

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin)

    if (cors === null) {
      return errorResponse('Deze website mag de proxy niet gebruiken.', 403, {})
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (request.method !== 'GET') {
      return errorResponse('Alleen GET-verzoeken zijn toegestaan.', 405, cors)
    }

    const { pathname } = new URL(request.url)
    const match = pathname.match(/^\/teksten\/([^/]+)\/(\d{1,3})$/)

    if (!match) {
      return errorResponse('Gebruik: /teksten/<boek>/<hoofdstuk>', 404, cors)
    }

    let slug

    try {
      slug = decodeURIComponent(match[1])
    } catch {
      return errorResponse('Ongeldige boeknaam.', 400, cors)
    }

    if (!/^[\p{L}\d ]{2,40}$/u.test(slug)) {
      return errorResponse('Ongeldige boeknaam.', 400, cors)
    }

    const target = `${HSV_ORIGIN}/teksten/${encodeURIComponent(slug)}/${Number(match[2])}`
    const cache = caches.default
    let response = await cache.match(target)

    if (!response) {
      const upstream = await fetch(target, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'FormatBible-proxy/1.0',
          Accept: 'text/html',
        },
      })

      // Voor een onbekend hoofdstuk stuurt de HSV-site een redirect naar de
      // homepage; dat vertalen we naar een nette 404.
      if (upstream.status !== 200) {
        return errorResponse('Hoofdstuk niet gevonden.', 404, cors)
      }

      response = new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        },
      })

      ctx.waitUntil(cache.put(target, response.clone()))
    }

    const result = new Response(response.body, response)

    for (const [name, value] of Object.entries(cors)) {
      result.headers.set(name, value)
    }

    return result
  },
}

// Geeft de CORS-headers voor deze Origin terug, of null als de website
// geweigerd moet worden.
function corsHeaders(origin) {
  if (ALLOWED_ORIGINS.length === 0) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    }
  }

  // Verzoeken zonder Origin-header komen niet van een website (curl, of de URL
  // in de adresbalk). CORS speelt daar geen rol, dus die laten we door.
  if (!origin) return {}

  if (!isAllowedOrigin(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (!ALLOW_LOCALHOST) return false

  try {
    const { protocol, hostname } = new URL(origin)
    return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')
  } catch {
    return false
  }
}

function errorResponse(message, status, cors) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      ...cors,
    },
  })
}
