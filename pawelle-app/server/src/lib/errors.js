// One friendly error shape for every failure:
// { error: { code, message, fields? } }
export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that."))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    })
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'TOO_LARGE', message: 'That file is too big. Try a smaller photo.' },
    })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: "Pawelle couldn't read that. Please try again." },
    })
  }
  console.error(err)
  res.status(500).json({
    error: { code: 'SERVER', message: 'Something went wrong on our side. Please try again.' },
  })
}
