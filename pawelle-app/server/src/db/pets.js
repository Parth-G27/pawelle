// A cat as the services need it: JSON lists parsed. null = not answered, [] = none.
export function getPet(db, id) {
  const r = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(id))
  if (!r) return null
  return {
    ...r,
    allergies: r.allergies == null ? null : JSON.parse(r.allergies),
    conditions: r.conditions == null ? null : JSON.parse(r.conditions),
  }
}
