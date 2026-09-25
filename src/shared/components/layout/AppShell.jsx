import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  TrendingUp,
  Puzzle,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Menu,
  X,
  GitBranch,
  Headphones,
  CreditCard,
  Users,
  BadgeDollarSign,
  ShieldCheck,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Avatar } from '@/shared/components/ui/Skeleton'
import { CreateInvoiceModal } from '@/products/duewise/components/invoices/CreateInvoiceModal'
import { useDuewiseEntitlements } from '@/products/duewise/hooks/useDuewise'
import {
  CURRENT_USER,
  PLATFORM,
  PRODUCTS,
  PLATFORM_NAV,
} from '@/modules/platform/data/platformData'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { logout, selectUser } from '@/app/store/slices/authSlice'

const ICONS = {
  LayoutDashboard,
  FileText,
  Sparkles,
  TrendingUp,
  Puzzle,
  Settings,
  GitBranch,
  Headphones,
  CreditCard,
  Users,
  BadgeDollarSign,
  ShieldCheck,
}

function BrandMark({ collapsed }) {
  return (
    <Link
      to="/app"
      className={cn('flex items-center', collapsed ? 'gap-0' : 'gap-2.5 overflow-hidden')}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl gradient-brand shadow-sm shadow-emerald-600/25',
          collapsed ? 'h-8 w-8' : 'h-9 w-9'
        )}
      >
        <span className={cn('font-bold tracking-tight text-white', collapsed ? 'text-[10px]' : 'text-xs')}>
          AGE
        </span>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="min-w-0"
          >
            <p className="truncate text-base font-semibold tracking-tight text-slate-900">
              {PLATFORM.name}
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Outcomes platform
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  )
}

function UserDropdown({ onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const authUser = useAppSelector(selectUser)
  const user = authUser
    ? {
        name: authUser.name || authUser.email || 'User',
        email: authUser.email,
        avatar: (authUser.name || authUser.email || 'U')
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        company: authUser.tenant?.name || authUser.tenant_id || 'Tenant',
        role: authUser.roles?.[0] || 'Member',
        tenant: authUser.tenant?.id || authUser.tenant_id || '—',
      }
    : CURRENT_USER

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:bg-slate-50 cursor-pointer"
      >
        <Avatar initials={user.avatar} size="sm" colorIndex={1} />
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold leading-tight text-slate-800">{user.name}</p>
          <p className="text-[10px] text-slate-500">
            {user.company} · {user.role}
          </p>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-3.5 py-3">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <Badge variant="ai" className="mt-2">
                Tenant: {user.tenant}
              </Badge>
            </div>
            <div className="p-1.5">
              <Link
                to="/app/profile"
                onClick={() => setOpen(false)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={onLogout}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isCollapsed = collapsed && !mobileOpen
  const duewise = PRODUCTS[0]

  const isDueWiseActive = location.pathname.startsWith(duewise.path)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (isDueWiseActive) setExpanded(true)
  }, [isDueWiseActive])

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center py-4',
          isCollapsed ? 'justify-center gap-0.5 px-1' : 'justify-between px-3'
        )}
      >
        <BrandMark collapsed={isCollapsed} />
        <button
          onClick={mobileOpen ? onMobileClose : onToggle}
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700',
            isCollapsed ? 'h-7 w-7' : 'h-8 w-8'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {mobileOpen ? (
            <X className="h-4 w-4" />
          ) : isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        {!isCollapsed && (
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </p>
        )}
        <nav className="mb-4 space-y-0.5">
          {PLATFORM_NAV.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/app'}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium transition-all',
                    isCollapsed ? 'justify-center px-0' : 'px-2.5',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {!isCollapsed && (
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Products
          </p>
        )}
        <div className="space-y-0.5">
          <button
            type="button"
            title={isCollapsed ? duewise.name : undefined}
            onClick={() => {
              setExpanded((v) => !v)
              navigate(duewise.path)
              onMobileClose?.()
            }}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-xl py-2 text-left text-sm font-medium transition',
              isCollapsed ? 'justify-center px-0' : 'px-2.5',
              isDueWiseActive
                ? 'bg-emerald-50 text-emerald-900'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
              {duewise.code}
            </span>
            {!isCollapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{duewise.name}</span>
                <Badge variant="live" pulse className="scale-90">
                  Live
                </Badge>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 text-slate-400 transition', expanded && 'rotate-180')}
                />
              </>
            )}
          </button>

          <AnimatePresence initial={false}>
            {!isCollapsed && expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="ml-3 space-y-0.5 border-l border-slate-200 py-1 pl-2">
                  {duewise.pages.map((page) => {
                    const Icon = ICONS[page.icon] || FileText
                    return (
                      <NavLink
                        key={page.id}
                        to={page.path}
                        end={page.id === 'overview'}
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                            isActive
                              ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          )
                        }
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {page.label}
                      </NavLink>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isCollapsed && (
        <div className="border-t border-slate-100 p-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Engineering law
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              Tenant is the security boundary. Fail closed. AI is optional in every core path.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 lg:flex lg:flex-col',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {content}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function TopNav({ onMenuClick, onCreateInvoice, onLogout, context }) {
  const { data: entitlements } = useDuewiseEntitlements()
  const isTrial = Boolean(entitlements?.is_trial)
  const isBase = entitlements?.plan === 'base'
  const hasInvoiceLimit = entitlements?.invoice_limit != null
  const invoiceCount = entitlements?.invoice_count ?? 0
  const invoiceLimit = entitlements?.invoice_limit ?? (isTrial ? 10 : isBase ? 500 : null)
  const canCreate = entitlements ? entitlements.can_create_invoice !== false : true
  const limitReached = !canCreate || (invoiceLimit != null && invoiceCount >= invoiceLimit)
  const showQuotaBadge = Boolean(
    context.showCreateInvoice && entitlements && (isTrial || isBase || hasInvoiceLimit)
  )

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">{context.title}</p>
          <p className="text-[11px] text-slate-500">{context.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {showQuotaBadge && (
          <Link
            to="/app/billing?product=duewise"
            className={cn(
              'hidden items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition sm:inline-flex',
              limitReached
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
            )}
            title={`${isTrial ? 'Trial' : entitlements?.plan_name || 'Base Plan'} limit: ${invoiceCount}/${invoiceLimit ?? 500} invoices`}
          >
            <span>
              {isTrial ? 'Trial' : entitlements?.plan_name || 'Base'}:{' '}
              <strong>
                {invoiceCount}/{invoiceLimit ?? 500}
              </strong>
            </span>
            <span
              className={cn(
                'text-[10px] uppercase font-semibold underline',
                limitReached ? 'text-rose-700' : 'text-emerald-700'
              )}
            >
              Upgrade
            </span>
          </Link>
        )}

        {context.showCreateInvoice && (
          <Button
            onClick={onCreateInvoice}
            size="icon"
            aria-label="Create Invoice"
            className="shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        <UserDropdown onLogout={onLogout} />
      </div>
    </header>
  )
}

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  const context = useMemo(() => {
    const product = PRODUCTS.find((p) => location.pathname.startsWith(p.path))
    if (product) {
      return {
        title: product.name,
        subtitle: product.blurb,
        showCreateInvoice: product.id === 'duewise',
      }
    }
    return {
      title: PLATFORM.name,
      subtitle: PLATFORM.tagline,
      showCreateInvoice: false,
    }
  }, [location.pathname])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth')
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <TopNav
          onMenuClick={() => setMobileOpen(true)}
          onCreateInvoice={() => setCreateOpen(true)}
          onLogout={handleLogout}
          context={context}
        />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
