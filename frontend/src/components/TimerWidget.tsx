import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pause, Play, Square, TimerOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TimerSession } from '../types'
import { FormError } from './FormError'
import { Modal } from './Modal'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function TimerWidget() {
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)
  const [stopping, setStopping] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: timer } = useQuery<TimerSession | null>({
    queryKey: ['timer'],
    queryFn: async () => (await api.get('/time/timer/')).data,
    refetchInterval: 15000,
  })

  useEffect(() => {
    if (!timer?.is_running) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [timer?.is_running])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['timer'] })
    queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const pause = useMutation({
    mutationFn: () => api.post('/time/timer/pause/'),
    onSuccess: invalidate,
  })
  const resume = useMutation({
    mutationFn: () => api.post('/time/timer/resume/'),
    onSuccess: invalidate,
  })
  const stop = useMutation({
    mutationFn: (notes: string) => api.post('/time/timer/stop/', { notes }),
    onSuccess: () => {
      invalidate()
      setStopping(false)
      setNotes('')
    },
  })

  if (!timer) {
    return (
      <div className="flex items-center gap-2 py-1.5 text-sm text-slate-400">
        <TimerOff className="h-4 w-4" strokeWidth={1.75} />
        هیچ تایمر فعالی وجود ندارد
      </div>
    )
  }

  const displaySeconds = timer.is_running ? timer.current_seconds + tick : timer.current_seconds

  return (
    <div className="flex flex-wrap items-center gap-3 py-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${timer.is_running ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`}
      />
      <span className="text-sm text-slate-600">
        در حال کار روی <span className="font-medium text-slate-900">{timer.task_title}</span>
      </span>
      <span className="ltr-nums rounded-md bg-slate-100 px-2 py-0.5 font-mono text-sm font-semibold text-slate-900">
        {formatDuration(displaySeconds)}
      </span>
      <div className="flex gap-2">
        {timer.is_running ? (
          <button
            onClick={() => pause.mutate()}
            className="btn-secondary !px-2 !py-1 text-xs"
          >
            <Pause className="h-3.5 w-3.5" /> توقف موقت
          </button>
        ) : (
          <button
            onClick={() => resume.mutate()}
            className="btn-secondary !px-2 !py-1 text-xs"
          >
            <Play className="h-3.5 w-3.5" /> ادامه
          </button>
        )}
        <button onClick={() => setStopping(true)} className="btn-danger !px-2 !py-1 text-xs">
          <Square className="h-3.5 w-3.5" /> پایان و ثبت
        </button>
      </div>

      {stopping && (
        <Modal title="پایان تایمر" onClose={() => setStopping(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              stop.mutate(notes)
            }}
            className="space-y-3"
          >
            <p className="text-sm text-slate-500">
              روی <span className="font-medium text-slate-900">{timer.task_title}</span> چه کاری انجام
              دادید؟ این یادداشت توی گزارش ماهانه پروژه می‌آید.
            </p>
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-input"
              rows={3}
              placeholder="مثلاً: بهینه‌سازی عنوان و متا ۱۲ محصول، رفع خطای ایندکس ۳ صفحه..."
            />
            <FormError error={stop.error} />
            <div className="flex gap-2">
              <button type="submit" disabled={stop.isPending} className="btn-primary flex-1">
                ثبت و پایان
              </button>
              <button type="button" onClick={() => setStopping(false)} className="btn-secondary">
                انصراف
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
