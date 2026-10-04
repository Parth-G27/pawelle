// Pawelle is a local app: only this computer should ever talk to it.
// These guards stop two classic attacks on "localhost" servers:
//  - cross-site requests: a web page you visit sending requests to 127.0.0.1;
//  - DNS rebinding: a hostile domain that points at 127.0.0.1 so the page can READ your data.
// The Host header is checked on every request, and so are Origin and Sec-Fetch-Site when sent.
// Exact patterns, no URL parsing tricks: the host must be this computer, with an optional port.
const HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/i
const ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/i

export const isLocalHost = (hostHeader) => HOST.test(hostHeader ?? '')

// Browsers send Origin on cross-site and state-changing requests. "null" (sandboxed pages) is refused.
export const isLocalOrigin = (origin) => ORIGIN.test(origin ?? '')

const refuse = (res) =>
  res.status(403).json({
    error: { code: 'LOCAL_ONLY', message: 'Pawelle only talks to this computer.' },
  })

export function localOnly() {
  return (req, res, next) => {
    if (!isLocalHost(req.headers.host)) return refuse(res)
    const origin = req.headers.origin
    if (origin !== undefined && !isLocalOrigin(origin)) return refuse(res)
    if (req.headers['sec-fetch-site'] === 'cross-site') return refuse(res)
    next()
  }
}

// Defaults for every API response. Individual routes may relax Cache-Control (photos use ETags).
export function securityHeaders() {
  return (_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store',
    })
    next()
  }
}
