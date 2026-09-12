import { motion } from 'framer-motion'
import { KPICards } from '@/products/duewise/components/dashboard/KPICards'
import { CashFlowChart } from '@/products/duewise/components/dashboard/CashFlowChart'
import { AIPaymentPrediction } from '@/products/duewise/components/dashboard/AIPaymentPrediction'
import { ChannelTracker } from '@/products/duewise/components/dashboard/ChannelTracker'
import { useAppSelector } from '@/app/store/hooks'
import { selectUser } from '@/app/store/slices/authSlice'
import { CURRENT_USER } from '@/modules/platform/data/platformData'

export default function DashboardPage() {
  const authUser = useAppSelector(selectUser)
  const user = authUser || CURRENT_USER
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName =
    (user?.name || user?.first_name || 'there').toString().split(' ')[0] || 'there'
  const company = user?.company || user?.tenant?.name || 'your business'

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          DueWise overview for {company} — KPIs, forecast, and overdue risk from live data.
        </p>
      </motion.div>

      <KPICards />

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
