import { Outlet } from 'react-router-dom'
import TopNav from '../components/layout/TopNav'
import GlobalAlchemyAtmosphere from '../components/alchemy/GlobalAlchemyAtmosphere'

export default function AppShell() {
  return (
    <div className="app-shell" dir="rtl">
      <GlobalAlchemyAtmosphere />
      <main className="app-frame">
        <TopNav />
        <section className="app-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
