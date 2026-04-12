import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './auth.css'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode,    setMode]    = useState('login')
  const [form,    setForm]    = useState({ phone: '', fullName: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function switchMode(m) {
    setMode(m)
    setError(null)
    setForm({ phone: '', fullName: '', password: '', password2: '' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && form.password !== form.password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (mode === 'register' && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.phone, form.password)
      } else {
        await signUp(form.phone, form.fullName, form.password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-logo">A</div>
        <div className="auth-brand">ANANTARA</div>
        <div className="auth-tagline">Elige cuidarte</div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ana García"
                value={form.fullName}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="612 345 678"
              value={form.phone}
              onChange={handleChange}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="password2">Repetir contraseña</label>
              <input
                id="password2"
                name="password2"
                type="password"
                placeholder="Repite tu contraseña"
                value={form.password2}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? 'Un momento...'
              : mode === 'login' ? 'Entrar' : 'Crear cuenta'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
