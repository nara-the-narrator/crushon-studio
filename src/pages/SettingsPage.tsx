import { Link } from 'react-router-dom'
import { StoragePanel } from '../components/StoragePanel'

export function SettingsPage() {
  return (
    <div className="page settings-page">
      <div className="settings-head">
        <Link to="/" className="back-link">
          ← Back to characters
        </Link>
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">
          Manage Catbox uploads, AI style key, local backup, and linked workspace file options.
        </p>
      </div>
      <section className="settings-panel">
        <StoragePanel />
      </section>
    </div>
  )
}
