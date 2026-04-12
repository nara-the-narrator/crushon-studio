import { useCallback, useState } from 'react'

/** Brief “success” styling on buttons after copy / download / save (see `.btn--success` in CSS). */
export function useButtonFlash(durationMs = 2200) {
  const [active, setActive] = useState(false)

  const trigger = useCallback(() => {
    setActive(true)
    window.setTimeout(() => setActive(false), durationMs)
  }, [durationMs])

  const successClass = active ? 'btn--success' : ''

  return { active, trigger, successClass }
}
