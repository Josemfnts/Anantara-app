import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import './home.css'

const SERVICES = [
  { key: 'osteo',   path: '/osteopatia',   cls: 'osteo',   icon: '🦴', name: 'Osteopatía', sub: 'Reserva cita' },
  { key: 'yoga',    path: '/yoga',          cls: 'yoga',    icon: '🧘', name: 'Yoga',        sub: 'Próximas clases' },
  { key: 'belleza', path: '/belleza',       cls: 'belleza', icon: '✨', name: 'Belleza',     sub: 'Tratamientos' },
  { key: 'citas',   path: '/mis-reservas',  cls: 'citas',   icon: '📋', name: 'Mis citas',   sub: 'Ver historial' },
]

function initials(fullName) {
  if (!fullName) return 'A'
  return fullName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function firstName(fullName) {
  if (!fullName) return ''
  return fullName.split(' ')[0]
}

function formatRelativeDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const hours  = d.getHours().toString().padStart(2, '0')
  const mins   = d.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${mins}h`

  if (diffDays === 0) return `Hoy · ${timeStr}`
  if (diffDays === 1) return `Mañana · ${timeStr}`

  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${months[d.getMonth()]} · ${timeStr}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]} · ${h}:${m}h`
}

const STATUS_LABELS = {
  confirmed:  'Confirmada',
  pending:    'Pendiente',
  completed:  'Completada',
  cancelled:  'Cancelada',
}

export default function Home() {
  const { patient } = useAuth()

  const [nextAppt,      setNextAppt]      = useState(null)
  const [nextLoading,   setNextLoading]   = useState(true)
  const [recentItems,   setRecentItems]   = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    if (patient?.id) {
      fetchNextAppt(patient.id)
      fetchRecentItems(patient.id)
    }
  }, [patient?.id])

  async function fetchNextAppt(patientId) {
    try {
      const now = new Date().toISOString()

      // Osteopatía appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('start_time, services(name), professionals(full_name)')
        .eq('patient_id', patientId)
        .eq('status', 'confirmed')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(1)

      if (appts?.length) {
        const a = appts[0]
        setNextAppt({
          date:  a.start_time,
          name:  [a.services?.name, a.professionals?.full_name].filter(Boolean).join(' · ') || 'Osteopatía',
        })
        return
      }

      // Yoga / Belleza bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('availability_slots(start_time, services(name))')
        .eq('patient_id', patientId)
        .eq('status', 'confirmed')
        .limit(10)

      const upcoming = (bookings || [])
        .filter(b => b.availability_slots?.start_time >= now)
        .sort((a, b) =>
          new Date(a.availability_slots.start_time) - new Date(b.availability_slots.start_time)
        )

      if (upcoming.length) {
        setNextAppt({
          date: upcoming[0].availability_slots.start_time,
          name: upcoming[0].availability_slots.services?.name || 'Clase',
        })
      }
    } catch { /* silencioso */ }
    finally { setNextLoading(false) }
  }

  async function fetchRecentItems(patientId) {
    try {
      const [{ data: appts }, { data: bookings }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, start_time, status, services(name), professionals(full_name)')
          .eq('patient_id', patientId)
          .order('start_time', { ascending: false })
          .limit(4),
        supabase
          .from('bookings')
          .select('id, status, created_at, availability_slots(start_time, services(name))')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      const apptItems = (appts || []).map(a => ({
        id:     `appt-${a.id}`,
        type:   'osteo',
        name:   a.services?.name || 'Osteopatía',
        pro:    a.professionals?.full_name,
        date:   a.start_time,
        status: a.status,
      }))

      const bookingItems = (bookings || []).map(b => {
        const svcName = b.availability_slots?.services?.name?.toLowerCase() || ''
        const type = svcName.includes('yoga') ? 'yoga' : 'belleza'
        return {
          id:     `book-${b.id}`,
          type,
          name:   b.availability_slots?.services?.name || 'Clase',
          date:   b.availability_slots?.start_time || b.created_at,
          status: b.status,
        }
      })

      const all = [...apptItems, ...bookingItems]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)

      setRecentItems(all)
    } catch { /* silencioso */ }
    finally { setRecentLoading(false) }
  }

  return (
    <div className="home-screen">

      {/* ── Cabecera ─────────────────────────────────────────── */}
      <header className="home-header">
        <div className="home-header-top">
          <div className="home-avatar">{initials(patient?.full_name)}</div>
          <span className="home-brand">ANANTARA</span>
          <button className="home-bell" aria-label="Notificaciones">🔔</button>
        </div>

        <div className="home-greeting-label">Hola,</div>
        <div className="home-greeting-name">
          {firstName(patient?.full_name) || 'bienvenida'} 👋
        </div>

        {/* Próxima cita */}
        {nextLoading ? (
          <div className="home-next-skeleton" />
        ) : nextAppt ? (
          <Link to="/mis-reservas" className="home-next-cita">
            <div className="home-next-label">Próxima cita</div>
            <div className="home-next-name">{nextAppt.name}</div>
            <div className="home-next-date">{formatRelativeDate(nextAppt.date)}</div>
          </Link>
        ) : (
          <div className="home-no-cita">
            <p>No tienes citas próximas · Reserva una abajo</p>
          </div>
        )}
      </header>

      {/* ── Cuerpo blanco ────────────────────────────────────── */}
      <main className="home-body">

        {/* Grid 2×2 */}
        <p className="home-section-label">¿Qué necesitas?</p>
        <div className="services-grid">
          {SERVICES.map(s => (
            <Link key={s.key} to={s.path} className={`service-card ${s.cls}`}>
              <span className="service-icon">{s.icon}</span>
              <span className="service-name">{s.name}</span>
              <span className="service-sub">{s.sub}</span>
            </Link>
          ))}
        </div>

        {/* Últimas reservas */}
        <p className="home-section-label">Últimas reservas</p>
        <div className="recent-list">
          {recentLoading ? (
            <>
              <div className="recent-skeleton" />
              <div className="recent-skeleton" />
            </>
          ) : recentItems.length === 0 ? (
            <div className="no-recent">Aún no tienes reservas</div>
          ) : (
            recentItems.map(item => (
              <Link key={item.id} to="/mis-reservas" className="recent-item">
                <div className={`recent-dot ${item.type}`} />
                <div className="recent-info">
                  <div className="recent-name">
                    {item.name}{item.pro ? ` · ${item.pro}` : ''}
                  </div>
                  <div className="recent-date">{formatDate(item.date)}</div>
                </div>
                <span className={`recent-status ${item.status}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </Link>
            ))
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
