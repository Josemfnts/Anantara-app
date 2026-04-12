import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'

// Páginas reales — las construimos en la siguiente fase
// De momento muestran un placeholder para que la app no rompa
function Placeholder({ title }) {
  const { signOut, patient } = useAuth()
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1d5c2e' }}>{title}</h2>
        <button
          onClick={signOut}
          style={{ padding: '8px 16px', background: '#f0f5f0', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#666' }}
        >
          Cerrar sesión
        </button>
      </div>
      <p style={{ color: '#888' }}>Hola, {patient?.full_name} 👋</p>
      <p style={{ color: '#aaa', marginTop: 8, fontSize: 14 }}>Esta sección está en construcción.</p>
    </div>
  )
}

// Ruta privada: si no hay sesión manda al login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f5f0' }}>
      <p style={{ color: '#2d7a3f', fontFamily: 'sans-serif' }}>Cargando...</p>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Ruta pública: si ya hay sesión manda al inicio
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/"              element={<PrivateRoute><Placeholder title="Inicio" /></PrivateRoute>} />
      <Route path="/osteopatia"    element={<PrivateRoute><Placeholder title="Osteopatía" /></PrivateRoute>} />
      <Route path="/yoga"          element={<PrivateRoute><Placeholder title="Yoga" /></PrivateRoute>} />
      <Route path="/belleza"       element={<PrivateRoute><Placeholder title="Belleza" /></PrivateRoute>} />
      <Route path="/mis-reservas"  element={<PrivateRoute><Placeholder title="Mis reservas" /></PrivateRoute>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
