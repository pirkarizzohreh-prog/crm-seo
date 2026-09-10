/** DRF returns field errors as {field: ["msg", ...]} and permission/lookup
 * errors as {detail: "msg"} — flatten either shape into one readable line
 * so a failed save is never silently swallowed by the UI. */
export function getErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } } | undefined)?.response?.data
  if (!data) return 'خطایی رخ داد. اتصال اینترنت یا سرور را بررسی کنید.'
  if (typeof data === 'string') return data
  const obj = data as Record<string, unknown>
  if (obj.detail) return String(obj.detail)
  const lines = Object.entries(obj).map(([field, messages]) => {
    const text = Array.isArray(messages) ? messages.join('، ') : String(messages)
    return field === 'non_field_errors' ? text : `${field}: ${text}`
  })
  return lines.join(' — ') || 'خطایی رخ داد.'
}
