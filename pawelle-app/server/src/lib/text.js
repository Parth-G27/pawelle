// Free text that is shown back or given to the model is flattened to one plain line:
// no control characters (so no newline tricks in a prompt), no angle brackets, capped length.
export const oneLine = (text, max = 60) =>
  String(text ?? '')
    .replace(/[\p{Cc}<>]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

export const hasLink = (text) => /(https?:\/\/|www\.)/i.test(String(text ?? ''))
