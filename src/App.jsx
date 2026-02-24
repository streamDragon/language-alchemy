import AppRouter from './app/AppRouter'
import { AppStateProvider } from './state/AppStateProvider'
import './styles/app.css'

export default function App() {
  return (
    <AppStateProvider>
      <AppRouter />
    </AppStateProvider>
  )
}
