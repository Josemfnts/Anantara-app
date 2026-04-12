import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import './osteopatia.css'

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

// Construye el grid del mes (lunes primero)
function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()

  // JS: 0=Dom → convertir a lunes-primero: 0=Lun, 6=Dom
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(d)
  return cells
}

function pad(n) { return String(n).padStart(2, '0') }

function dateStr(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export default function OsteopatiaCalendar() {
  const { id: professionalId } = useParams()
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const { patient } = useAuth()

  const professional = state?.professional || null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year,          setYear]          = useState(today.getFullYear())
  const [month,         setMonth]         = useState(today.getMonth())
  const [availDays,     setAvailDays]     = useState(new Set())
  const [daysLoading,   setDaysLoading]   = useState(true)
  const [selectedDate,  setSelectedDate]  = useState(null)
  const [slots,         setSlots]         = useState([])
  const [slotsLoading,  setSlotsLoading]  = useState(false)
  const [selectedSlot,  setSelectedSlot]  = useState(null)
  const [confirming,    setConfirming]    = useState(false)
  const [confirmed,     setConfirmed]     = useState(false)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    fetchAvailableDays()
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, professionalId])

  async function fetchAvailableDays() {
    setDaysLoading(true)
    try {
      const startOfMonth = dateStr(year, month, 1)
      const endOfMonth   = new Date(year, month + 1, 0)
      const endStr       = dateStr(year, month, endOfMonth.getDate())

      // Días trabajados (day_of_week: 1=Lun … 7=Dom en ISO, o 0=Dom en JS)
      const { data: wh } = await supabase
        .from('working_hours')
        .select('day_of_week')
        .eq('professional_id', professionalId)

      // Días bloqueados
      const { data: bd } = await supabase
        .from('blocked_days')
        .select('date')
        .eq('professional_id', professionalId)
        .gte('date', startOfMonth)
        .lte('date', endStr)

      // También mirar citas ya existentes (para detectar días llenos, ignoramos por ahora)
      const workingDOW = new Set((wh || []).map(r => r.day_of_week))
      const blockedSet = new Set((bd || []).map(r => r.date))

      const available = new Set()
      for (let d = 1; d <= endOfMonth.getDate(); d++) {
        const dt  = new Date(year, month, d)
        const dow = dt.getDay() // 0=Dom…6=Sáb

        // Normalizar: en working_hours podría ser 0=Dom o 1=Lun…7=Dom
        // Intentamos ambas convenciones
        const isWorking =
          workingDOW.has(dow) ||
          workingDOW.has(dow === 0 ? 7 : dow) // ISO: Lun=1…Dom=7

        const ds = dateStr(year, month, d)
        if (dt >= today && isWorking && !blockedSet.has(ds)) {
          available.add(d)
        }
      }

      // Si no hay working_hours configurados, marcamos todos los días hábiles
      if (workingDOW.size === 0) {
        for (let d = 1; d <= endOfMonth.getDate(); d++) {
          const dt  = new Date(year, month, d)
          const dow = dt.getDay()
          const ds  = dateStr(year, month, d)
          if (dt >= today && dow !== 0 && dow !== 6 && !blockedSet.has(ds)) {
            available.add(d)
          }
        }
      }

      setAvailDays(available)
    } catch {
      // Si hay error, mostramos días laborables por defecto
    } finally {
      setDaysLoading(false)
    }
  }

  async function fetchSlots(day) {
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    const ds = dateStr(year, month, day)
    setSelectedDate(ds)
    try {
      // Llamar a la función RPC get_available_slots
      const { data, error } = await supabase
        .rpc('get_available_slots', {
          p_professional_id: professionalId,
          p_date: ds,
        })

      if (!error && data?.length) {
        // La RPC puede devolver strings "HH:MM" u objetos {time, available}
        const formatted = data.map(s =>
          typeof s === 'string' ? { time: s, available: true }
                                : { time: s.time || s.start_time?.slice(11, 16), available: s.available !== false }
        )
        setSlots(formatted)
      } else {
        // Fallback: generar slots de ejemplo desde working_hours
        setSlots(await generateFallbackSlots(ds))
      }
    } catch {
      setSlots(await generateFallbackSlots(ds))
    } finally {
      setSlotsLoading(false)
    }
  }

  async function generateFallbackSlots(ds) {
    // Buscar citas ya existentes para ese día y profesional
    const dayStart = `${ds}T00:00:00`
    const dayEnd   = `${ds}T23:59:59`

    const { data: existingAppts } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('professional_id', professionalId)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .neq('status', 'cancelled')

    const takenTimes = new Set(
      (existingAppts || []).map(a => a.start_time.slice(11, 16))
    )

    // Horario por defecto 9-14 y 16-19, cada hora
    const defaultHours = [9, 10, 11, 12, 13, 16, 17, 18]
    return defaultHours.map(h => ({
      time:      `${pad(h)}:00`,
      available: !takenTimes.has(`${pad(h)}:00`),
    }))
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || !patient?.id) return
    setConfirming(true)
    setError(null)
    try {
      const startTime = new Date(`${selectedDate}T${selectedSlot}:00`)
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id:      patient.id,
          professional_id: professionalId,
          start_time:      startTime.toISOString(),
          status:          'confirmed',
        })
      if (error) throw error
      setConfirmed(true)
    } catch (err) {
      setError(err.message || 'No se pudo crear la cita. Inténtalo de nuevo.')
    } finally {
      setConfirming(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────
  if (confirmed) {
    const proName = professional?.full_name || 'el profesional'
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <div className="success-title">¡Cita reservada!</div>
        <p className="success-sub">
          {selectedDate} a las {selectedSlot}h<br />con {proName}
        </p>
        <button className="osteo-btn" style={{ width: 'auto', padding: '14px 32px' }}
          onClick={() => navigate('/mis-reservas')}>
          Ver mis citas
        </button>
      </div>
    )
  }

  const grid  = buildMonthGrid(year, month)
  const todayDay = today.getFullYear() === year && today.getMonth() === month
                 ? today.getDate() : -1

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const isPrevDisabled =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month <= today.getMonth())

  return (
    <div className="osteo-screen">

      <header className="osteo-header">
        <button className="osteo-back" onClick={() => navigate('/osteopatia')}>
          ‹ {professional?.full_name || 'Atrás'}
        </button>
        <div className="osteo-header-title">Elige tu cita</div>
        <div className="osteo-header-sub">
          {professional?.specialty || 'Osteopatía'}
        </div>
      </header>

      <main className="osteo-body">

        {/* Navegación de mes */}
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={prevMonth} disabled={isPrevDisabled}>‹</button>
          <span className="cal-month-name">{MONTH_NAMES[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>

        {/* Cabecera días */}
        <div className="cal-day-labels">
          {WEEK_DAYS.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
        </div>

        {/* Grid de días */}
        <div className="cal-grid">
          {grid.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="cal-day" />
            const ds       = dateStr(year, month, day)
            const isAvail  = availDays.has(day)
            const isToday  = day === todayDay
            const isSel    = ds === selectedDate
            let cls = 'cal-day'
            if (isSel)      cls += ' selected'
            else if (isAvail) cls += ' available' + (isToday ? ' today' : '')
            return (
              <div
                key={day}
                className={cls}
                onClick={() => isAvail && !daysLoading && fetchSlots(day)}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Slots de hora */}
        {selectedDate && (
          <>
            <div className="slots-title">
              Horas disponibles · {selectedDate}
            </div>

            {slotsLoading ? (
              <div className="osteo-skeleton" style={{ height: 48 }} />
            ) : slots.length === 0 ? (
              <p className="no-slots">No hay horas disponibles este día</p>
            ) : (
              <div className="slots-grid">
                {slots.map(s => (
                  <button
                    key={s.time}
                    className={`slot-btn ${!s.available ? 'taken' : selectedSlot === s.time ? 'selected' : ''}`}
                    onClick={() => s.available && setSelectedSlot(s.time)}
                    disabled={!s.available}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Banner de confirmación */}
        {selectedSlot && (
          <div className="confirm-banner">
            <span className="confirm-banner-icon">🗓</span>
            <span className="confirm-banner-text">
              {selectedDate} a las {selectedSlot}h
            </span>
          </div>
        )}

        {error && <p className="osteo-error">{error}</p>}

        <button
          className="osteo-btn"
          disabled={!selectedSlot || confirming}
          onClick={handleConfirm}
          style={{ marginTop: 12 }}
        >
          {confirming ? 'Reservando...' : selectedSlot ? `Confirmar cita · ${selectedSlot}h` : 'Selecciona hora'}
        </button>

      </main>
    </div>
  )
}
