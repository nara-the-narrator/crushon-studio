import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getStoredCatboxUserhash,
  getStoredStyleApiKey,
  setStoredCatboxUserhash,
  setStoredStyleApiKey,
} from '../storage/catboxSettings'

type CatboxSettingsValue = {
  userhash: string
  setUserhash: (value: string) => void
  styleApiKey: string
  setStyleApiKey: (value: string) => void
}

const CatboxSettingsContext = createContext<CatboxSettingsValue | null>(null)

export function CatboxSettingsProvider({ children }: { children: ReactNode }) {
  const [userhash, setUserhashState] = useState(() => getStoredCatboxUserhash())
  const [styleApiKey, setStyleApiKeyState] = useState(() => getStoredStyleApiKey())

  const setUserhash = useCallback((value: string) => {
    setStoredCatboxUserhash(value)
    setUserhashState(getStoredCatboxUserhash())
  }, [])

  const setStyleApiKey = useCallback((value: string) => {
    setStoredStyleApiKey(value)
    setStyleApiKeyState(getStoredStyleApiKey())
  }, [])

  const value = useMemo(
    () => ({
      userhash,
      setUserhash,
      styleApiKey,
      setStyleApiKey,
    }),
    [userhash, setUserhash, styleApiKey, setStyleApiKey],
  )

  return (
    <CatboxSettingsContext.Provider value={value}>{children}</CatboxSettingsContext.Provider>
  )
}

export function useCatboxSettings(): CatboxSettingsValue {
  const ctx = useContext(CatboxSettingsContext)
  if (!ctx) {
    throw new Error('useCatboxSettings must be used within CatboxSettingsProvider')
  }
  return ctx
}
