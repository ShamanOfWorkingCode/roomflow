import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const DEPARTMENTS = [
  'IT',
  'HR',
  'Маркетинг',
  'Продажи',
  'Финансы',
  'Бухгалтерия',
  'Юридический отдел',
  'Логистика',
  'Производство',
  'Руководство',
]

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '', department: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const employee = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form)
      loginUser(employee)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">⬡</span>
          <div>
            <div className="login-logo-name">RoomFlow</div>
            <div className="login-logo-sub">Система бронирования переговорок</div>
          </div>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Вход
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Полное имя</label>
                <input
                  required
                  placeholder="Иван Иванов"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Должность / отдел</label>
                <select
                  required
                  value={form.department}
                  onChange={e => update('department', e.target.value)}
                >
                  <option value="" disabled>Выберите отдел...</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              required
              type="email"
              placeholder="you@company.ru"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              required
              type="password"
              minLength={4}
              placeholder="••••••"
              value={form.password}
              onChange={e => update('password', e.target.value)}
            />
          </div>

          <button className="btn primary login-submit" type="submit" disabled={loading}>
            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="login-hint">
          Демо: a.kozlov@alfa.ru / 12345
        </div>
      </div>
    </div>
  )
}
