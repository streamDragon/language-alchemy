import { Component } from 'react'
import { useLocation } from 'react-router-dom'
import { buildScreenUrl, resolveUiMode } from '../../config/uiFlags'

class ShellErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="panel-card shell-runtime-fallback">
        <h3>Shell mode failed</h3>
        <p>אירעה שגיאה במסך ה-Shell. אפשר לעבור מיד ל-Legacy.</p>
        <button
          type="button"
          onClick={() => {
            const url = buildScreenUrl(this.props.screenId, 'legacy', window.location.href)
            window.location.assign(url)
          }}
        >
          Open Legacy Mode
        </button>
      </section>
    )
  }
}

export default function ScreenModeBoundary({ screenId, shell, legacy }) {
  const location = useLocation()
  const uiMode = resolveUiMode(screenId, location.search)
  if (uiMode === 'legacy') return legacy
  return <ShellErrorBoundary screenId={screenId}>{shell}</ShellErrorBoundary>
}
