import { motion } from 'framer-motion'
import { Mail, Smartphone, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'
import { ACTIVITY_FEED } from '@/data/mockData'

const CHANNEL_META = {
  email: { Icon: Mail, label: 'Email' },
  sms: { Icon: Smartphone, label: 'SMS' },
  whatsapp: { Icon: MessageSquare, label: 'WhatsApp' },
}

export function ChannelTracker() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.48, duration: 0.45 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div>
            <CardTitle>Smart Channel Tracker</CardTitle>
            <CardDescription>Delivery status across Email, SMS & WhatsApp</CardDescription>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="email">Email</Badge>
            <Badge variant="sms">SMS</Badge>
            <Badge variant="whatsapp">WhatsApp</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {ACTIVITY_FEED.map((item, i) => {
              const { Icon, label } = CHANNEL_META[item.channel]
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.client}</p>
                      <Badge variant={item.status} className="capitalize">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {label} · {timeAgo(item.time)}
                    </p>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
