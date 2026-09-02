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

// Laat leeg om elke website toe te staan. Vul in om de proxy alleen voor je
// eigen site te reserveren, bijvoorbeeld: ['https://michaelshaker.github.io']
const ALLOWED_ORIGINS = []

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

function corsHeaders(origin) {
  const allowAll = ALLOWED_ORIGINS.length === 0

  // Verzoeken zonder Origin-header (curl, direct in de adresbalk) mogen altijd;
  // CORS is alleen relevant voor browsers die vanaf een website laden.
  if (!allowAll && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return null
  }

  if (!allowAll && !origin) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': allowAll ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    ...(allowAll ? {} : { Vary: 'Origin' }),
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
