import { useCallback, useState } from 'react'

export function useButtonFlash(durationMs = 2200) {
  const [active, setActive] = useState(false)

  const trigger = useCallback(() => {
    setActive(true)
    window.setTimeout(() => setActive(false), durationMs)
  }, [durationMs])

  const successClass = active ? 'btn--success' : ''

  return { active, trigger, successClass }
}
