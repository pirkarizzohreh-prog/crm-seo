import { LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('نام کاربری یا رمز عبور اشتباه است.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 via-slate-50 to-slate-50 px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
            س
          </div>
          <h1 className="text-lg font-bold text-slate-900">سیستم عملیات آژانس سئو</h1>
          <p className="mt-1 text-sm text-slate-500">برای ادامه وارد حساب خود شوید</p>
        </div>

        <label className="field-label">نام کاربری</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="field-input mb-4"
          autoFocus
        />

        <label className="field-label">رمز عبور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input mb-4"
        />

        {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          <LogIn className="h-4 w-4" strokeWidth={2} />
          {isLoading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  )
}
