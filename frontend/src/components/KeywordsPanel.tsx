import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Minus, Pencil, Plus, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatNumber } from '../lib/format'
import type { Keyword, Paginated } from '../types'
import { ContentBriefModal } from './ContentBriefModal'
import { EmptyState } from './Layout'
import { Modal } from './Modal'

type KeywordForm = Partial<Keyword>

function emptyForm(projectId: number): KeywordForm {
  return { project: projectId, keyword: '', url: '', target_rank: null }
}

function RankTrend({ history }: { history: Keyword['history'] }) {
  if (history.length < 2) return null
  const [latest, previous] = history
  const diff = previous.rank - latest.rank // positive = improved (lower rank number)
  if (diff === 0) return <Minus className="h-3.5 w-3.5 text-slate-400" />
  if (diff > 0) return <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
  return <ArrowDown className="h-3.5 w-3.5 text-rose-600" />
}

export function KeywordsPanel({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<KeywordForm | null>(null)
  const [rankInputs, setRankInputs] = useState<Record<number, string>>({})
  const [briefFor, setBriefFor] = useState<Keyword | 'blank' | null>(null)

  const { data, isLoading } = useQuery<Paginated<Keyword>>({
    queryKey: ['keywords', { project: projectId }],
    queryFn: async () => (await api.get('/keywords/', { params: { project: projectId } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['keywords'] })

  const save = useMutation({
    mutationFn: (kw: KeywordForm) =>
      kw.id ? api.patch(`/keywords/${kw.id}/`, kw) : api.post('/keywords/', kw),
    onSuccess: () => {
      invalidate()
      setEditing(null)
    },
  })

  const recordRank = useMutation({
    mutationFn: ({ id, rank }: { id: number; rank: number }) =>
      api.post(`/keywords/${id}/record-rank/`, { rank }),
    onSuccess: invalidate,
  })

  const keywords = data?.results ?? []

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button onClick={() => setBriefFor('blank')} className="btn-secondary">
          <Sparkles className="h-4 w-4" /> بریف محتوا با AI
        </button>
        <button onClick={() => setEditing(emptyForm(projectId))} className="btn-primary">
          <Plus className="h-4 w-4" /> کلمه کلیدی جدید
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : keywords.length === 0 ? (
        <EmptyState icon={Search} title="هنوز کلمه کلیدی‌ای برای این پروژه ثبت نشده است." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 text-start">کلمه کلیدی</th>
                <th className="px-4 py-3 text-start">رتبه فعلی</th>
                <th className="px-4 py-3 text-start">رتبه هدف</th>
                <th className="px-4 py-3 text-start">حجم جستجو</th>
                <th className="px-4 py-3 text-start">آخرین بررسی</th>
                <th className="px-4 py-3 text-start">ثبت رتبه جدید</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{kw.keyword}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span>{kw.current_rank ?? '—'}</span>
                      <RankTrend history={kw.history} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{kw.target_rank ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatNumber(kw.search_volume, 0)}</td>
                  <td className="px-4 py-3 text-slate-500">{kw.last_checked ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="رتبه"
                        value={rankInputs[kw.id] ?? ''}
                        onChange={(e) => setRankInputs({ ...rankInputs, [kw.id]: e.target.value })}
                        className="field-input ltr-nums w-20 !py-1"
                      />
                      <button
                        onClick={() => {
                          const rank = Number(rankInputs[kw.id])
                          if (rank > 0) {
                            recordRank.mutate({ id: kw.id, rank })
                            setRankInputs({ ...rankInputs, [kw.id]: '' })
                          }
                        }}
                        className="btn-secondary !px-2 !py-1 text-xs"
                      >
                        ثبت
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setBriefFor(kw)}
                        title="تولید بریف محتوا با هوش مصنوعی"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditing(kw)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'ویرایش کلمه کلیدی' : 'کلمه کلیدی جدید'} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-3"
          >
            <div>
              <label className="field-label">کلمه کلیدی *</label>
              <input
                required
                value={editing.keyword ?? ''}
                onChange={(e) => setEditing({ ...editing, keyword: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">URL صفحه هدف</label>
              <input
                value={editing.url ?? ''}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">رتبه هدف</label>
                <input
                  type="number"
                  value={editing.target_rank ?? ''}
                  onChange={(e) => setEditing({ ...editing, target_rank: Number(e.target.value) })}
                  className="field-input ltr-nums"
                />
              </div>
              <div>
                <label className="field-label">حجم جستجو</label>
                <input
                  type="number"
                  value={editing.search_volume ?? ''}
                  onChange={(e) => setEditing({ ...editing, search_volume: Number(e.target.value) })}
                  className="field-input ltr-nums"
                />
              </div>
              <div>
                <label className="field-label">دشواری (۰-۱۰۰)</label>
                <input
                  type="number"
                  value={editing.difficulty ?? ''}
                  onChange={(e) => setEditing({ ...editing, difficulty: Number(e.target.value) })}
                  className="field-input ltr-nums"
                />
              </div>
            </div>
            <div>
              <label className="field-label">یادداشت</label>
              <textarea
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="field-input"
                rows={2}
              />
            </div>
            <button type="submit" disabled={save.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}

      {briefFor && (
        <ContentBriefModal
          projectId={projectId}
          keywordId={briefFor === 'blank' ? undefined : briefFor.id}
          defaultKeyword={briefFor === 'blank' ? '' : briefFor.keyword}
          onClose={() => setBriefFor(null)}
        />
      )}
    </div>
  )
}
