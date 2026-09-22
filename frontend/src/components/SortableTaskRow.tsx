import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, GripVertical, Pencil, Play, Trash2 } from 'lucide-react'
import { Badge } from './Badge'
import { fasterThanEstimateLabel, formatDate, formatHours } from '../lib/format'
import { priorityColors, priorityLabels, taskStatusColors, taskStatusLabels } from '../lib/labels'
import type { Task, TaskStatus } from '../types'

export function SortableTaskRow({
  task,
  onStartTimer,
  startTimerPending,
  onLogHours,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task
  onStartTimer: (id: number) => void
  startTimerPending: boolean
  onLogHours: (task: Task) => void
  onStatusChange: (taskId: number, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="card flex flex-wrap items-center justify-between gap-3 p-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-md p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
        title="جابه‌جایی تسک"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{task.title}</span>
          <Badge label={priorityLabels[task.priority]} className={priorityColors[task.priority]} />
          {task.category_name && <Badge label={task.category_name} className="bg-slate-100 text-slate-600" />}
          {task.status === 'done' &&
            (() => {
              const label = fasterThanEstimateLabel(task.actual_hours, task.estimated_hours)
              return label && <Badge label={label} className="bg-emerald-100 text-emerald-700" />
            })()}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {formatHours(task.actual_hours)} از {formatHours(task.estimated_hours)} تخمینی
          {task.deadline && ` · موعد: ${formatDate(task.deadline)}`}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onStartTimer(task.id)}
          disabled={startTimerPending}
          className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
          title="شروع تایمر روی این تسک"
        >
          <Play className="h-4 w-4" />
        </button>
        <button
          onClick={() => onLogHours(task)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600"
          title="ساعت‌های ثبت‌شده / ثبت دستی"
        >
          <Clock className="h-4 w-4" />
        </button>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${taskStatusColors[task.status]}`}
        >
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onEdit(task)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="ویرایش"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          title="حذف تسک"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}
