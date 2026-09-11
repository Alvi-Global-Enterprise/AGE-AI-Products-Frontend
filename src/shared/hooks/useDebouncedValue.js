import { useEffect, useState } from 'react'

/** Debounce a rapidly changing value (e.g. search input). */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
