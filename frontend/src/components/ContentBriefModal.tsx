import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import type { ContentBrief } from '../types'
import { Modal } from './Modal'

export function ContentBriefModal({
  projectId,
  keywordId,
  defaultKeyword,
  onClose,
}: {
  projectId: number
  keywordId?: number
  defaultKeyword: string
  onClose: () => void
}) {
  const [targetKeyword, setTargetKeyword] = useState(defaultKeyword)
  const [competitorNotes, setCompetitorNotes] = useState('')
  const [brief, setBrief] = useState<ContentBrief | null>(null)

  const generate = useMutation({
    mutationFn: async () =>
      (
        await api.post('/keywords/content-briefs/generate/', {
          project: projectId,
          keyword: keywordId,
          target_keyword: targetKeyword,
          competitor_notes: competitorNotes,
        })
      ).data as ContentBrief,
    onSuccess: (data) => setBrief(data),
  })

  const errorMessage =
    (generate.error as { response?: { data?: { detail?: string } } } | undefined)?.response?.data
      ?.detail ?? (generate.isError ? 'خطایی رخ داد.' : null)

  return (
    <Modal title="تولید بریف محتوا با هوش مصنوعی" onClose={onClose} wide>
      {!brief ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            generate.mutate()
          }}
          className="space-y-3"
        >
          <div>
            <label className="field-label">کلمه کلیدی هدف *</label>
            <input
              required
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">یادداشت درباره رقبا (اختیاری)</label>
            <textarea
              value={competitorNotes}
              onChange={(e) => setCompetitorNotes(e.target.value)}
              className="field-input"
              rows={3}
              placeholder="مثلاً: رقیب A روی قیمت تمرکز کرده، رقیب B صفحه‌ی طولانی‌تری دارد..."
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button type="submit" disabled={generate.isPending} className="btn-primary w-full">
            <Sparkles className="h-4 w-4" />
            {generate.isPending ? 'در حال تولید...' : 'تولید بریف'}
          </button>
        </form>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <div className="text-xs text-slate-400">هدف جستجو (Intent)</div>
            <div className="text-sm text-slate-800">{brief.intent}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">H1 پیشنهادی</div>
            <div className="font-semibold text-slate-900">{brief.h1}</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-400">ساختار عنوان‌ها</div>
            <ul className="space-y-1 text-sm">
              {brief.headings.map((h, i) => (
                <li key={i} className={h.level === 'h3' ? 'ms-4 text-slate-600' : 'font-medium text-slate-800'}>
                  {h.level === 'h3' ? '– ' : '• '}
                  {h.text}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-400">سوالات متداول (FAQ)</div>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {brief.faq.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 text-xs text-slate-400">کلمات کلیدی مرتبط</div>
              <div className="flex flex-wrap gap-1">
                {brief.related_keywords.map((k, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-400">لینک‌های داخلی پیشنهادی</div>
              <ul className="list-inside list-disc text-sm text-slate-700">
                {brief.internal_link_suggestions.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-brand-50/50 p-3 text-sm">
            <span className="text-slate-600">
              طول پیشنهادی: <span className="font-medium text-slate-900">{brief.target_word_count} کلمه</span>
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400">پیشنهاد CTA</div>
            <div className="text-sm text-slate-800">{brief.cta_suggestion}</div>
          </div>
          <button onClick={onClose} className="btn-secondary w-full">
            بستن
          </button>
        </div>
      )}
    </Modal>
  )
}
