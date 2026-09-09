import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export function Tooltip({ content, children, side = 'top', className }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const offset = 8
    let top = 0
    let left = rect.left + rect.width / 2

    if (side === 'top') {
      top = rect.top - offset
    } else if (side === 'bottom') {
      top = rect.bottom + offset
    } else if (side === 'left') {
      top = rect.top + rect.height / 2
      left = rect.left - offset
    } else {
      top = rect.top + rect.height / 2
      left = rect.right + offset
    }

    setCoords({ top, left, side })
  }, [open, side])

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[100] -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
              side === 'top' && '-translate-y-full',
              side === 'bottom' && 'translate-y-0',
              className
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
            <span
              className={cn(
                'absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-900',
                side === 'top' ? 'bottom-[-3px]' : 'top-[-3px]'
              )}
            />
          </div>,
          document.body
        )}
    </>
  )
}
