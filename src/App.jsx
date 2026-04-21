import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useCallback } from 'react'

// ─── Supabase ────────────────────────────────────────────────────────────────
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storageKey: 'anantara-app' } }
)


// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const MONTH_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const WEEK_DAYS = ['L','M','X','J','V','S','D']
const WEEK_LONG = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function pad(n) { return String(n).padStart(2,'0') }
function toK(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function localDT(d) { return `${toK(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }

function fDT(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}h`
}
function fRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date(); now.setHours(0,0,0,0)
  const diff = Math.floor((d - now) / 86400000)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}h`
  if (diff === 0) return `Hoy · ${time}`
  if (diff === 1) return `Mañana · ${time}`
  return `${WEEK_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`
}

function phoneToEmail(phone) {
  const clean = phone.replace(/\s/g,'').replace(/^\+/,'')
  return `${clean}@anantara.local`
}

function initials(name) {
  if (!name) return 'A'
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month+1, 0).getDate()
  let offset = first.getDay() - 1; if (offset < 0) offset = 6
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= last; d++) cells.push(d)
  return cells
}
function dateStr(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}` }

const STATUS_LABEL = { confirmed:'Confirmada', pending:'Pendiente', completed:'Completada', cancelled:'Cancelada' }
const AVATAR_COLORS = ['green','blue','gold']

// ─── Atom components ─────────────────────────────────────────────────────────
function Toast({ msg, type='ok', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div className={`toast${type==='error'?' error':''}`}>{msg}</div>
}

function Sp() {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
    <div style={{ width:28, height:28, border:'3px solid var(--border)', borderTopColor:'var(--green)', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
}

// ─── BottomNav ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'home',        icon:'🏠', label:'Inicio' },
  { id:'reservar',    icon:'📅', label:'Reservar' },
  { id:'mis-reservas',icon:'📋', label:'Mis citas' },
  { id:'perfil',      icon:'👤', label:'Perfil' },
]

function BottomNav({ page, onNav }) {
  const active = NAV_ITEMS.find(n => page === n.id || (n.id === 'home' && !['mis-reservas','perfil'].includes(page) && page !== 'reservar'))?.id || 'home'
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(it => (
        <button key={it.id} className={`bnav-item ${active===it.id?'active':''}`} onClick={() => onNav(it.id)}>
          <span className="bnav-icon">{it.icon}</span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ phone:'', fullName:'', password:'', password2:'' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const upd = e => setForm(f => ({...f, [e.target.name]: e.target.value}))
  const switchMode = m => { setMode(m); setErr(''); setForm({ phone:'', fullName:'', password:'', password2:'' }) }

  const submit = async e => {
    e.preventDefault(); setErr('')
    if (mode === 'register') {
      if (form.password !== form.password2) { setErr('Las contraseñas no coinciden'); return }
      if (form.password.length < 6) { setErr('La contraseña debe tener al menos 6 caracteres'); return }
    }
    setLoading(true)
    try {
      const email = phoneToEmail(form.phone)
      if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: form.password })
        if (error) throw new Error('Teléfono o contraseña incorrectos')
        onLogin(data.user)
      } else {
        const { data, error } = await sb.auth.signUp({
          email, password: form.password,
          options: { data: { full_name: form.fullName, phone: form.phone } }
        })
        if (error) {
          if (error.message.includes('already registered')) throw new Error('Este teléfono ya tiene una cuenta. Inicia sesión.')
          throw error
        }
        if (data.user) {
          await sb.from('patients').update({ full_name: form.fullName, phone: form.phone.replace(/\s/g,'') }).eq('id', data.user.id)
          onLogin(data.user)
        }
      }
    } catch (ex) {
      setErr(ex.message)
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
          <button className={mode==='login'?'active':''} onClick={() => switchMode('login')}>Entrar</button>
          <button className={mode==='register'?'active':''} onClick={() => switchMode('register')}>Crear cuenta</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label>Nombre completo</label>
              <input name="fullName" type="text" placeholder="Ana García" value={form.fullName} onChange={upd} required autoFocus />
            </div>
          )}
          <div className="auth-field">
            <label>Teléfono</label>
            <input name="phone" type="tel" placeholder="612 345 678" value={form.phone} onChange={upd} required autoFocus={mode==='login'} />
          </div>
          <div className="auth-field">
            <label>Contraseña</label>
            <input name="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={upd} required />
          </div>
          {mode === 'register' && (
            <div className="auth-field">
              <label>Repetir contraseña</label>
              <input name="password2" type="password" placeholder="Repite tu contraseña" value={form.password2} onChange={upd} required />
            </div>
          )}
          {err && <div className="auth-err">{err}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomePage({ patient, onNav }) {
  const [nextAppt,  setNextAppt]  = useState(null)
  const [nextLoad,  setNextLoad]  = useState(true)
  const [recent,    setRecent]    = useState([])
  const [recLoad,   setRecLoad]   = useState(true)

  useEffect(() => {
    if (!patient?.id) return
    const now = localDT(new Date())

    // Next appointment
    sb.from('appointments')
      .select('starts_at,services(name),professionals(name)')
      .eq('patient_id', patient.id).eq('status','confirmed').gte('starts_at', now)
      .order('starts_at').limit(1)
      .then(async ({ data: appts }) => {
        if (appts?.length) {
          const a = appts[0]
          setNextAppt({ date:a.starts_at, name:[a.services?.name,a.professionals?.name].filter(Boolean).join(' · ') || 'Osteopatía' })
        } else {
          const { data: bks } = await sb.from('bookings')
            .select('availability_slots(start_time,services(name))')
            .eq('patient_id', patient.id).eq('status','confirmed').limit(10)
          const up = (bks||[]).filter(b => b.availability_slots?.start_time >= now)
            .sort((a,b) => new Date(a.availability_slots.start_time)-new Date(b.availability_slots.start_time))
          if (up.length) setNextAppt({ date:up[0].availability_slots.start_time, name:up[0].availability_slots.services?.name || 'Clase' })
        }
        setNextLoad(false)
      })

    // Recent items
    Promise.all([
      sb.from('appointments').select('id,starts_at,status,services(name),professionals(name)').eq('patient_id',patient.id).order('starts_at',{ascending:false}).limit(4),
      sb.from('bookings').select('id,status,created_at,availability_slots(start_time,services(name))').eq('patient_id',patient.id).order('created_at',{ascending:false}).limit(4),
    ]).then(([{ data:a }, { data:b }]) => {
      const ai = (a||[]).map(x => ({ id:`a-${x.id}`, type:'osteo', name:x.services?.name||'Osteopatía', pro:x.professionals?.name, date:x.starts_at, status:x.status }))
      const bi = (b||[]).map(x => {
        const n = x.availability_slots?.services?.name || ''; const isY = n.toLowerCase().includes('yoga')
        return { id:`b-${x.id}`, type:isY?'yoga':'belleza', name:n||'Clase', date:x.availability_slots?.start_time||x.created_at, status:x.status }
      })
      setRecent([...ai,...bi].sort((x,y) => new Date(y.date)-new Date(x.date)).slice(0,3))
      setRecLoad(false)
    })
  }, [patient?.id])

  const SERVICES = [
    { id:'osteopatia', cls:'osteo',   icon:'🦴', name:'Osteopatía', sub:'Reserva cita' },
    { id:'yoga',       cls:'yoga',    icon:'🧘', name:'Yoga',        sub:'Próximas clases' },
    { id:'belleza',    cls:'belleza', icon:'✨', name:'Belleza',     sub:'Tratamientos' },
    { id:'mis-reservas',cls:'citas',  icon:'📋', name:'Mis citas',   sub:'Ver historial' },
  ]

  return (
    <div className="screen">
      <header className="green-header">
        <div className="green-header-inner">
          <div className="home-top-row">
            <div className="home-avatar">{initials(patient?.full_name)}</div>
            <span className="home-brand">ANANTARA</span>
            <button className="home-bell">🔔</button>
          </div>
          <div className="home-greeting">Hola,</div>
          <div className="home-name">{patient?.full_name?.split(' ')[0] || 'bienvenida'} 👋</div>
          {nextLoad ? (
            <div className="skel" style={{ height:72, borderRadius:14 }} />
          ) : nextAppt ? (
            <div className="next-cita-card" onClick={() => onNav('mis-reservas')}>
              <div className="next-cita-label">Próxima cita</div>
              <div className="next-cita-name">{nextAppt.name}</div>
              <div className="next-cita-date">{fRelative(nextAppt.date)}</div>
            </div>
          ) : (
            <div className="no-cita">No tienes citas próximas · Reserva una abajo</div>
          )}
        </div>
      </header>

      <main className="green-body">
        <p className="section-label">¿Qué necesitas?</p>
        <div className="services-grid">
          {SERVICES.map(s => (
            <button key={s.id} className={`service-card ${s.cls}`} onClick={() => onNav(s.id)}>
              <span className="service-icon">{s.icon}</span>
              <span className="service-name">{s.name}</span>
              <span className="service-sub">{s.sub}</span>
            </button>
          ))}
        </div>

        <p className="section-label">Últimas reservas</p>
        {recLoad ? (
          <><div className="skel" style={{ height:54, marginBottom:8 }} /><div className="skel" style={{ height:54 }} /></>
        ) : recent.length === 0 ? (
          <div className="no-recent">Aún no tienes reservas</div>
        ) : recent.map(item => (
          <button key={item.id} className="recent-item" onClick={() => onNav('mis-reservas')}>
            <div className={`recent-dot ${item.type}`} />
            <div className="recent-info">
              <div className="recent-name">{item.name}{item.pro ? ` · ${item.pro}` : ''}</div>
              <div className="recent-date">{fDT(item.date)}</div>
            </div>
            <span className={`recent-status-badge ${item.status}`}>{STATUS_LABEL[item.status] || item.status}</span>
          </button>
        ))}
      </main>
      <BottomNav page="home" onNav={onNav} />
    </div>
  )
}

// ─── Osteopatia ───────────────────────────────────────────────────────────────
function OsteopatiaPage({ onNav, onSelectPro }) {
  const [profs,   setProfs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected,setSelected]= useState(null)
  const [err,     setErr]     = useState('')

  useEffect(() => {
    sb.from('professionals').select('id,name').eq('is_active',true).eq('section','osteopathy').order('name')
      .then(({ data, error }) => {
        if (error) setErr('No se pudo cargar la lista de profesionales.')
        else setProfs(data||[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="screen">
      <header className="green-header">
        <div className="green-header-inner">
          <button className="page-back" onClick={() => onNav('home')}>‹ Inicio</button>
          <div className="page-htitle">Osteopatía</div>
          <div className="page-hsub">Elige tu profesional</div>
        </div>
      </header>
      <main className="green-body">
        <p className="section-label">Profesionales disponibles</p>
        {loading && <><div className="skel" style={{ height:76, marginBottom:10 }} /><div className="skel" style={{ height:76 }} /></>}
        {err && <p className="pro-err">{err}</p>}
        {!loading && !err && profs.length === 0 && <p className="no-recent">No hay profesionales disponibles en este momento.</p>}
        {profs.map((pro, idx) => (
          <div key={pro.id} className={`pro-card ${selected?.id===pro.id?'selected':''}`} onClick={() => setSelected(pro)}>
            <div className={`pro-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{initials(pro.name)}</div>
            <div className="pro-info">
              <div className="pro-name">{pro.name}</div>
              <div className="pro-spec">Osteópata</div>
              <span className="pro-avail">Ver disponibilidad →</span>
            </div>
            <div className="pro-check">✓</div>
          </div>
        ))}
        <button className="main-btn" disabled={!selected} onClick={() => { if(selected) onSelectPro(selected) }}>
          Ver calendario →
        </button>
      </main>
      <BottomNav page="osteopatia" onNav={onNav} />
    </div>
  )
}

// ─── OsteopatiaCalendar ───────────────────────────────────────────────────────
function OsteopatiaCalendarPage({ pro, patient, onNav, onBack }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [services,   setServices]  = useState([])
  const [selService,setSelService]= useState(null)
  const [year,   setYear]   = useState(today.getFullYear())
  const [month,  setMonth]  = useState(today.getMonth())
  const [avail,  setAvail]  = useState(new Set())
  const [dayLoad,setDayLoad]= useState(true)
  const [selDate,setSelDate]= useState(null)
  const [slots,  setSlots]  = useState([])
  const [slLoad, setSlLoad] = useState(false)
  const [selSlot,setSelSlot]= useState(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmed,  setConfirmed]  = useState(false)
  const [err,    setErr]    = useState('')

  useEffect(() => {
    sb.from('services').select('id,name,duration_minutes').eq('is_active',true).eq('section','osteopathy').order('name')
      .then(({ data }) => setServices(data||[]))
  }, [])

  useEffect(() => {
    setDayLoad(true); setSelDate(null); setSelSlot(null); setSlots([])
    const start = dateStr(year,month,1)
    const end   = dateStr(year,month, new Date(year,month+1,0).getDate())

    Promise.all([
      sb.from('working_hours').select('day_of_week,active').eq('professional_id',pro.id).eq('active',true),
      sb.from('blocked_days').select('blocked_date').eq('professional_id',pro.id).gte('blocked_date',start).lte('blocked_date',end),
    ]).then(([{data:wh},{data:bd}]) => {
      const workDOW = new Set((wh||[]).map(r => r.day_of_week))
      const blocked = new Set((bd||[]).map(r => r.blocked_date))
      const last = new Date(year,month+1,0).getDate()
      const available = new Set()
      for (let d = 1; d <= last; d++) {
        const dt  = new Date(year,month,d)
        const dow = dt.getDay()
        const isWorking = workDOW.size === 0
          ? (dow !== 0 && dow !== 6)
          : (workDOW.has(dow) || workDOW.has(dow===0?7:dow))
        const ds = dateStr(year,month,d)
        if (dt >= today && isWorking && !blocked.has(ds)) available.add(d)
      }
      setAvail(available); setDayLoad(false)
    })
  }, [year, month, pro.id])

  const fetchSlots = async (day) => {
    setSlLoad(true); setSlots([]); setSelSlot(null)
    const ds = dateStr(year,month,day); setSelDate(ds)
    try {
      const { data, error } = await sb.rpc('get_available_slots', { p_professional_id:pro.id, p_date:ds })
      if (!error && data?.length) {
        setSlots(data.map(s => typeof s==='string' ? {time:s,available:true} : {time:s.time||s.start_time?.slice(11,16),available:s.available!==false}))
      } else throw new Error('fallback')
    } catch {
      // Fallback: generate from working hours
      const { data: existing } = await sb.from('appointments').select('starts_at')
        .eq('professional_id',pro.id).gte('starts_at',ds+'T00:00:00').lte('starts_at',ds+'T23:59:59').neq('status','cancelled')
      const taken = new Set((existing||[]).map(a => a.starts_at.slice(11,16)))
      const hours = [9,10,11,12,13,16,17,18]
      setSlots(hours.map(h => ({ time:`${pad(h)}:00`, available:!taken.has(`${pad(h)}:00`) })))
    }
    setSlLoad(false)
  }

  const confirm = async () => {
    if (!selDate || !selSlot || !patient?.id || !selService) return
    setConfirming(true); setErr('')
    try {
      const startDT = new Date(`${selDate}T${selSlot}:00`)
      const endDT   = new Date(startDT.getTime() + (selService.duration_minutes||60) * 60000)
      // Race condition check: verify slot is still free before inserting
      const { data: existing } = await sb.from('appointments')
        .select('id').eq('professional_id', pro.id)
        .gte('starts_at', localDT(startDT))
        .lt('starts_at', localDT(endDT))
        .neq('status','cancelled')
      if (existing?.length > 0) {
        setErr('Este hueco acaba de ser ocupado. Elige otra hora.')
        setSelSlot(null)
        setConfirming(false)
        return
      }
      const { error } = await sb.from('appointments').insert({
        patient_id: patient.id,
        professional_id: pro.id,
        service_id: selService.id,
        starts_at: localDT(startDT),
        ends_at: localDT(endDT),
        status: 'pending',
        notes: selService.name,
      })
      if (error) throw error
      setConfirmed(true)
    } catch (ex) {
      setErr(ex.message || 'No se pudo crear la cita.')
    }
    setConfirming(false)
  }

  if (confirmed) {
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <div className="success-title">¡Cita solicitada!</div>
        <p className="success-sub">{selService?.name}<br />{selDate} a las {selSlot}h<br />con {pro.name}<br /><span style={{ fontSize:12, color:'var(--text-muted)' }}>Recibirás confirmación pronto</span></p>
        <button className="main-btn" style={{ width:'auto', padding:'14px 32px' }} onClick={() => onNav('mis-reservas')}>
          Ver mis citas
        </button>
      </div>
    )
  }

  // Step 1: service type selector
  if (!selService) {
    return (
      <div className="screen">
        <header className="green-header">
          <div className="green-header-inner">
            <button className="page-back" onClick={onBack}>‹ {pro.name}</button>
            <div className="page-htitle">Tipo de consulta</div>
            <div className="page-hsub">¿Qué tipo de cita necesitas?</div>
          </div>
        </header>
        <main className="green-body">
          <p className="section-label">Elige el tipo de sesión</p>
          {services.length === 0 && <p className="no-recent">Cargando servicios…</p>}
          {services.map(svc => (
            <div key={svc.id} className={`svc-card ${selService?.id===svc.id?'selected':''}`} onClick={() => setSelService(svc)}>
              <div className="svc-icon2">🦴</div>
              <div className="svc-info">
                <div className="svc-name">{svc.name}</div>
                <div className="svc-dur">{svc.duration_minutes} min</div>
              </div>
              <div className="svc-check">✓</div>
            </div>
          ))}
        </main>
      </div>
    )
  }

  const grid = buildMonthGrid(year, month)
  const todayDay = today.getFullYear()===year && today.getMonth()===month ? today.getDate() : -1
  const prevDisabled = year < today.getFullYear() || (year===today.getFullYear() && month<=today.getMonth())

  const prevMonth = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  return (
    <div className="screen">
      <header className="green-header">
        <div className="green-header-inner">
          <button className="page-back" onClick={() => setSelService(null)}>‹ Tipo de consulta</button>
          <div className="page-htitle">Elige tu cita</div>
          <div className="page-hsub">{selService.name} · {selService.duration_minutes} min · {pro.name}</div>
        </div>
      </header>
      <main className="green-body">
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={prevMonth} disabled={prevDisabled}>‹</button>
          <span className="cal-month-name">{MONTH_FULL[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <div className="cal-day-labels">
          {WEEK_DAYS.map(d => <div key={d} className="cal-day-lbl">{d}</div>)}
        </div>
        {dayLoad ? (
          <div className="skel" style={{ height:200, borderRadius:14, marginBottom:16 }} />
        ) : (
          <div className="cal-grid">
            {grid.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="cal-day-cell" />
              const ds = dateStr(year,month,day)
              const isAvail = avail.has(day)
              const isToday = day === todayDay
              const isSel   = ds === selDate
              let cls = 'cal-day-cell'
              if (isSel) cls += ' selected'
              else if (isAvail) cls += ' available' + (isToday ? ' today' : '')
              return (
                <div key={day} className={cls} onClick={() => isAvail && fetchSlots(day)}>{day}</div>
              )
            })}
          </div>
        )}

        {selDate && (
          <>
            <div className="slots-section-title">Horas disponibles · {selDate}</div>
            {slLoad ? (
              <div className="skel" style={{ height:48, marginBottom:16 }} />
            ) : slots.length === 0 ? (
              <p className="no-slots">No hay horas disponibles este día</p>
            ) : (
              <div className="slots-grid">
                {slots.map(s => (
                  <button key={s.time}
                    className={`slot-btn ${!s.available?'taken':selSlot===s.time?'selected':''}`}
                    onClick={() => s.available && setSelSlot(s.time)}
                    disabled={!s.available}>
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selSlot && (
          <div className="confirm-banner">
            <span>🗓</span>
            <span className="confirm-banner-text">{selDate} a las {selSlot}h</span>
          </div>
        )}
        {err && <p style={{ color:'#dc2626', fontSize:13, textAlign:'center', marginBottom:8 }}>{err}</p>}
        <button className="main-btn" disabled={!selSlot || confirming} onClick={confirm}>
          {confirming ? 'Reservando…' : selSlot ? `Confirmar cita · ${selSlot}h` : 'Selecciona una hora'}
        </button>
      </main>
    </div>
  )
}

// ─── Yoga ─────────────────────────────────────────────────────────────────────
function YogaPage({ patient, onNav }) {
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [booked,  setBooked]  = useState(new Set())
  const [toast,   setToast]   = useState(null)
  const [err,     setErr]     = useState('')

  useEffect(() => {
    const now = localDT(new Date())
    sb.from('availability_slots')
      .select('*,services!inner(name,section),bookings(id,status)')
      .eq('services.section','yoga')
      .eq('published',true).gte('start_time',now).order('start_time').limit(20)
      .then(({ data, error }) => {
        if (error) { setErr('No se pudieron cargar las clases.') }
        else {
          setSlots((data||[]).map(s => ({
            ...s,
            bookings: (s.bookings||[]).filter(b => b.status !== 'cancelled')
          })))
        }
        setLoading(false)
      })
    if (patient?.id) {
      sb.from('bookings').select('slot_id').eq('patient_id',patient.id).neq('status','cancelled')
        .then(({ data }) => setBooked(new Set((data||[]).map(b => b.slot_id))))
    }

    // Realtime: update seat counts when bookings change
    const ch = sb.channel('yoga-bookings-watch')
      .on('postgres_changes', { event: '*', schema:'public', table:'bookings' }, payload => {
        const slotId = payload.new?.slot_id || payload.old?.slot_id
        if (!slotId) return
        setSlots(prev => prev.map(s => {
          if (s.id !== slotId) return s
          let bks = [...(s.bookings || [])]
          if (payload.eventType === 'INSERT' && payload.new.status !== 'cancelled') {
            if (!bks.find(b => b.id === payload.new.id)) bks.push({ id: payload.new.id, status: payload.new.status })
          } else if (payload.eventType === 'UPDATE') {
            bks = bks.filter(b => b.id !== payload.new.id)
            if (payload.new.status !== 'cancelled') bks.push({ id: payload.new.id, status: payload.new.status })
          } else if (payload.eventType === 'DELETE') {
            bks = bks.filter(b => b.id !== payload.old.id)
          }
          return { ...s, bookings: bks }
        }))
      })
      .subscribe()

    return () => { sb.removeChannel(ch) }
  }, [patient?.id])

  const book = async (slot) => {
    if (!patient?.id) return
    // Race condition check: verify capacity before booking
    const { data: current } = await sb.from('bookings').select('id').eq('slot_id', slot.id).neq('status','cancelled')
    const cap = slot.capacity || slot.max_bookings || 10
    if ((current||[]).length >= cap) {
      setToast({ msg:'Esta clase acaba de completarse. Elige otra.', type:'error' })
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, bookings: current || [] } : s))
      return
    }
    const { error } = await sb.from('bookings').insert({ patient_id:patient.id, slot_id:slot.id, status:'confirmed' })
    if (error) { setToast({ msg:'No se pudo reservar. Inténtalo de nuevo.', type:'error' }); return }
    setBooked(prev => new Set([...prev, slot.id]))
    setToast({ msg:`¡Apuntada a ${slot.services?.name||'la clase'}! ✓`, type:'ok' })
  }

  return (
    <div className="screen">
      <header className="green-header" style={{ background:'linear-gradient(160deg,#1a547a,#2e82b8)' }}>
        <div className="green-header-inner">
          <button className="page-back" onClick={() => onNav('home')}>‹ Inicio</button>
          <div className="page-htitle">Yoga</div>
          <div className="page-hsub">Próximas clases</div>
        </div>
      </header>
      <main className="green-body">
        <p className="section-label">Clases disponibles</p>
        {loading && <><div className="skel" style={{ height:160, marginBottom:12, borderRadius:14 }} /><div className="skel" style={{ height:160, borderRadius:14 }} /></>}
        {err && <p style={{ color:'#dc2626', fontSize:13, textAlign:'center', padding:20 }}>{err}</p>}
        {!loading && !err && slots.length === 0 && (
          <div className="empty-state"><div className="empty-icon">🧘</div><div className="empty-title">Sin clases próximas</div><div className="empty-sub">Vuelve pronto</div></div>
        )}
        {slots.map(slot => {
          const bookedCount = Array.isArray(slot.bookings) ? slot.bookings.length : 0
          const cap   = slot.capacity || slot.max_bookings || 10
          const free  = cap - bookedCount
          const full  = free <= 0
          const isB   = booked.has(slot.id)
          const urgent = free <= 2 && !full
          return (
            <div key={slot.id} className="class-card">
              <div className={`class-card-hero class-hero-${full?'gray':'blue'}`}>🧘</div>
              <div className="class-card-body">
                <div className="class-name">{slot.services?.name || 'Clase de Yoga'}</div>
                <div className="class-date">
                  {(() => { const d=new Date(slot.start_time); return `${WEEK_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}h` })()}
                  {slot.duration_minutes ? ` · ${slot.duration_minutes} min` : ''}
                </div>
                <div className="class-footer">
                  <div>
                    {full ? <span className="full-tag">Completo</span>
                          : <span className={`places-tag ${urgent?'places-urgent':''}`}>Plazas: <strong>{free} libre{free!==1?'s':''}</strong> de {cap}</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {slot.price != null && <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>{slot.price}€</span>}
                    {!full && (
                      <button className={`class-btn ${isB?'booked':''}`} onClick={() => !isB && book(slot)} disabled={isB}>
                        {isB ? 'Apuntada ✓' : 'Apuntarme'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav page="yoga" onNav={onNav} />
    </div>
  )
}

// ─── Belleza ──────────────────────────────────────────────────────────────────
function BellezaPage({ patient, onNav }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [step,       setStep]       = useState('services') // services | profs | calendar | success
  const [services,   setServices]   = useState([])
  const [profs,      setProfs]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selService, setSelService] = useState(null)
  const [selProf,    setSelProf]    = useState(null)
  const [year,       setYear]       = useState(today.getFullYear())
  const [month,      setMonth]      = useState(today.getMonth())
  const [avail,      setAvail]      = useState(new Set())
  const [dayLoad,    setDayLoad]    = useState(true)
  const [selDate,    setSelDate]    = useState(null)
  const [slots,      setSlots]      = useState([])
  const [slLoad,     setSlLoad]     = useState(false)
  const [selSlot,    setSelSlot]    = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [err,        setErr]        = useState('')
  const [toast,      setToast]      = useState(null)

  // Load services + professionals once
  useEffect(() => {
    Promise.all([
      sb.from('services').select('id,name,duration_minutes,price,description').eq('section','beauty').eq('is_active',true).order('name'),
      sb.from('professionals').select('id,name,specialty').eq('section','beauty').eq('is_active',true).order('name'),
    ]).then(([{ data: svcs }, { data: pros }]) => {
      setServices(svcs || [])
      setProfs(pros || [])
      setLoading(false)
    })
  }, [])

  // Load available days when prof/month changes
  useEffect(() => {
    if (!selProf) return
    setDayLoad(true); setSelDate(null); setSelSlot(null); setSlots([])
    const start = dateStr(year, month, 1)
    const end   = dateStr(year, month, new Date(year, month+1, 0).getDate())
    Promise.all([
      sb.from('working_hours').select('day_of_week,active').eq('professional_id', selProf.id).eq('active', true),
      sb.from('blocked_days').select('blocked_date').eq('professional_id', selProf.id).gte('blocked_date', start).lte('blocked_date', end),
    ]).then(([{ data: wh }, { data: bd }]) => {
      const workDOW = new Set((wh||[]).map(r => r.day_of_week))
      const blocked = new Set((bd||[]).map(r => r.blocked_date))
      const last = new Date(year, month+1, 0).getDate()
      const available = new Set()
      for (let d = 1; d <= last; d++) {
        const dt  = new Date(year, month, d)
        const dow = dt.getDay()
        const isWorking = workDOW.size === 0 ? (dow !== 0 && dow !== 6) : workDOW.has(dow)
        const ds = dateStr(year, month, d)
        if (dt >= today && isWorking && !blocked.has(ds)) available.add(d)
      }
      setAvail(available); setDayLoad(false)
    })
  }, [selProf, year, month])

  const fetchSlots = async (day) => {
    setSlLoad(true); setSlots([]); setSelSlot(null)
    const ds = dateStr(year, month, day); setSelDate(ds)
    const { data: existing } = await sb.from('appointments').select('starts_at')
      .eq('professional_id', selProf.id).gte('starts_at', ds+'T00:00:00').lte('starts_at', ds+'T23:59:59').neq('status','cancelled')
    const taken = new Set((existing||[]).map(a => a.starts_at.slice(11,16)))
    const hours = [9,10,11,12,13,16,17,18]
    setSlots(hours.map(h => ({ time:`${pad(h)}:00`, available: !taken.has(`${pad(h)}:00`) })))
    setSlLoad(false)
  }

  const confirm = async () => {
    if (!selDate || !selSlot || !patient?.id || !selService || !selProf) return
    setConfirming(true); setErr('')
    const dur = selService.duration_minutes || 60
    const startDT = new Date(`${selDate}T${selSlot}:00`)
    const endDT   = new Date(startDT.getTime() + dur * 60000)
    const { data: existing } = await sb.from('appointments').select('id')
      .eq('professional_id', selProf.id)
      .gte('starts_at', localDT(startDT))
      .lt('starts_at', localDT(endDT))
      .neq('status','cancelled')
    if (existing?.length > 0) {
      setErr('Este hueco acaba de ser ocupado. Elige otra hora.')
      setSelSlot(null); setConfirming(false); return
    }
    const { error } = await sb.from('appointments').insert({
      patient_id: patient.id, professional_id: selProf.id,
      service_id: selService.id,
      starts_at: localDT(startDT),
      ends_at: localDT(endDT),
      status: 'pending', notes: selService.name,
    })
    setConfirming(false)
    if (error) { setErr(error.message); return }
    setStep('success')
  }

  const prevMonth = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }
  const prevDisabled = year < today.getFullYear() || (year===today.getFullYear() && month<=today.getMonth())
  const HEADER_STYLE = { background:'linear-gradient(160deg,var(--purple),#9b6dd6)' }

  // ── Success ──
  if (step === 'success') return (
    <div className="success-screen">
      <div className="success-icon">✅</div>
      <div className="success-title">¡Cita solicitada!</div>
      <p className="success-sub">{selService?.name}<br/>{selDate} a las {selSlot}h<br/>con {selProf?.name}<br/><span style={{fontSize:12,color:'var(--text-muted)'}}>Recibirás confirmación pronto</span></p>
      <button className="main-btn" style={{width:'auto',padding:'14px 32px'}} onClick={() => onNav('mis-reservas')}>Ver mis citas</button>
    </div>
  )

  // ── Step: services ──
  if (step === 'services') return (
    <div className="screen">
      <header className="green-header" style={HEADER_STYLE}>
        <div className="green-header-inner">
          <button className="page-back" onClick={() => onNav('home')}>‹ Inicio</button>
          <div className="page-htitle">Belleza</div>
          <div className="page-hsub">Elige un tratamiento</div>
        </div>
      </header>
      <main className="green-body">
        <p className="section-label">Servicios disponibles</p>
        {loading && <><div className="skel" style={{height:76,marginBottom:10}}/><div className="skel" style={{height:76,marginBottom:10}}/><div className="skel" style={{height:76}}/></>}
        {!loading && services.length === 0 && <div className="empty-state"><div className="empty-icon">✨</div><div className="empty-title">Sin servicios activos</div><div className="empty-sub">Próximamente</div></div>}
        {services.map(svc => (
          <div key={svc.id} className={`svc-card ${selService?.id===svc.id?'selected':''}`} onClick={() => setSelService(svc)}>
            <div className="svc-icon2" style={{background:'linear-gradient(135deg,var(--purple),#9b6dd6)'}}>✨</div>
            <div className="svc-info">
              <div className="svc-name">{svc.name}</div>
              <div className="svc-dur">{svc.duration_minutes} min{svc.price!=null?` · ${svc.price}€`:''}{svc.description?` · ${svc.description}`:''}</div>
            </div>
            <div className="svc-check">✓</div>
          </div>
        ))}
        <button className="main-btn" disabled={!selService} onClick={() => setStep('profs')} style={{background:'var(--purple)'}}>
          {selService ? `Continuar con ${selService.name} →` : 'Selecciona un servicio'}
        </button>
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav page="belleza" onNav={onNav} />
    </div>
  )

  // ── Step: professionals ──
  if (step === 'profs') return (
    <div className="screen">
      <header className="green-header" style={HEADER_STYLE}>
        <div className="green-header-inner">
          <button className="page-back" onClick={() => { setStep('services'); setSelProf(null) }}>‹ Servicios</button>
          <div className="page-htitle">Profesional</div>
          <div className="page-hsub">{selService?.name}</div>
        </div>
      </header>
      <main className="green-body">
        <p className="section-label">Elige tu profesional</p>
        {profs.length === 0 && <p className="no-recent">No hay profesionales disponibles.</p>}
        {profs.map((pro, idx) => (
          <div key={pro.id} className={`pro-card ${selProf?.id===pro.id?'selected':''}`} onClick={() => setSelProf(pro)}>
            <div className={`pro-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{initials(pro.name)}</div>
            <div className="pro-info">
              <div className="pro-name">{pro.name}</div>
              <div className="pro-spec">{pro.specialty || 'Especialista en belleza'}</div>
            </div>
            <div className="pro-check">✓</div>
          </div>
        ))}
        <button className="main-btn" disabled={!selProf} onClick={() => setStep('calendar')} style={{background:'var(--purple)'}}>
          Ver disponibilidad →
        </button>
      </main>
    </div>
  )

  // ── Step: calendar ──
  const grid = buildMonthGrid(year, month)
  const todayDay = today.getFullYear()===year && today.getMonth()===month ? today.getDate() : -1
  return (
    <div className="screen">
      <header className="green-header" style={HEADER_STYLE}>
        <div className="green-header-inner">
          <button className="page-back" onClick={() => { setStep('profs'); setSelDate(null); setSelSlot(null) }}>‹ {selProf?.name}</button>
          <div className="page-htitle">Elige tu cita</div>
          <div className="page-hsub">{selService?.name} · {selService?.duration_minutes} min</div>
        </div>
      </header>
      <main className="green-body">
        <div className="cal-month-nav">
          <button className="cal-nav-btn" onClick={prevMonth} disabled={prevDisabled}>‹</button>
          <span className="cal-month-name">{MONTH_FULL[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <div className="cal-day-labels">{WEEK_DAYS.map(d=><div key={d} className="cal-day-lbl">{d}</div>)}</div>
        {dayLoad ? <div className="skel" style={{height:200,borderRadius:14,marginBottom:16}}/> : (
          <div className="cal-grid">
            {grid.map((day,i) => {
              if (!day) return <div key={`e-${i}`} className="cal-day-cell"/>
              const ds = dateStr(year,month,day)
              const isAvail = avail.has(day); const isToday = day===todayDay; const isSel = ds===selDate
              let cls = 'cal-day-cell'
              if (isSel) cls += ' selected'
              else if (isAvail) cls += ' available'+(isToday?' today':'')
              return <div key={day} className={cls} onClick={() => isAvail && fetchSlots(day)}>{day}</div>
            })}
          </div>
        )}
        {selDate && (<>
          <div className="slots-section-title">Horas disponibles · {selDate}</div>
          {slLoad ? <div className="skel" style={{height:48,marginBottom:16}}/> : slots.length===0 ? <p className="no-slots">No hay horas disponibles este día</p> : (
            <div className="slots-grid">
              {slots.map(s => (
                <button key={s.time} className={`slot-btn ${!s.available?'taken':selSlot===s.time?'selected':''}`}
                  onClick={() => s.available && setSelSlot(s.time)} disabled={!s.available}>{s.time}</button>
              ))}
            </div>
          )}
        </>)}
        {selSlot && <div className="confirm-banner"><span>🗓</span><span className="confirm-banner-text">{selDate} a las {selSlot}h</span></div>}
        {err && <p style={{color:'#dc2626',fontSize:13,textAlign:'center',marginBottom:8}}>{err}</p>}
        <button className="main-btn" disabled={!selSlot||confirming} onClick={confirm} style={{background:'var(--purple)'}}>
          {confirming ? 'Reservando…' : selSlot ? `Confirmar · ${selSlot}h` : 'Selecciona una hora'}
        </button>
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}

// ─── Mis Reservas ─────────────────────────────────────────────────────────────
function MisReservasPage({ patient, onNav }) {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [toCancel,   setToCancel]   = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const [toast,      setToast]      = useState(null)

  const FILTERS = [['all','Todas'],['upcoming','Próximas'],['past','Pasadas'],['cancelled','Canceladas']]

  const load = useCallback(async () => {
    if (!patient?.id) return
    setLoading(true)
    const [{ data:a }, { data:b }] = await Promise.all([
      sb.from('appointments').select('id,starts_at,status,services(name),professionals(name)').eq('patient_id',patient.id).order('starts_at',{ascending:false}).limit(50),
      sb.from('bookings').select('id,status,created_at,slot_id,availability_slots(start_time,services(name,section),professionals(name))').eq('patient_id',patient.id).order('created_at',{ascending:false}).limit(50),
    ])
    const ai = (a||[]).map(x => ({ id:x.id, type:'osteo', typeLabel:'Osteopatía', name:x.services?.name||'Osteopatía', pro:x.professionals?.name, date:x.starts_at, status:x.status||'pending', source:'appointment' }))
    const bi = (b||[]).map(x => {
      const sec = x.availability_slots?.services?.section||''; const isY = sec === 'yoga'
      const n = x.availability_slots?.services?.name||''
      return { id:x.id, type:isY?'yoga':'belleza', typeLabel:isY?'Yoga':'Belleza', name:n||'Clase', pro:x.availability_slots?.professionals?.name, date:x.availability_slots?.start_time||x.created_at, status:x.status||'pending', source:'booking' }
    })
    setItems([...ai,...bi].sort((x,y) => new Date(y.date)-new Date(x.date)))
    setLoading(false)
  }, [patient?.id])

  useEffect(() => { load() }, [load])

  const cancel = async () => {
    if (!toCancel) return; setCancelling(true)
    const table = toCancel.source === 'appointment' ? 'appointments' : 'bookings'
    const { error } = await sb.from(table).update({ status:'cancelled', cancelled_by:'patient' }).eq('id', toCancel.id)
    if (error) { setCancelling(false); setToast({ msg:'No se pudo cancelar. Inténtalo de nuevo.', type:'error' }); return }
    setItems(prev => prev.map(i => i.id===toCancel.id && i.source===toCancel.source ? {...i,status:'cancelled'} : i))
    setCancelling(false); setToCancel(null); setToast({ msg:'Cita cancelada', type:'ok' })
  }

  const now = new Date()
  const filtered = items.filter(item => {
    const d = new Date(item.date)
    if (filter==='upcoming')  return d >= now && item.status !== 'cancelled'
    if (filter==='past')      return d < now  && item.status !== 'cancelled'
    if (filter==='cancelled') return item.status === 'cancelled'
    return true
  })

  const canCancel = item => item.status !== 'cancelled' && item.status !== 'completed' && new Date(item.date) > now

  return (
    <div className="screen">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <header className="green-header">
        <div className="green-header-inner">
          <div className="page-htitle">Mis reservas</div>
          <div className="page-hsub">Tu historial de citas</div>
        </div>
      </header>
      <main className="green-body">
        <div className="filter-bar">
          {FILTERS.map(([k,l]) => (
            <button key={k} className={`filter-btn ${filter===k?'active':''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {loading && [1,2,3].map(i => <div key={i} className="skel" style={{ height:110, marginBottom:10, borderRadius:14 }} />)}

        {!loading && filtered.length === 0 && (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Sin resultados</div><div className="empty-sub">{filter==='all'?'Aún no tienes reservas. ¡Empieza reservando!':'No hay reservas en esta categoría.'}</div></div>
        )}

        {!loading && filtered.map(item => {
          const isPast = new Date(item.date) < now
          return (
            <div key={`${item.source}-${item.id}`} className={`cita-card ${isPast?'past':''}`}>
              <div className="cita-top">
                <span className={`cita-tipo ${item.type}`}>{item.typeLabel}</span>
                <span className={`cita-st ${item.status}`}>{STATUS_LABEL[item.status]||item.status}</span>
              </div>
              <div className="cita-name">{item.name}</div>
              <div className="cita-date">{fDT(item.date)}</div>
              {item.pro && <div className="cita-pro">{item.pro}</div>}
              <div className="cita-actions">
                <button className="cita-act-btn" style={{ background:'var(--green-subtle)', color:'var(--green-dark)' }} onClick={() => setDetailItem(item)}>Ver detalle</button>
                {canCancel(item) && <button className="cita-act-btn cita-act-cancel" onClick={() => setToCancel(item)}>Cancelar</button>}
              </div>
            </div>
          )
        })}
      </main>

      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{detailItem.name}</div>
            <div style={{ marginBottom:20 }}>
              {[
                ['Tipo',        <span className={`cita-tipo ${detailItem.type}`}>{detailItem.typeLabel}</span>],
                ['Estado',      <span className={`cita-st ${detailItem.status}`}>{STATUS_LABEL[detailItem.status]||detailItem.status}</span>],
                ['Fecha',       fDT(detailItem.date)],
                detailItem.pro ? ['Profesional', detailItem.pro] : null,
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} className="perfil-item" style={{ padding:'12px 0' }}>
                  <span className="perfil-item-label">{label}</span>
                  <span className="perfil-item-value">{val}</span>
                </div>
              ))}
            </div>
            {canCancel(detailItem) && (
              <button className="modal-btn-confirm" style={{ marginBottom:10 }} onClick={() => { setDetailItem(null); setToCancel(detailItem) }}>
                Cancelar esta cita
              </button>
            )}
            <button className="modal-btn-back" onClick={() => setDetailItem(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {toCancel && (
        <div className="modal-overlay" onClick={() => setToCancel(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">¿Cancelar esta cita?</div>
            <div className="modal-sub">
              {toCancel.name} · {fDT(toCancel.date)}<br />Esta acción no se puede deshacer.
            </div>
            <button className="modal-btn-confirm" onClick={cancel} disabled={cancelling}>
              {cancelling ? 'Cancelando…' : 'Sí, cancelar cita'}
            </button>
            <button className="modal-btn-back" onClick={() => setToCancel(null)}>Volver</button>
          </div>
        </div>
      )}

      <BottomNav page="mis-reservas" onNav={onNav} />
    </div>
  )
}

// ─── Perfil ───────────────────────────────────────────────────────────────────
function PerfilPage({ patient, onNav, onLogout, onPatientUpdate }) {
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ full_name: patient?.full_name||'', phone: patient?.phone||'' })
  const [whatsapp, setWhatsapp] = useState(patient?.whatsapp_notifications ?? true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [completed,setCompleted]= useState(null)
  const [memberSince, setMemberSince] = useState(patient?.created_at || null)

  useEffect(() => {
    if (!patient?.id) return
    sb.from('appointments').select('id', { count:'exact', head:true }).eq('patient_id', patient.id).eq('status','completed')
      .then(({ count }) => setCompleted(count || 0))
  }, [patient?.id])

  const upd = e => setForm(f => ({...f, [e.target.name]: e.target.value}))

  const save = async () => {
    if (!patient?.id || !form.full_name.trim()) return
    setSaving(true)
    const { error } = await sb.from('patients').update({
      full_name: form.full_name.trim(),
      phone:     form.phone.trim(),
      whatsapp_notifications: whatsapp,
    }).eq('id', patient.id)
    if (error) {
      setToast({ msg:'No se pudo guardar los cambios.', type:'error' })
    } else {
      onPatientUpdate({ ...patient, full_name:form.full_name.trim(), phone:form.phone.trim(), whatsapp_notifications:whatsapp })
      setToast({ msg:'Perfil actualizado ✓', type:'ok' })
      setEditing(false)
    }
    setSaving(false)
  }

  const toggleWhatsapp = async (val) => {
    if (!patient?.id) return
    setWhatsapp(val)
    await sb.from('patients').update({ whatsapp_notifications: val }).eq('id', patient.id)
  }

  return (
    <div className="screen">
      <header className="green-header">
        <div className="green-header-inner">
          <div className="perfil-avatar">{initials(patient?.full_name)}</div>
          <div className="perfil-name">{patient?.full_name || 'Paciente'}</div>
          <div className="perfil-phone">{patient?.phone || ''}</div>
        </div>
      </header>
      <main className="green-body">

        {/* Stats */}
        <div className="stat-row">
          <div className="stat-box" style={{ background:'var(--green-subtle)', border:'1px solid var(--border)' }}>
            <div className="stat-box-val" style={{ color:'var(--green-dark)' }}>{completed ?? '…'}</div>
            <div className="stat-box-lbl" style={{ color:'var(--text-muted)' }}>Citas realizadas</div>
          </div>
          {memberSince && (
            <div className="stat-box" style={{ background:'var(--gold-light)', border:'1px solid #e6d09a' }}>
              <div className="stat-box-val" style={{ fontSize:15, color:'#7a5c10' }}>
                {new Date(memberSince).toLocaleDateString('es-ES', { month:'short', year:'numeric' })}
              </div>
              <div className="stat-box-lbl" style={{ color:'#9a7c30' }}>Miembro desde</div>
            </div>
          )}
        </div>

        {/* Edit / display */}
        <p className="section-label">Mi cuenta</p>
        {editing ? (
          <>
            <div className="perfil-field">
              <label>Nombre completo</label>
              <input name="full_name" value={form.full_name} onChange={upd} placeholder="Tu nombre" autoFocus />
            </div>
            <div className="perfil-field">
              <label>Teléfono</label>
              <input name="phone" type="tel" value={form.phone} onChange={upd} placeholder="612 345 678" />
            </div>
            <button className="perfil-save-btn" onClick={save} disabled={saving || !form.full_name.trim()}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button className="perfil-edit-btn" onClick={() => { setEditing(false); setForm({ full_name:patient?.full_name||'', phone:patient?.phone||'' }) }}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <div style={{ background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', overflow:'hidden', marginBottom:8 }}>
              {[
                { label:'Nombre',   value:patient?.full_name || '—' },
                { label:'Teléfono', value:patient?.phone || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="perfil-item" style={{ padding:'14px 16px' }}>
                  <span className="perfil-item-label">{label}</span>
                  <span className="perfil-item-value">{value}</span>
                </div>
              ))}
            </div>
            <button className="perfil-edit-btn" onClick={() => setEditing(true)}>
              ✏️ Editar perfil
            </button>
          </>
        )}

        {/* WhatsApp toggle */}
        <div className="wapp-row">
          <div>
            <div className="wapp-label">📱 Avisos por WhatsApp</div>
            <div className="wapp-sub">Recordatorios de citas</div>
          </div>
          <button
            className="toggle-track"
            style={{ background: whatsapp ? 'var(--green)' : 'var(--border)' }}
            onClick={() => toggleWhatsapp(!whatsapp)}
          >
            <div className="toggle-thumb" style={{ left: whatsapp ? 23 : 3 }} />
          </button>
        </div>

        <button className="perfil-logout" onClick={onLogout}>Cerrar sesión</button>
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav page="perfil" onNav={onNav} />
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,     setUser]     = useState(null)
  const [patient,  setPatient]  = useState(null)
  const [authLoad, setAuthLoad] = useState(true)
  const [page,     setPage]     = useState('home')
  const [selPro,   setSelPro]   = useState(null)  // selected professional for osteo calendar

  // Auth
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u || null)
      if (u) fetchPatient(u.id)
      else setAuthLoad(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_, session) => {
      const u = session?.user
      setUser(u || null)
      if (u) fetchPatient(u.id)
      else { setPatient(null); setAuthLoad(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchPatient = async (uid) => {
    const { data } = await sb.from('patients').select('*').eq('id', uid).single()
    setPatient(data)
    setAuthLoad(false)
  }

  const logout = async () => {
    await sb.auth.signOut()
    setUser(null); setPatient(null); setPage('home'); setSelPro(null)
  }

  const updatePatient = (updated) => {
    setPatient(updated)
  }

  const nav = (p) => {
    if (p === 'reservar') { setPage('osteopatia'); return }  // Reservar → Osteopatía by default
    setPage(p)
  }

  const renderPage = () => {
    if (authLoad) return (
      <div style={{ minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'var(--green)' }}>Cargando…</div>
      </div>
    )
    if (!user) return <LoginPage onLogin={u => { setUser(u); fetchPatient(u.id) }} />

    switch (page) {
      case 'home':        return <HomePage patient={patient} onNav={nav} />
      case 'osteopatia':  return selPro
        ? <OsteopatiaCalendarPage pro={selPro} patient={patient} onNav={nav} onBack={() => setSelPro(null)} />
        : <OsteopatiaPage onNav={nav} onSelectPro={p => setSelPro(p)} />
      case 'yoga':        return <YogaPage patient={patient} onNav={nav} />
      case 'belleza':     return <BellezaPage patient={patient} onNav={nav} />
      case 'mis-reservas':return <MisReservasPage patient={patient} onNav={nav} />
      case 'perfil':      return <PerfilPage patient={patient} onNav={nav} onLogout={logout} onPatientUpdate={updatePatient} />
      default:            return <HomePage patient={patient} onNav={nav} />
    }
  }

  return <div className="app-wrap">{renderPage()}</div>
}
