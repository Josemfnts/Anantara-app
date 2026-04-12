import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login               from './pages/auth/Login'
import Home                from './pages/home/Home'
import Osteopatia          from './pages/osteopatia/Osteopatia'
import OsteopatiaCalendar  from './pages/osteopatia/OsteopatiaCalendar'
import Yoga                from './pages/yoga/Yoga'
import MisReservas         from './pages/mis-reservas/MisReservas'

// Placeholder para secciones aún sin construir
function SimplePlaceholder({ title }) {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', background: '#f0f5f0' }}>
      <div style={{ background: 'linear-gradient(160deg,#1d5c2e,#2d7a3f)', padding: '52px 24px 56px' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          En construcción
        </p>
        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ background: '#fff', borderRadius: '28px 28px 0 0', flex: 1, padding: 24, marginTop: -24 }}>
        <p style={{ color: '#aaa', fontSize: 14 }}>Esta sección estará disponible próximamente.</p>
      </div>
    </div>
  )
}

// Ruta privada: sin sesión → login
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

// Ruta pública: con sesión → home
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Autenticación */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Inicio */}
      <Route path="/"        element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/reservar" element={<Navigate to="/" replace />} />

      {/* Osteopatía */}
      <Route path="/osteopatia"
        element={<PrivateRoute><Osteopatia /></PrivateRoute>} />
      <Route path="/osteopatia/calendario/:id"
        element={<PrivateRoute><OsteopatiaCalendar /></PrivateRoute>} />

      {/* Yoga */}
      <Route path="/yoga"
        element={<PrivateRoute><Yoga /></PrivateRoute>} />

      {/* Belleza — por construir */}
      <Route path="/belleza"
        element={<PrivateRoute><SimplePlaceholder title="Belleza" /></PrivateRoute>} />

      {/* Mis reservas */}
      <Route path="/mis-reservas"
        element={<PrivateRoute><MisReservas /></PrivateRoute>} />

      {/* Perfil — por construir */}
      <Route path="/perfil"
        element={<PrivateRoute><SimplePlaceholder title="Mi perfil" /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
