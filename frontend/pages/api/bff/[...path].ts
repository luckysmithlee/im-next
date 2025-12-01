import type { NextApiRequest, NextApiResponse } from 'next'

function getBackendBase() {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    let v = raw.trim()
    if (v.startsWith(':')) v = `http://localhost${v}`
    else if (!/^https?:\/\//.test(v)) v = `http://${v}`
    return v.replace(/\/$/, '')
  }
  return 'http://localhost:4000'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backend = getBackendBase()
  const parts = Array.isArray(req.query.path) ? (req.query.path as string[]) : [String(req.query.path || '')]
  const pathname = parts.filter(Boolean).join('/')
  const url = new URL(`${backend}/${pathname}`)
  Object.keys(req.query || {}).forEach((k) => {
    if (k === 'path') return
    const v = (req.query as any)[k]
    if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)))
    else if (v !== undefined) url.searchParams.set(k, String(v))
  })

  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers[k] = v
  }
  // Ensure content-type for JSON bodies
  if (req.method && req.method !== 'GET' && !headers['content-type']) headers['content-type'] = 'application/json'

  const init: RequestInit = {
    method: req.method,
    headers,
  }
  if (req.method && req.method !== 'GET' && req.body !== undefined) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  }

  try {
    const resp = await fetch(url.toString(), init)
    const contentType = resp.headers.get('content-type') || ''
    res.status(resp.status)
    if (contentType.includes('application/json')) {
      const data = await resp.json()
      res.json(data)
    } else {
      const text = await resp.text()
      res.send(text)
    }
  } catch (e: any) {
    res.status(502).json({ error: 'bff_proxy_error', message: e?.message || String(e) })
  }
}
