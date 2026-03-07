import { NavLink, useNavigate } from 'react-router-dom'
import { getLabManifest, topNavLabIds } from '../../data/labManifest'
import { useAppState } from '../../state/appStateContext'
import packageJson from '../../../package.json'

export default function TopNav() {
  const navigate = useNavigate()
  const { runRandomAlchemist } = useAppState()
  const appVersion = packageJson.version
  const showVersion = import.meta.env.DEV
  const topNavLabs = topNavLabIds.map((labId) => getLabManifest(labId)).filter(Boolean)

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
        <div className="top-nav__brand-copy">
          <div className="brand-title">Language Alchemy</div>
          <div className="brand-subtitle">ניסוח, שאלה ותרגול לשיחה הבאה שלך</div>
          {showVersion && (
            <div className="brand-version" aria-label="Application version">
              v{appVersion}
            </div>
          )}
        </div>
      </div>

      <nav className="top-nav__links" aria-label="ניווט ראשי">
        <NavLink to="/" end className={({ isActive }) => `nav-pill ${isActive ? 'is-active' : ''}`}>
          בית
        </NavLink>
        {topNavLabs.map((lab) => (
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
        פתח/י לי משהו
      </button>
    </header>
  )
}
