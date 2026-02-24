import { NavLink, useNavigate } from 'react-router-dom'
import { dashboardCards } from '../../data/labsConfig'
import { useAppState } from '../../state/appStateContext'

export default function TopNav() {
  const navigate = useNavigate()
  const { runRandomAlchemist } = useAppState()

  const handleRandom = () => {
    const lab = runRandomAlchemist()
    if (lab?.route) {
      navigate(lab.route)
    }
  }

  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <div className="brand-mark">AL</div>
        <div>
          <div className="brand-title">Language Alchemy Lab</div>
          <div className="brand-subtitle">ארגז הכלים האולטימטיבי לאלכימיה של שפה</div>
        </div>
      </div>

      <nav className="top-nav__links" aria-label="ניווט ראשי">
        <NavLink to="/" end className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
          דשבורד
        </NavLink>
        {dashboardCards.map((lab) => (
          <NavLink
            key={lab.id}
            to={lab.route}
            className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}
          >
            {lab.titleHe}
          </NavLink>
        ))}
        <NavLink
          to="/library"
          className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}
        >
          ספרייה
        </NavLink>
      </nav>

      <button type="button" className="random-alchemist-button" onClick={handleRandom}>
        אלכימאי אקראי
      </button>
    </header>
  )
}
