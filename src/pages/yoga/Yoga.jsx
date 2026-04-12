import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import './yoga.css'

const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const WEEK_DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function formatClassDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  const durationLabel = '' // duración se mostraría si la tuviéramos
  return `${WEEK_DAYS[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${h}:${m}h${durationLabel}`
}

export default function Yoga() {
  const navigate       = useNavigate()
  const { patient }    = useAuth()

  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [toast,   setToast]   = useState(null)
  // Set de slot_ids ya reservados por este paciente
  const [booked,  setBooked]  = useState(new Set())

  useEffect(() => {
    fetchSlots()
    if (patient?.id) fetchMyBookings(patient.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id])

  async function fetchSlots() {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*, services(name), professionals(full_name), bookings(id)')
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error

      // Filtrar los que sean de yoga (por nombre de servicio)
      const yogaSlots = (data || []).filter(s => {
        const name = (s.services?.name || '').toLowerCase()
        return name.includes('yoga') || name.includes('clase')
      })

      // Si no hay filtro de yoga, mostrar todos los slots publicados
      setSlots(yogaSlots.length > 0 ? yogaSlots : (data || []))
    } catch (err) {
      setError('No se pudieron cargar las clases.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyBookings(patientId) {
    const { data } = await supabase
      .from('bookings')
      .select('slot_id')
      .eq('patient_id', patientId)
      .neq('status', 'cancelled')
    setBooked(new Set((data || []).map(b => b.slot_id)))
  }

  async function handleBook(slot) {
    if (!patient?.id) return
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          patient_id: patient.id,
          slot_id:    slot.id,
          status:     'confirmed',
        })
      if (error) throw error
      setBooked(prev => new Set([...prev, slot.id]))
      showToast(`¡Apuntada a ${slot.services?.name || 'la clase'}! ✓`)
    } catch (err) {
      showToast('No se pudo reservar. Inténtalo de nuevo.')
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Plazas libres
  function freePlaces(slot) {
    const booked = Array.isArray(slot.bookings) ? slot.bookings.length : 0
    return (slot.max_bookings || 10) - booked
  }

  return (
    <div className="yoga-screen">

      <header className="yoga-header">
        <button className="yoga-back" onClick={() => navigate('/')}>
          ‹ Inicio
        </button>
        <div className="yoga-header-title">Yoga</div>
        <div className="yoga-header-sub">
          {slots[0]?.professionals?.full_name
            ? `${slots[0].professionals.full_name} · Próximas clases`
            : 'Próximas clases'}
        </div>
      </header>

      <main className="yoga-body">
        <p className="yoga-section-label">Clases disponibles</p>

        {loading && (
          <>
            <div className="yoga-skeleton" />
            <div className="yoga-skeleton" />
          </>
        )}

        {error && <p className="yoga-error">{error}</p>}

        {!loading && !error && slots.length === 0 && (
          <div className="yoga-empty">
            No hay clases publicadas en este momento.<br />Vuelve pronto.
          </div>
        )}

        {slots.map(slot => {
          const free     = freePlaces(slot)
          const isFull   = free <= 0
          const isBooked = booked.has(slot.id)
          const isUrgent = free <= 2 && !isFull

          return (
            <div key={slot.id} className={`class-card ${isFull ? 'full' : ''}`}>
              <div className={`class-card-hero ${isFull ? 'full-color' : 'yoga-color'}`}>
                🧘
              </div>
              <div className="class-card-body">
                <div className="class-name">{slot.services?.name || 'Clase de Yoga'}</div>
                <div className="class-date">
                  {formatClassDate(slot.start_time)}
                  {slot.duration_minutes ? ` · ${slot.duration_minutes} min` : ''}
                </div>
                <div className="class-footer">
                  <div>
                    {isFull ? (
                      <span className="tag-full">Completo</span>
                    ) : (
                      <span className={`plazas-info ${isUrgent ? 'urgente' : ''}`}>
                        Plazas: <strong>{free} libre{free !== 1 ? 's' : ''}</strong> de {slot.max_bookings || 10}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {slot.price != null && (
                      <span className="class-price">{slot.price}€</span>
                    )}
                    {!isFull && (
                      <button
                        className={`apuntar-btn ${isBooked ? 'booked' : ''}`}
                        onClick={() => !isBooked && handleBook(slot)}
                        disabled={isBooked}
                      >
                        {isBooked ? 'Apuntada ✓' : 'Apuntarme'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {toast && <div className="yoga-toast">{toast}</div>}

      <BottomNav />
    </div>
  )
}
