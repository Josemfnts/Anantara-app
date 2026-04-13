import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useCallback } from 'react'

// ─── Supabase ────────────────────────────────────────────────────────────────
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storageKey: 'anantara-app' } }
)

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  :root {
    --green-dark:   #1d5c2e;
    --green:        #2d7a3f;
    --green-light:  #3a9150;
    --green-subtle: #e8f4eb;
    --gold:         #C8A535;
    --gold-light:   #f5e8a3;
    --purple:       #7a52b0;
    --purple-light: #ede8f7;
    --bg:           #f0f5f0;
    --white:        #ffffff;
    --text:         #1a2e1d;
    --text2:        #3d5c42;
    --text-muted:   #7a9c80;
    --border:       #d4e6d8;
    --radius:       10px;
    --radius-lg:    14px;
    --shadow:       0 2px 12px rgba(29,92,46,.10);
    --shadow-lg:    0 6px 24px rgba(29,92,46,.15);
  }
  body { font-family:'Inter',system-ui,sans-serif; background:var(--bg); color:var(--text); font-size:14px; line-height:1.5; -webkit-font-smoothing:antialiased }
  button,input,select,textarea { font-family:inherit }

  /* ── Screen wrapper ── */
  .screen { min-height:100svh; display:flex; flex-direction:column; background:var(--bg); padding-bottom:calc(60px + env(safe-area-inset-bottom)) }

  /* ── Green header ── */
  .green-header { background:linear-gradient(160deg,var(--green-dark),var(--green)); padding:env(safe-area-inset-top,16px) 20px 64px; position:relative }
  .green-header-inner { padding-top:16px }
  .green-body { background:var(--white); border-radius:24px 24px 0 0; margin-top:-28px; padding:22px 20px; flex:1 }

  /* ── Auth screen ── */
  .auth-screen { min-height:100svh; display:flex; flex-direction:column; background:linear-gradient(160deg,var(--green-dark),var(--green)) }
  .auth-hero { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 24px 32px }
  .auth-logo { width:72px; height:72px; border-radius:50%; background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.3); display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:#fff; margin-bottom:16px }
  .auth-brand { font-size:26px; font-weight:900; letter-spacing:4px; color:#fff }
  .auth-tagline { font-size:14px; color:rgba(255,255,255,.7); margin-top:6px; letter-spacing:.08em }
  .auth-card { background:var(--white); border-radius:28px 28px 0 0; padding:28px 24px calc(24px + env(safe-area-inset-bottom)); margin-top:auto }
  .auth-tabs { display:flex; background:var(--bg); border-radius:10px; padding:3px; margin-bottom:20px }
  .auth-tabs button { flex:1; padding:8px; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; background:transparent; color:var(--text-muted); transition:all .15s }
  .auth-tabs button.active { background:var(--white); color:var(--green); box-shadow:0 1px 6px rgba(0,0,0,.1) }
  .auth-btn { width:100%; padding:14px; background:var(--green); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; margin-top:4px; transition:background .15s }
  .auth-btn:hover:not(:disabled) { background:var(--green-dark) }
  .auth-btn:disabled { opacity:.5 }
  .auth-err { background:#fee2e2; border:1px solid #fecaca; color:#dc2626; font-size:12px; padding:10px 14px; border-radius:10px; margin-bottom:14px; text-align:center }
  .auth-field { margin-bottom:14px }
  .auth-field label { display:block; font-size:12px; font-weight:700; color:var(--text2); margin-bottom:5px }
  .auth-field input { width:100%; padding:12px 14px; border:1.5px solid var(--border); border-radius:10px; font-size:14px; color:var(--text); background:var(--white); outline:none; transition:border-color .15s }
  .auth-field input:focus { border-color:var(--green) }

  /* ── Bottom Nav ── */
  .bottom-nav { position:fixed; bottom:0; left:0; right:0; height:calc(60px + env(safe-area-inset-bottom)); background:var(--white); border-top:1px solid var(--border); display:flex; align-items:flex-start; padding-top:6px; z-index:100; box-shadow:0 -2px 12px rgba(0,0,0,.06) }
  .bnav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:4px 0; border:none; background:none; cursor:pointer; color:var(--text-muted); transition:color .15s; font-size:10px; font-weight:600 }
  .bnav-item.active { color:var(--green) }
  .bnav-icon { font-size:22px; line-height:1 }
  .bnav-item.active .bnav-icon { filter:drop-shadow(0 1px 3px rgba(45,122,63,.35)) }

  /* ── Home header ── */
  .home-top-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px }
  .home-avatar { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.25); border:1.5px solid rgba(255,255,255,.5); color:#fff; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center }
  .home-brand { font-size:12px; font-weight:800; letter-spacing:3px; color:rgba(255,255,255,.9) }
  .home-bell { background:none; border:none; font-size:20px; cursor:pointer; padding:2px; color:rgba(255,255,255,.9) }
  .home-greeting { font-size:13px; color:rgba(255,255,255,.65); margin-bottom:4px }
  .home-name { font-size:24px; font-weight:900; color:#fff; margin-bottom:16px }
  .next-cita-card { background:rgba(255,255,255,.15); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.25); border-radius:var(--radius-lg); padding:14px 16px; cursor:pointer; transition:background .15s }
  .next-cita-card:hover { background:rgba(255,255,255,.22) }
  .next-cita-label { font-size:10px; font-weight:700; letter-spacing:.08em; color:rgba(255,255,255,.6); text-transform:uppercase; margin-bottom:4px }
  .next-cita-name { font-size:15px; font-weight:800; color:#fff }
  .next-cita-date { font-size:12px; color:rgba(255,255,255,.75); margin-top:3px }
  .no-cita { background:rgba(255,255,255,.1); border:1px dashed rgba(255,255,255,.3); border-radius:var(--radius-lg); padding:12px 16px; font-size:13px; color:rgba(255,255,255,.65); text-align:center }

  /* ── Home services grid ── */
  .section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:12px }
  .services-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px }
  .service-card { display:flex; flex-direction:column; gap:4px; padding:18px 16px; border-radius:var(--radius-lg); cursor:pointer; border:none; text-align:left; transition:transform .15s, box-shadow .15s; position:relative; overflow:hidden }
  .service-card:active { transform:scale(.97) }
  .service-card.osteo   { background:linear-gradient(135deg,var(--green-dark),var(--green-light)); color:#fff }
  .service-card.yoga    { background:linear-gradient(135deg,#1a547a,#2e82b8); color:#fff }
  .service-card.belleza { background:linear-gradient(135deg,var(--purple),#9b6dd6); color:#fff }
  .service-card.citas   { background:linear-gradient(135deg,#9a7a20,var(--gold)); color:#fff }
  .service-icon { font-size:28px; margin-bottom:4px }
  .service-name { font-size:15px; font-weight:800 }
  .service-sub  { font-size:11px; opacity:.75 }

  /* ── Recent list ── */
  .recent-item { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg); border-radius:var(--radius-lg); margin-bottom:8px; cursor:pointer; border:none; width:100%; text-align:left }
  .recent-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0 }
  .recent-dot.osteo   { background:var(--green) }
  .recent-dot.yoga    { background:#2e82b8 }
  .recent-dot.belleza { background:var(--purple) }
  .recent-info { flex:1; min-width:0 }
  .recent-name { font-size:13px; font-weight:700; color:var(--text); overflow:hidden; white-space:nowrap; text-overflow:ellipsis }
  .recent-date { font-size:11px; color:var(--text-muted); margin-top:1px }
  .recent-status-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; flex-shrink:0 }
  .recent-status-badge.confirmed { background:var(--green-subtle); color:var(--green-dark) }
  .recent-status-badge.pending   { background:var(--gold-light);   color:#7a5c10 }
  .recent-status-badge.cancelled { background:#fee2e2; color:#dc2626 }
  .recent-status-badge.completed { background:#f1f5f9; color:#64748b }
  .no-recent { text-align:center; padding:24px 0; color:var(--text-muted); font-size:13px }

  /* ── Page header (back nav) ── */
  .page-back { background:none; border:none; font-size:14px; font-weight:700; color:rgba(255,255,255,.85); cursor:pointer; padding:0; display:flex; align-items:center; gap:4px; margin-bottom:10px }
  .page-htitle { font-size:22px; font-weight:900; color:#fff }
  .page-hsub   { font-size:14px; color:rgba(255,255,255,.7); margin-top:4px }

  /* ── Professional cards ── */
  .pro-card { display:flex; align-items:center; gap:14px; padding:16px; background:var(--white); border-radius:var(--radius-lg); border:2px solid var(--border); margin-bottom:10px; cursor:pointer; transition:border-color .15s }
  .pro-card.selected { border-color:var(--green); background:var(--green-subtle) }
  .pro-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#fff; flex-shrink:0 }
  .pro-avatar.green  { background:linear-gradient(135deg,var(--green-dark),var(--green-light)) }
  .pro-avatar.blue   { background:linear-gradient(135deg,#1a547a,#2e82b8) }
  .pro-avatar.gold   { background:linear-gradient(135deg,#9a7a20,var(--gold)) }
  .pro-info { flex:1 }
  .pro-name  { font-size:14px; font-weight:800; color:var(--text) }
  .pro-spec  { font-size:12px; color:var(--text-muted); margin-top:2px }
  .pro-avail { font-size:11px; font-weight:700; color:var(--green); margin-top:4px; display:block }
  .pro-check { font-size:18px; color:var(--green); opacity:0; transition:opacity .15s }
  .pro-card.selected .pro-check { opacity:1 }
  .pro-err   { color:#dc2626; font-size:13px; text-align:center; padding:12px 0 }

  /* ── Calendar ── */
  .cal-month-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px }
  .cal-month-name { font-size:15px; font-weight:800; color:var(--text); text-transform:capitalize }
  .cal-nav-btn { background:none; border:1.5px solid var(--border); border-radius:8px; width:32px; height:32px; font-size:16px; cursor:pointer; color:var(--text); transition:border-color .15s }
  .cal-nav-btn:hover:not(:disabled) { border-color:var(--green); color:var(--green) }
  .cal-nav-btn:disabled { opacity:.35; cursor:default }
  .cal-day-labels { display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:6px }
  .cal-day-lbl { text-align:center; font-size:11px; font-weight:700; color:var(--text-muted) }
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:16px }
  .cal-day-cell { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:10px; font-size:13px; font-weight:600; cursor:default; color:var(--text-muted); transition:all .15s }
  .cal-day-cell.available { background:var(--green-subtle); color:var(--green-dark); cursor:pointer; font-weight:800 }
  .cal-day-cell.available:hover { background:var(--green); color:#fff }
  .cal-day-cell.available.today { border:2px solid var(--green); color:var(--green-dark) }
  .cal-day-cell.available.today:hover { color:#fff }
  .cal-day-cell.selected { background:var(--green); color:#fff }

  /* ── Time slots ── */
  .slots-section-title { font-size:13px; font-weight:800; color:var(--text); margin-bottom:10px }
  .slots-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px }
  .slot-btn { padding:10px 4px; border:1.5px solid var(--border); border-radius:10px; font-size:12px; font-weight:700; background:var(--white); color:var(--text); cursor:pointer; transition:all .15s }
  .slot-btn:hover:not(:disabled):not(.taken) { border-color:var(--green); color:var(--green) }
  .slot-btn.selected { background:var(--green); color:#fff; border-color:var(--green) }
  .slot-btn.taken { opacity:.35; cursor:default; text-decoration:line-through }
  .confirm-banner { display:flex; align-items:center; gap:10px; background:var(--green-subtle); border:1.5px solid var(--green); border-radius:12px; padding:12px 16px; margin-bottom:12px }
  .confirm-banner-text { font-size:13px; font-weight:700; color:var(--green-dark) }
  .no-slots { font-size:13px; color:var(--text-muted); text-align:center; padding:20px 0 }

  /* ── Main action button ── */
  .main-btn { width:100%; padding:15px; background:var(--green); color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:800; cursor:pointer; transition:background .15s; margin-top:8px }
  .main-btn:hover:not(:disabled) { background:var(--green-dark) }
  .main-btn:disabled { opacity:.4; cursor:default }

  /* ── Success screen ── */
  .success-screen { min-height:100svh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px 24px; text-align:center; background:var(--white) }
  .success-icon  { font-size:64px; margin-bottom:16px }
  .success-title { font-size:24px; font-weight:900; color:var(--green-dark); margin-bottom:10px }
  .success-sub   { font-size:14px; color:var(--text-muted); margin-bottom:32px; line-height:1.7 }

  /* ── Class card (yoga/belleza) ── */
  .class-card { background:var(--white); border-radius:var(--radius-lg); border:1px solid var(--border); overflow:hidden; margin-bottom:12px }
  .class-card-hero { height:72px; display:flex; align-items:center; justify-content:center; font-size:36px }
  .class-hero-green  { background:linear-gradient(135deg,var(--green-dark),var(--green-light)) }
  .class-hero-blue   { background:linear-gradient(135deg,#1a547a,#2e82b8) }
  .class-hero-purple { background:linear-gradient(135deg,var(--purple),#9b6dd6) }
  .class-hero-gray   { background:linear-gradient(135deg,#94a3b8,#cbd5e1) }
  .class-card-body { padding:14px 16px }
  .class-name { font-size:15px; font-weight:800; color:var(--text); margin-bottom:4px }
  .class-date { font-size:12px; color:var(--text-muted); margin-bottom:10px }
  .class-footer { display:flex; align-items:center; justify-content:space-between }
  .places-tag { font-size:12px; font-weight:700; color:var(--text2) }
  .places-urgent { color:#dc7a1d }
  .full-tag { font-size:12px; font-weight:700; color:#dc2626; background:#fee2e2; padding:3px 10px; border-radius:99px }
  .class-btn { padding:9px 18px; border:none; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; background:var(--green); color:#fff; transition:background .15s }
  .class-btn:hover:not(:disabled) { background:var(--green-dark) }
  .class-btn.booked { background:var(--green-subtle); color:var(--green-dark); cursor:default }

  /* ── Toast ── */
  .toast { position:fixed; bottom:calc(76px + env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%); background:var(--green-dark); color:#fff; padding:12px 24px; border-radius:99px; font-size:13px; font-weight:700; z-index:200; white-space:nowrap; animation:slideUp .2s ease; box-shadow:var(--shadow-lg) }
  .toast.error { background:#dc2626 }
  @keyframes slideUp { from{transform:translateX(-50%) translateY(12px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }

  /* ── Mis Reservas ── */
  .filter-bar { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:16px; scrollbar-width:none }
  .filter-bar::-webkit-scrollbar { display:none }
  .filter-btn { flex-shrink:0; padding:7px 14px; border-radius:99px; border:1.5px solid var(--border); font-size:12px; font-weight:700; cursor:pointer; background:var(--white); color:var(--text-muted); transition:all .15s }
  .filter-btn.active { background:var(--green); border-color:var(--green); color:#fff }
  .cita-card { background:var(--white); border-radius:var(--radius-lg); border:1px solid var(--border); padding:16px; margin-bottom:10px }
  .cita-card.past { opacity:.7 }
  .cita-top { display:flex; justify-content:space-between; margin-bottom:8px }
  .cita-tipo { font-size:11px; font-weight:700; padding:2px 10px; border-radius:99px }
  .cita-tipo.osteo   { background:var(--green-subtle); color:var(--green-dark) }
  .cita-tipo.yoga    { background:#e8f4f8; color:#1a547a }
  .cita-tipo.belleza { background:var(--purple-light); color:var(--purple) }
  .cita-st { font-size:11px; font-weight:700; padding:2px 10px; border-radius:99px }
  .cita-st.confirmed { background:var(--green-subtle); color:var(--green-dark) }
  .cita-st.pending   { background:var(--gold-light); color:#7a5c10 }
  .cita-st.completed { background:#f1f5f9; color:#64748b }
  .cita-st.cancelled { background:#fee2e2; color:#dc2626 }
  .cita-name { font-size:15px; font-weight:800; color:var(--text); margin-bottom:4px }
  .cita-date { font-size:12px; color:var(--text-muted) }
  .cita-pro  { font-size:12px; color:var(--text2); margin-top:3px }
  .cita-actions { display:flex; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid var(--border) }
  .cita-act-btn { flex:1; padding:9px; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer }
  .cita-act-cancel { background:#fee2e2; color:#dc2626 }
  .cita-act-cancel:hover { background:#fecaca }

  /* ── Cancel modal ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:flex-end; z-index:200; padding:0 }
  .modal-sheet { background:var(--white); border-radius:24px 24px 0 0; padding:28px 24px calc(32px + env(safe-area-inset-bottom)); width:100%; box-shadow:var(--shadow-lg) }
  .modal-handle { width:36px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 20px }
  .modal-title { font-size:17px; font-weight:800; color:var(--text); margin-bottom:8px }
  .modal-sub { font-size:13px; color:var(--text-muted); margin-bottom:20px; line-height:1.6 }
  .modal-btn-confirm { width:100%; padding:14px; background:#dc2626; color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; margin-bottom:10px }
  .modal-btn-back { width:100%; padding:14px; background:var(--bg); color:var(--text); border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer }

  /* ── Perfil ── */
  .perfil-avatar { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,var(--green-dark),var(--green-light)); color:#fff; font-size:24px; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 12px }
  .perfil-name   { font-size:20px; font-weight:900; color:#fff; text-align:center }
  .perfil-phone  { font-size:14px; color:rgba(255,255,255,.7); text-align:center; margin-top:4px }
  .perfil-item   { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid var(--border) }
  .perfil-item:last-child { border-bottom:none }
  .perfil-item-label { font-size:14px; color:var(--text) }
  .perfil-item-value { font-size:13px; color:var(--text-muted) }
  .perfil-logout { width:100%; padding:14px; background:#fee2e2; color:#dc2626; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; margin-top:20px }

  /* ── Skeleton ── */
  .skel { background:linear-gradient(90deg,#e8f0ea 25%,#f0f5f0 50%,#e8f0ea 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Empty ── */
  .empty-state { text-align:center; padding:40px 20px; color:var(--text-muted) }
  .empty-icon  { font-size:36px; margin-bottom:10px }
  .empty-title { font-size:15px; font-weight:700; color:var(--text2); margin-bottom:4px }
  .empty-sub   { font-size:13px }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const MONTH_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const WEEK_DAYS = ['L','M','X','J','V','S','D']
const WEEK_LONG = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function pad(n) { return String(n).padStart(2,'0') }
function toK(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }

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
    const now = new Date().toISOString()

    // Next appointment
    sb.from('appointments')
      .select('start_time,services(name),professionals(full_name)')
      .eq('patient_id', patient.id).eq('status','confirmed').gte('start_time', now)
      .order('start_time').limit(1)
      .then(async ({ data: appts }) => {
        if (appts?.length) {
          const a = appts[0]
          setNextAppt({ date:a.start_time, name:[a.services?.name,a.professionals?.full_name].filter(Boolean).join(' · ') || 'Osteopatía' })
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
      sb.from('appointments').select('id,start_time,status,services(name),professionals(full_name)').eq('patient_id',patient.id).order('start_time',{ascending:false}).limit(4),
      sb.from('bookings').select('id,status,created_at,availability_slots(start_time,services(name))').eq('patient_id',patient.id).order('created_at',{ascending:false}).limit(4),
    ]).then(([{ data:a }, { data:b }]) => {
      const ai = (a||[]).map(x => ({ id:`a-${x.id}`, type:'osteo', name:x.services?.name||'Osteopatía', pro:x.professionals?.full_name, date:x.start_time, status:x.status }))
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
    sb.from('professionals').select('id,full_name,specialty,bio').eq('active',true).order('full_name')
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
            <div className={`pro-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{initials(pro.full_name)}</div>
            <div className="pro-info">
              <div className="pro-name">{pro.full_name}</div>
              <div className="pro-spec">{pro.specialty || 'Osteópata'}</div>
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
      const { data: existing } = await sb.from('appointments').select('start_time')
        .eq('professional_id',pro.id).gte('start_time',ds+'T00:00:00').lte('start_time',ds+'T23:59:59').neq('status','cancelled')
      const taken = new Set((existing||[]).map(a => a.start_time.slice(11,16)))
      const hours = [9,10,11,12,13,16,17,18]
      setSlots(hours.map(h => ({ time:`${pad(h)}:00`, available:!taken.has(`${pad(h)}:00`) })))
    }
    setSlLoad(false)
  }

  const confirm = async () => {
    if (!selDate || !selSlot || !patient?.id) return
    setConfirming(true); setErr('')
    const startDT = new Date(`${selDate}T${selSlot}:00`)
    const { error } = await sb.from('appointments').insert({
      patient_id: patient.id,
      professional_id: pro.id,
      start_time: startDT.toISOString(),
      status: 'confirmed',
    })
    if (error) { setErr(error.message || 'No se pudo crear la cita.') }
    else { setConfirmed(true) }
    setConfirming(false)
  }

  if (confirmed) {
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <div className="success-title">¡Cita reservada!</div>
        <p className="success-sub">{selDate} a las {selSlot}h<br />con {pro.full_name}</p>
        <button className="main-btn" style={{ width:'auto', padding:'14px 32px' }} onClick={() => onNav('mis-reservas')}>
          Ver mis citas
        </button>
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
          <button className="page-back" onClick={onBack}>‹ {pro.full_name}</button>
          <div className="page-htitle">Elige tu cita</div>
          <div className="page-hsub">{pro.specialty || 'Osteopatía'}</div>
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
    const now = new Date().toISOString()
    sb.from('availability_slots')
      .select('*,services(name),bookings(id)')
      .eq('published',true).gte('start_time',now).order('start_time').limit(20)
      .then(({ data, error }) => {
        if (error) { setErr('No se pudieron cargar las clases.') }
        else {
          const yoga = (data||[]).filter(s => (s.services?.name||'').toLowerCase().includes('yoga'))
          setSlots(yoga.length > 0 ? yoga : (data||[]))
        }
        setLoading(false)
      })
    if (patient?.id) {
      sb.from('bookings').select('slot_id').eq('patient_id',patient.id).neq('status','cancelled')
        .then(({ data }) => setBooked(new Set((data||[]).map(b => b.slot_id))))
    }
  }, [patient?.id])

  const book = async (slot) => {
    if (!patient?.id) return
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
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [booked,  setBooked]  = useState(new Set())
  const [toast,   setToast]   = useState(null)

  useEffect(() => {
    const now = new Date().toISOString()
    sb.from('availability_slots')
      .select('*,services(name),bookings(id)')
      .eq('published',true).gte('start_time',now).order('start_time').limit(20)
      .then(({ data }) => {
        const belleza = (data||[]).filter(s => {
          const n = (s.services?.name||'').toLowerCase()
          return n.includes('belleza') || n.includes('facial') || n.includes('masaje') || n.includes('tratamiento')
        })
        setSlots(belleza); setLoading(false)
      })
    if (patient?.id) {
      sb.from('bookings').select('slot_id').eq('patient_id',patient.id).neq('status','cancelled')
        .then(({ data }) => setBooked(new Set((data||[]).map(b => b.slot_id))))
    }
  }, [patient?.id])

  const book = async (slot) => {
    if (!patient?.id) return
    const { error } = await sb.from('bookings').insert({ patient_id:patient.id, slot_id:slot.id, status:'confirmed' })
    if (error) { setToast({ msg:'No se pudo reservar.', type:'error' }); return }
    setBooked(prev => new Set([...prev, slot.id]))
    setToast({ msg:`¡Reserva de ${slot.services?.name||'tratamiento'} confirmada! ✓`, type:'ok' })
  }

  return (
    <div className="screen">
      <header className="green-header" style={{ background:'linear-gradient(160deg,var(--purple),#9b6dd6)' }}>
        <div className="green-header-inner">
          <button className="page-back" onClick={() => onNav('home')}>‹ Inicio</button>
          <div className="page-htitle">Belleza</div>
          <div className="page-hsub">Tratamientos y servicios</div>
        </div>
      </header>
      <main className="green-body">
        <p className="section-label">Disponibles</p>
        {loading && <><div className="skel" style={{ height:160, marginBottom:12, borderRadius:14 }} /></>}
        {!loading && slots.length === 0 && (
          <div className="empty-state"><div className="empty-icon">✨</div><div className="empty-title">Sin tratamientos próximos</div><div className="empty-sub">Vuelve pronto</div></div>
        )}
        {slots.map(slot => {
          const bookedCount = Array.isArray(slot.bookings) ? slot.bookings.length : 0
          const cap  = slot.capacity || 10; const free = cap - bookedCount; const full = free <= 0; const isB = booked.has(slot.id)
          return (
            <div key={slot.id} className="class-card">
              <div className={`class-card-hero class-hero-${full?'gray':'purple'}`}>✨</div>
              <div className="class-card-body">
                <div className="class-name">{slot.services?.name || 'Tratamiento'}</div>
                <div className="class-date">{fDT(slot.start_time)}</div>
                <div className="class-footer">
                  <span>{full ? <span className="full-tag">Completo</span> : <span className="places-tag"><strong>{free}</strong> plaza{free!==1?'s':''}</span>}</span>
                  {!full && (
                    <button className={`class-btn ${isB?'booked':''}`} onClick={() => !isB && book(slot)} disabled={isB}>
                      {isB ? 'Reservado ✓' : 'Reservar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <BottomNav page="belleza" onNav={onNav} />
    </div>
  )
}

// ─── Mis Reservas ─────────────────────────────────────────────────────────────
function MisReservasPage({ patient, onNav }) {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [toCancel, setToCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const FILTERS = [['all','Todas'],['upcoming','Próximas'],['past','Pasadas'],['cancelled','Canceladas']]

  const load = useCallback(async () => {
    if (!patient?.id) return
    setLoading(true)
    const [{ data:a }, { data:b }] = await Promise.all([
      sb.from('appointments').select('id,start_time,status,services(name),professionals(full_name)').eq('patient_id',patient.id).order('start_time',{ascending:false}),
      sb.from('bookings').select('id,status,created_at,slot_id,availability_slots(start_time,services(name),professionals(full_name))').eq('patient_id',patient.id).order('created_at',{ascending:false}),
    ])
    const ai = (a||[]).map(x => ({ id:x.id, type:'osteo', typeLabel:'Osteopatía', name:x.services?.name||'Osteopatía', pro:x.professionals?.full_name, date:x.start_time, status:x.status||'pending', source:'appointment' }))
    const bi = (b||[]).map(x => {
      const n = x.availability_slots?.services?.name||''; const isY = n.toLowerCase().includes('yoga')
      return { id:x.id, type:isY?'yoga':'belleza', typeLabel:isY?'Yoga':'Belleza', name:n||'Clase', pro:x.availability_slots?.professionals?.full_name, date:x.availability_slots?.start_time||x.created_at, status:x.status||'pending', source:'booking' }
    })
    setItems([...ai,...bi].sort((x,y) => new Date(y.date)-new Date(x.date)))
    setLoading(false)
  }, [patient?.id])

  useEffect(() => { load() }, [load])

  const cancel = async () => {
    if (!toCancel) return; setCancelling(true)
    const table = toCancel.source === 'appointment' ? 'appointments' : 'bookings'
    await sb.from(table).update({ status:'cancelled' }).eq('id', toCancel.id)
    setItems(prev => prev.map(i => i.id===toCancel.id && i.source===toCancel.source ? {...i,status:'cancelled'} : i))
    setCancelling(false); setToCancel(null)
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
              {canCancel(item) && (
                <div className="cita-actions">
                  <button className="cita-act-btn cita-act-cancel" onClick={() => setToCancel(item)}>Cancelar cita</button>
                </div>
              )}
            </div>
          )
        })}
      </main>

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
function PerfilPage({ patient, onNav, onLogout }) {
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
        <p className="section-label">Mi cuenta</p>
        <div style={{ background:'var(--white)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', overflow:'hidden' }}>
          {[
            { label:'Nombre', value:patient?.full_name || '—' },
            { label:'Teléfono', value:patient?.phone || '—' },
            { label:'Email', value:patient?.email || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="perfil-item" style={{ padding:'14px 16px' }}>
              <span className="perfil-item-label">{label}</span>
              <span className="perfil-item-value">{value}</span>
            </div>
          ))}
        </div>
        <button className="perfil-logout" onClick={onLogout}>Cerrar sesión</button>
      </main>
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

  // Inject CSS
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

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
    setUser(null); setPatient(null); setPage('home')
  }

  const nav = (p) => {
    if (p === 'reservar') { setPage('osteopatia'); return }  // Reservar → Osteopatía by default
    setPage(p)
  }

  if (authLoad) return (
    <div style={{ minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', fontFamily:'sans-serif' }}>
      <div style={{ color:'var(--green)' }}>Cargando…</div>
    </div>
  )

  if (!user) return <LoginPage onLogin={u => { setUser(u); fetchPatient(u.id) }} />

  switch (page) {
    case 'home':
      return <HomePage patient={patient} onNav={nav} />

    case 'osteopatia':
      return selPro
        ? <OsteopatiaCalendarPage pro={selPro} patient={patient} onNav={nav} onBack={() => setSelPro(null)} />
        : <OsteopatiaPage onNav={nav} onSelectPro={p => setSelPro(p)} />

    case 'yoga':
      return <YogaPage patient={patient} onNav={nav} />

    case 'belleza':
      return <BellezaPage patient={patient} onNav={nav} />

    case 'mis-reservas':
      return <MisReservasPage patient={patient} onNav={nav} />

    case 'perfil':
      return <PerfilPage patient={patient} onNav={nav} onLogout={logout} />

    default:
      return <HomePage patient={patient} onNav={nav} />
  }
}
