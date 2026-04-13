import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { resolveCatboxUserhash } from './api/catboxClient'
import { CrushonLegalDisclaimer } from './components/CrushonLegalDisclaimer'
import { useCatboxSettings } from './context/CatboxSettingsContext'
import { useCharacters } from './hooks/useCharacters'
import { CharacterPage } from './pages/CharacterPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { userhash: storedUserhash } = useCatboxSettings()
  const { linkedFileName, storageReady } = useCharacters()
  const userhash = resolveCatboxUserhash(storedUserhash)
  const missingCatbox = !userhash.trim()
  const missingFileLink = !linkedFileName
  const showSetupWarning = storageReady && (missingCatbox || missingFileLink)
  const showSetupBanner = showSetupWarning && location.pathname !== '/settings'
  const settingsWarningText = `Setup needed: ${missingCatbox ? 'Catbox userhash' : ''}${
    missingCatbox && missingFileLink ? ' + ' : ''
  }${missingFileLink ? 'linked backup file' : ''}.`

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-brand" end>
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">
            <span className="app-brand-name">Crushon Studio</span>
            <span className="app-brand-tag">Character studio</span>
          </span>
        </NavLink>
        <div className="app-header-actions">
          <div className="app-settings-anchor-wrap">
            <NavLink to="/settings" className={({ isActive }) => `app-settings-link ${isActive ? 'active' : ''}`}>
              Settings
            </NavLink>
            {showSetupWarning && (
              <span
                className="app-settings-warning-pop"
                title="Setup needed"
                aria-label={settingsWarningText}
                tabIndex={0}
              >
                <HiOutlineExclamationTriangle className="app-settings-warning-icon" aria-hidden />
                <span className="app-settings-warning-tooltip" role="tooltip">
                  {settingsWarningText}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>
      {showSetupBanner && (
        <div className="app-setup-notice-wrap">
          <div className="app-setup-notice" role="status" aria-live="polite">
            <span className="app-setup-notice-icon" aria-hidden>
              !
            </span>
            <p className="app-setup-notice-text">
              Setup incomplete:
              {missingCatbox && ' add your Catbox userhash'}
              {missingCatbox && missingFileLink && ' and'}
              {missingFileLink && ' link a backup JSON file'}.
            </p>
            <NavLink to="/settings" className="app-setup-notice-link">
              Open settings
            </NavLink>
          </div>
        </div>
      )}
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <CrushonLegalDisclaimer />
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character/:id" element={<CharacterPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Shell>
  )
}
