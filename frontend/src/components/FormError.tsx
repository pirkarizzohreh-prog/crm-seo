import { AlertTriangle } from 'lucide-react'
import { getErrorMessage } from '../lib/errors'

/** Shown above a form's submit button whenever its save mutation failed —
 * without this, a rejected request (bad input, expired session, ...) used
 * to fail with no visible feedback at all. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{getErrorMessage(error)}</span>
    </div>
  )
}
