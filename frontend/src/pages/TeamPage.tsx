import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/Badge'
import { EmptyState, PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { roleLabels } from '../lib/labels'
import type { Paginated, TeamMember, UserRole } from '../types'

type MemberForm = Partial<TeamMember>

const emptyForm: MemberForm = {
  username: '',
  password: '',
  role: 'seo_specialist',
  monthly_capacity_hours: '160',
}

const assignableRoles: UserRole[] = ['seo_specialist', 'content_writer', 'developer', 'designer', 'client']

export function TeamPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MemberForm | null>(null)

  const { data, isLoading } = useQuery<Paginated<TeamMember>>({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/accounts/team/')).data,
  })

  const save = useMutation({
    mutationFn: (member: MemberForm) => {
      const payload = { ...member }
      if (!payload.password) delete payload.password
      return member.id
        ? api.patch(`/accounts/team/${member.id}/`, payload)
        : api.post('/accounts/team/', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setEditing(null)
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/accounts/team/${id}/`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  })

  const members = data?.results ?? []

  return (
    <div>
      <PageHeader
        title="اعضای تیم"
        subtitle="کاربرانی که به‌جز شما به این سیستم دسترسی دارند — تسک‌های خودشان را می‌بینند و می‌توانند زمان ثبت کنند، اما به اطلاعات مالی مشتری/پروژه دسترسی ویرایش ندارند."
        actions={
          <button onClick={() => setEditing(emptyForm)} className="btn-primary">
            <Plus className="h-4 w-4" /> عضو جدید
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="هنوز عضوی به تیم اضافه نکرده‌اید." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 text-start">نام کاربری</th>
                <th className="px-4 py-3 text-start">نقش</th>
                <th className="px-4 py-3 text-start">ظرفیت ماهانه</th>
                <th className="px-4 py-3 text-start">وضعیت</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {member.first_name || member.username}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{roleLabels[member.role]}</td>
                  <td className="px-4 py-3 text-slate-600">{member.monthly_capacity_hours} ساعت</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive.mutate({ id: member.id, is_active: !member.is_active })}>
                      <Badge
                        label={member.is_active ? 'فعال' : 'غیرفعال'}
                        className={member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => setEditing({ ...member, password: '' })}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'ویرایش عضو' : 'عضو جدید'} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">نام کاربری *</label>
                <input
                  required
                  disabled={!!editing.id}
                  value={editing.username ?? ''}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  className="field-input ltr-nums disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="field-label">نام</label>
                <input
                  value={editing.first_name ?? ''}
                  onChange={(e) => setEditing({ ...editing, first_name: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>
            <div>
              <label className="field-label">
                {editing.id ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور *'}
              </label>
              <input
                required={!editing.id}
                type="password"
                minLength={8}
                value={editing.password ?? ''}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                className="field-input ltr-nums"
                placeholder={editing.id ? 'خالی بگذارید تا تغییر نکند' : ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">نقش</label>
                <select
                  value={editing.role ?? 'seo_specialist'}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value as UserRole })}
                  className="field-input"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ظرفیت ماهانه (ساعت)</label>
                <input
                  type="number"
                  value={editing.monthly_capacity_hours ?? ''}
                  onChange={(e) => setEditing({ ...editing, monthly_capacity_hours: e.target.value })}
                  className="field-input ltr-nums"
                />
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
