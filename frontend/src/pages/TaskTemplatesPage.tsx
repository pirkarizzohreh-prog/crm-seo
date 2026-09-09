import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutTemplate, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { projectTypeLabels } from '../lib/labels'
import type { Paginated, ProjectType, TaskCategory, TaskTemplate, TaskTemplateItem } from '../types'

type TemplateForm = {
  id?: number
  name: string
  description: string
  project_type: ProjectType | ''
  items: TaskTemplateItem[]
}

function emptyForm(): TemplateForm {
  return { name: '', description: '', project_type: '', items: [] }
}

function emptyItem(order: number): TaskTemplateItem {
  return { title: '', category: null, estimated_hours: '', order }
}

export function TaskTemplatesPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<TemplateForm | null>(null)

  const { data, isLoading } = useQuery<Paginated<TaskTemplate>>({
    queryKey: ['task-templates'],
    queryFn: async () => (await api.get('/tasks/templates/')).data,
  })

  const { data: categories } = useQuery<Paginated<TaskCategory>>({
    queryKey: ['task-categories'],
    queryFn: async () => (await api.get('/tasks/categories/')).data,
  })

  const save = useMutation({
    mutationFn: (form: TemplateForm) =>
      form.id ? api.put(`/tasks/templates/${form.id}/`, form) : api.post('/tasks/templates/', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] })
      setEditing(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/templates/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-templates'] }),
  })

  const templates = data?.results ?? []

  function updateItem(index: number, patch: Partial<TaskTemplateItem>) {
    if (!editing) return
    const items = editing.items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    setEditing({ ...editing, items })
  }

  function removeItem(index: number) {
    if (!editing) return
    setEditing({ ...editing, items: editing.items.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <PageHeader
        title="قالب‌های تسک سئو"
        subtitle="وقتی پروژه جدیدی می‌سازید، می‌توانید یک قالب را روی آن اعمال کنید تا چک‌لیست اولیه خودکار ساخته شود."
        actions={
          <button onClick={() => setEditing(emptyForm())} className="btn-primary">
            <Plus className="h-4 w-4" /> قالب جدید
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="هنوز قالبی نساخته‌اید." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card p-4">
              <div className="mb-1 flex items-start justify-between">
                <span className="font-medium text-slate-900">{tpl.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        id: tpl.id,
                        name: tpl.name,
                        description: tpl.description,
                        project_type: tpl.project_type,
                        items: tpl.items,
                      })
                    }
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('این قالب حذف شود؟')) remove.mutate(tpl.id)
                    }}
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {tpl.project_type && (
                <div className="mb-2 text-xs text-slate-500">{projectTypeLabels[tpl.project_type]}</div>
              )}
              <div className="text-xs text-slate-400">{tpl.items.length} تسک در این قالب</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {tpl.items.slice(0, 4).map((item, i) => (
                  <li key={i}>• {item.title}</li>
                ))}
                {tpl.items.length > 4 && <li className="text-slate-400">و {tpl.items.length - 4} مورد دیگر...</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'ویرایش قالب' : 'قالب جدید'} onClose={() => setEditing(null)} wide>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">نام قالب *</label>
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">نوع پروژه پیشنهادی</label>
                <select
                  value={editing.project_type}
                  onChange={(e) => setEditing({ ...editing, project_type: e.target.value as ProjectType })}
                  className="field-input"
                >
                  <option value="">—</option>
                  {Object.entries(projectTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">توضیحات</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="field-input"
                rows={2}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="field-label !mb-0">تسک‌های قالب</label>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({ ...editing, items: [...editing.items, emptyItem(editing.items.length)] })
                  }
                  className="btn-secondary !px-2.5 !py-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> افزودن تسک
                </button>
              </div>
              <div className="space-y-2">
                {editing.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                    <input
                      placeholder="عنوان تسک"
                      value={item.title}
                      onChange={(e) => updateItem(index, { title: e.target.value })}
                      className="field-input flex-1 !py-1.5"
                    />
                    <select
                      value={item.category ?? ''}
                      onChange={(e) =>
                        updateItem(index, { category: e.target.value ? Number(e.target.value) : null })
                      }
                      className="field-input w-40 !py-1.5"
                    >
                      <option value="">بدون دسته</option>
                      {categories?.results.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="ساعت"
                      value={item.estimated_hours ?? ''}
                      onChange={(e) => updateItem(index, { estimated_hours: e.target.value })}
                      className="field-input ltr-nums w-20 !py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {editing.items.length === 0 && (
                  <p className="text-xs text-slate-400">هنوز تسکی به این قالب اضافه نکرده‌اید.</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={save.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
