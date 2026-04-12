import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CatboxSettingsProvider } from './context/CatboxSettingsContext'
import { CharactersProvider } from './context/CharactersProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CharactersProvider>
        <CatboxSettingsProvider>
          <App />
        </CatboxSettingsProvider>
      </CharactersProvider>
    </BrowserRouter>
  </StrictMode>,
)
