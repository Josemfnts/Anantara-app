import { Link, useLocation } from 'react-router-dom'
import './BottomNav.css'

const NAV_ITEMS = [
  { label: 'Inicio',    icon: '🏠', path: '/' },
  { label: 'Reservar',  icon: '📅', path: '/reservar' },
  { label: 'Mis citas', icon: '📋', path: '/mis-reservas' },
  { label: 'Perfil',    icon: '👤', path: '/perfil' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  function isActive(path) {
    if (path === '/' || path === '/reservar') return pathname === '/' || pathname === '/reservar'
    return pathname.startsWith(path)
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
