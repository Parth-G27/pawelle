// Thin fetch wrapper. Every failure becomes an ApiFailure with a friendly message.
export class ApiFailure extends Error {
  constructor({ message, code, fields, status, network = false }) {
    super(message)
    this.code = code
    this.fields = fields
    this.status = status
    this.network = network
  }
}

const UNREACHABLE = "Pawelle can't reach its helper. Make sure it's running, then try again."

async function request(path, { method = 'GET', json, body, headers } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: json ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json ? JSON.stringify(json) : body,
    })
  } catch {
    throw new ApiFailure({ network: true, code: 'NETWORK', message: UNREACHABLE })
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // A proxy error with no JSON body means the server isn't running.
    if (!data && res.status >= 500) {
      throw new ApiFailure({ network: true, code: 'NETWORK', status: res.status, message: UNREACHABLE })
    }
    throw new ApiFailure({
      status: res.status,
      code: data?.error?.code,
      fields: data?.error?.fields,
      message: data?.error?.message ?? 'Something went wrong. Please try again.',
    })
  }
  return data
}

export const listPets = () => request('/pets')
export const createPet = (payload) => request('/pets', { method: 'POST', json: payload })
export const updatePet = (id, payload) => request(`/pets/${id}`, { method: 'PUT', json: payload })
export const deletePet = (id) => request(`/pets/${id}`, { method: 'DELETE' })
export const putPhoto = (id, slot, blob) =>
  request(`/pets/${id}/photos/${slot}`, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': blob.type || 'application/octet-stream' },
  })
export const deletePhoto = (id, slot) => request(`/pets/${id}/photos/${slot}`, { method: 'DELETE' })
export const saveCheckin = (petId, date, payload) =>
  request(`/pets/${petId}/checkins/${date}`, { method: 'PUT', json: payload })
export const listCheckins = (petId, days = 14) => request(`/pets/${petId}/checkins?days=${days}`)
export const photoUrl = (id, slot, version) => `/api/pets/${id}/photos/${slot}?v=${version}`
