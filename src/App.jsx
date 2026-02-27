import AppRouter from './app/AppRouter'
import { AppStateProvider } from './state/AppStateProvider'
import { OverlayProvider } from './components/overlay/OverlayProvider'
import './styles/app.css'
import './styles/alchemy-global.css'

export default function App() {
  return (
    <AppStateProvider>
      <OverlayProvider>
        <AppRouter />
      </OverlayProvider>
    </AppStateProvider>
  )
}
