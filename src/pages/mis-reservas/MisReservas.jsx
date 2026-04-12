import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import './mis-reservas.css'

const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${h}:${m}h`
}

const STATUS_LABEL = {
  confirmed:  'Confirmada',
  pending:    'Pendiente',
  completed:  'Completada',
  cancelled:  'Cancelada',
}

const FILTERS = [
  { key: 'all',       label: 'Todas' },
  { key: 'upcoming',  label: 'Próximas' },
  { key: 'past',      label: 'Pasadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

export default function MisReservas() {
  const { patient } = useAuth()

  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [toCancel, setToCancel] = useState(null)  // { id, type }
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (patient?.id) fetchAll(patient.id)
  }, [patient?.id])

  async function fetchAll(patientId) {
    try {
      const [{ data: appts }, { data: bookings }] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, start_time, status, services(name), professionals(full_name)')
          .eq('patient_id', patientId)
          .order('start_time', { ascending: false }),
        supabase
          .from('bookings')
          .select('id, status, created_at, slot_id, availability_slots(start_time, services(name), professionals(full_name))')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
      ])

      const apptItems = (appts || []).map(a => ({
        id:     a.id,
        rawId:  a.id,
        type:   'osteo',
        typeLabel: 'Osteopatía',
        name:   a.services?.name || 'Osteopatía',
        pro:    a.professionals?.full_name,
        date:   a.start_time,
        status: a.status || 'pending',
        source: 'appointment',
      }))

      const bookingItems = (bookings || []).map(b => {
        const svcName = b.availability_slots?.services?.name || ''
        const isYoga  = svcName.toLowerCase().includes('yoga')
        return {
          id:     b.id,
          rawId:  b.id,
          type:   isYoga ? 'yoga' : 'belleza',
          typeLabel: isYoga ? 'Yoga' : 'Belleza',
          name:   svcName || 'Clase',
          pro:    b.availability_slots?.professionals?.full_name,
          date:   b.availability_slots?.start_time || b.created_at,
          status: b.status || 'pending',
          source: 'booking',
        }
      })

      const all = [...apptItems, ...bookingItems]
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      setItems(all)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }

  async function confirmCancel() {
    if (!toCancel) return
    setCancelling(true)
    try {
      if (toCancel.source === 'appointment') {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', toCancel.rawId)
      } else {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', toCancel.rawId)
      }
      setItems(prev =>
        prev.map(i => i.id === toCancel.id && i.source === toCancel.source
          ? { ...i, status: 'cancelled' }
          : i
        )
      )
    } catch { /* silencioso */ }
    finally {
      setCancelling(false)
      setToCancel(null)
    }
  }

  const now = new Date()

  const filtered = items.filter(item => {
    const d = new Date(item.date)
    if (filter === 'upcoming')  return d >= now && item.status !== 'cancelled'
    if (filter === 'past')      return d < now  && item.status !== 'cancelled'
    if (filter === 'cancelled') return item.status === 'cancelled'
    return true
  })

  function canCancel(item) {
    return item.status !== 'cancelled' && item.status !== 'completed' && new Date(item.date) > now
  }

  return (
    <div className="reservas-screen">

      <header className="reservas-header">
        <div className="reservas-header-title">Mis reservas</div>
        <div className="reservas-header-sub">Tu historial de citas</div>
      </header>

      <main className="reservas-body">

        {/* Filtros */}
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`ftab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading && (
          <>
            <div className="reservas-skeleton" />
            <div className="reservas-skeleton" />
            <div className="reservas-skeleton" />
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="reservas-empty">
            <strong>Sin resultados</strong>
            {filter === 'all'
              ? 'Aún no tienes reservas. ¡Empieza reservando!'
              : 'No hay reservas en esta categoría.'}
          </div>
        )}

        {!loading && filtered.map(item => {
          const isPast = new Date(item.date) < now
          return (
            <div key={`${item.source}-${item.id}`} className={`cita-card ${isPast ? 'past' : ''}`}>
              <div className="cita-top">
                <span className={`cita-tipo ${item.type}`}>{item.typeLabel}</span>
                <span className={`cita-status ${item.status}`}>
                  {STATUS_LABEL[item.status] || item.status}
                </span>
              </div>
              <div className="cita-name">{item.name}</div>
              <div className="cita-date">{formatDate(item.date)}</div>
              {item.pro && <div className="cita-pro">{item.pro}</div>}

              {canCancel(item) && (
                <div className="cita-actions">
                  <button
                    className="act-btn cancel"
                    onClick={() => setToCancel(item)}
                  >
                    Cancelar
                  </button>
                  <button className="act-btn detail">
                    Ver detalle
                  </button>
                </div>
              )}
            </div>
          )
        })}

      </main>

      {/* Modal cancelación */}
      {toCancel && (
        <div className="cancel-modal-overlay" onClick={() => setToCancel(null)}>
          <div className="cancel-modal" onClick={e => e.stopPropagation()}>
            <div className="cancel-modal-title">¿Cancelar esta cita?</div>
            <div className="cancel-modal-sub">
              {toCancel.name} · {formatDate(toCancel.date)}<br />
              Esta acción no se puede deshacer.
            </div>
            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-confirm"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
              <button className="cancel-modal-back" onClick={() => setToCancel(null)}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
