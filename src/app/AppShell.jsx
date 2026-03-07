import { Outlet, useLocation } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import GlobalAlchemyAtmosphere from '../components/alchemy/GlobalAlchemyAtmosphere'

export default function AppShell() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className={`app-shell ${isHome ? 'app-shell--home' : ''}`} dir="rtl">
      <GlobalAlchemyAtmosphere />
      <main className={`app-frame ${isHome ? 'app-frame--home' : ''}`}>
        <TopNav />
        <section className={`app-content ${isHome ? 'app-content--home' : ''}`}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}
