import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { TimerSession } from '../types'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function TimerWidget() {
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)

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
    mutationFn: () => api.post('/time/timer/stop/', {}),
    onSuccess: invalidate,
  })

  if (!timer) {
    return <div className="py-1.5 text-sm text-slate-400">هیچ تایمر فعالی وجود ندارد.</div>
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
      <span className="ltr-nums font-mono text-sm font-semibold text-slate-900">
        {formatDuration(displaySeconds)}
      </span>
      <div className="flex gap-2">
        {timer.is_running ? (
          <button
            onClick={() => pause.mutate()}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            توقف موقت
          </button>
        ) : (
          <button
            onClick={() => resume.mutate()}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            ادامه
          </button>
        )}
        <button
          onClick={() => stop.mutate()}
          className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
        >
          پایان و ثبت
        </button>
      </div>
    </div>
  )
}
