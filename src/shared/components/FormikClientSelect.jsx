import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useField } from 'formik'
import { ChevronsUpDown, Check, Search, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

/**
 * Searchable client picker for Formik (`name="client_id"`).
 */
export function FormikClientSelect({
  name,
  label = 'Client',
  clients = [],
  loading = false,
  placeholder = 'Select client',
  disabled = false,
  addClientHref = '/app/clients',
  onAddClient,
}) {
  const [field, meta, helpers] = useField(name)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const showError = meta.touched && meta.error
  const hasClients = clients.length > 0

  const selected = useMemo(
    () => clients.find((c) => String(c.id) === String(field.value)),
    [clients, field.value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => {
      const hay = `${c.name || ''} ${c.company_name || ''} ${c.email || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [clients, query])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const labelText = selected
    ? `${selected.name}${selected.company_name ? ` · ${selected.company_name}` : ''}`
    : placeholder

  const goAddClient = () => {
    setOpen(false)
    onAddClient?.()
  }

  return (
    <div className="w-full" ref={rootRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={`${name}-trigger`}>
          {label}
        </label>
      )}

      <button
        id={`${name}-trigger`}
        type="button"
        disabled={disabled || loading}
        onBlur={field.onBlur}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3.5 text-left text-sm outline-none transition',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          showError
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300',
          (disabled || loading) && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className={cn('truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
          {loading ? 'Loading clients…' : labelText}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {open && !disabled && !loading && (
        <div className="relative z-40">
          <div className="absolute left-0 right-0 top-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            {hasClients && (
              <div className="relative border-b border-slate-100 p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, company, email…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
            )}
            <ul className="max-h-56 overflow-y-auto py-1">
              {!hasClients && (
                <li className="space-y-3 px-4 py-4 text-center">
                  <p className="text-sm text-slate-600">No clients yet. Add a client first.</p>
                  <Link
                    to={addClientHref}
                    onClick={goAddClient}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add client
                  </Link>
                </li>
              )}
              {hasClients && filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-500">No clients match “{query}”</li>
              )}
              {filtered.map((c) => {
                const active = String(c.id) === String(field.value)
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-emerald-50',
                        active && 'bg-emerald-50/80'
                      )}
                      onClick={() => {
                        helpers.setValue(c.id)
                        helpers.setTouched(true)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0 text-emerald-600',
                          active ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">{c.name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {[c.company_name, c.email].filter(Boolean).join(' · ') || `ID ${c.id}`}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {!loading && !hasClients && (
        <p className="mt-2 text-xs text-slate-500">
          Need a client?{' '}
          <Link
            to={addClientHref}
            onClick={goAddClient}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            Add client
          </Link>
        </p>
      )}

      {showError && <p className="mt-1.5 text-xs text-rose-600">{meta.error}</p>}
    </div>
  )
}

/**
 * Standalone searchable client filter (non-Formik).
 */
export function ClientSearchSelect({
  value,
  onChange,
  clients = [],
  loading = false,
  placeholder = 'All clients',
  className,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const selected = useMemo(
    () => clients.find((c) => String(c.id) === String(value)),
    [clients, value]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => {
      const hay = `${c.name || ''} ${c.company_name || ''} ${c.email || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [clients, query])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  return (
    <div className={cn('relative', className)} ref={rootRef}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full min-w-[10rem] max-w-[16rem] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
      >
        <span className="truncate">
          {loading ? 'Loading…' : selected ? selected.name : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                All clients
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs hover:bg-emerald-50',
                    String(c.id) === String(value) && 'bg-emerald-50 font-medium'
                  )}
                  onClick={() => {
                    onChange(String(c.id))
                    setOpen(false)
                  }}
                >
                  <span className="block truncate text-slate-900">{c.name}</span>
                  {c.company_name && (
                    <span className="block truncate text-[10px] text-slate-500">
                      {c.company_name}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
