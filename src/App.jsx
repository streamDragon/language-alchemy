import AppRouter from './app/AppRouter'
import { AppStateProvider } from './state/AppStateProvider'
import './styles/app.css'
import './styles/alchemy-global.css'

export default function App() {
  return (
    <AppStateProvider>
      <AppRouter />
    </AppStateProvider>
  )
}
