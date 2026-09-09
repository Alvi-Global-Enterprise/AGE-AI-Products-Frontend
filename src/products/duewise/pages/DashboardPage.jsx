import { motion } from 'framer-motion'
import { KPICards } from '@/products/duewise/components/dashboard/KPICards'
import { CashFlowChart } from '@/products/duewise/components/dashboard/CashFlowChart'
import { AIPaymentPrediction } from '@/products/duewise/components/dashboard/AIPaymentPrediction'
import { ChannelTracker } from '@/products/duewise/components/dashboard/ChannelTracker'
import { QuickBooksBanner } from '@/products/duewise/components/dashboard/QuickBooksBanner'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useDuewiseDashboard } from '@/products/duewise/hooks/useDuewise'
import { useAppSelector } from '@/app/store/hooks'
import { selectUser } from '@/app/store/slices/authSlice'
import { CURRENT_USER } from '@/modules/platform/data/platformData'

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-80 rounded-2xl xl:col-span-3" />
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

export default function DashboardPage() {
  const { isLoading } = useDuewiseDashboard()
  const authUser = useAppSelector(selectUser)
  const user = authUser || CURRENT_USER
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {greeting}, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          DueWise overview — AI sequences + Karachi ops recovering overdue for{' '}
          {user.company}. Approval mode on for new cadences.
        </p>
      </motion.div>

      <KPICards />
      <QuickBooksBanner />

      <div className="grid items-stretch gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <CashFlowChart />
        </div>
        <div className="relative min-h-[420px] xl:col-span-2 xl:min-h-0">
          <div className="h-full xl:absolute xl:inset-0">
            <AIPaymentPrediction />
          </div>
        </div>
      </div>

      <ChannelTracker />
    </div>
  )
}
