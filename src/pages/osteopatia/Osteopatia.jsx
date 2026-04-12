import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/BottomNav'
import './osteopatia.css'

// Iniciales del nombre
function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Colores del avatar en rotación
const AVATAR_COLORS = ['green', 'blue', 'gold']

export default function Osteopatia() {
  const navigate = useNavigate()

  const [professionals, setProfessionals] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    fetchProfessionals()
  }, [])

  async function fetchProfessionals() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, specialty, bio')
        .order('full_name', { ascending: true })

      if (error) throw error
      setProfessionals(data || [])
    } catch (err) {
      setError('No se pudo cargar la lista de profesionales.')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    if (!selected) return
    navigate(`/osteopatia/calendario/${selected.id}`, {
      state: { professional: selected }
    })
  }

  return (
    <div className="osteo-screen">

      <header className="osteo-header">
        <button className="osteo-back" onClick={() => navigate('/')}>
          ‹ Inicio
        </button>
        <div className="osteo-header-title">Osteopatía</div>
        <div className="osteo-header-sub">Elige tu profesional</div>
      </header>

      <main className="osteo-body">
        <p className="osteo-section-label">Profesionales disponibles</p>

        {loading && (
          <>
            <div className="osteo-skeleton" />
            <div className="osteo-skeleton" />
          </>
        )}

        {error && <p className="osteo-error">{error}</p>}

        {!loading && !error && professionals.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 14 }}>
            No hay profesionales disponibles en este momento.
          </p>
        )}

        {professionals.map((pro, idx) => (
          <div
            key={pro.id}
            className={`pro-card ${selected?.id === pro.id ? 'selected' : ''}`}
            onClick={() => setSelected(pro)}
          >
            <div className={`pro-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
              {initials(pro.full_name)}
            </div>
            <div className="pro-info">
              <div className="pro-name">{pro.full_name}</div>
              <div className="pro-spec">{pro.specialty || 'Osteópata'}</div>
              <span className="pro-avail">Ver disponibilidad</span>
            </div>
            <div className="pro-check">✓</div>
          </div>
        ))}

        <button
          className="osteo-btn"
          disabled={!selected}
          onClick={handleContinue}
        >
          Ver calendario →
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
