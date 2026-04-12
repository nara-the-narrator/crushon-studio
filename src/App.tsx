import { NavLink, Route, Routes } from 'react-router-dom'
import { StoragePanel } from './components/StoragePanel'
import { CharacterPage } from './pages/CharacterPage'
import { HomePage } from './pages/HomePage'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-brand" end>
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">
            <span className="app-brand-name">Nara the Narrator</span>
            <span className="app-brand-tag">Character studio</span>
          </span>
        </NavLink>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <StoragePanel />
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
      </Routes>
    </Shell>
  )
}
