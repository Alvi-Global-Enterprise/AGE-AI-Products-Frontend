import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenLine,
  ImageIcon,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const METHODS = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Fill in details yourself',
    Icon: PenLine,
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Scan a photo or screenshot',
    Icon: ImageIcon,
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Extract from a PDF file',
    Icon: FileText,
  },
]

function MethodTabs({ method, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {METHODS.map(({ id, label, description, Icon }) => {
        const active = method === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative rounded-xl border px-2.5 py-3 text-left transition cursor-pointer',
              active
                ? 'border-emerald-300 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/15'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <Icon
              className={cn(
                'mb-1.5 h-4 w-4',
                active ? 'text-emerald-600' : 'text-slate-400'
              )}
            />
            <p
              className={cn(
                'text-xs font-semibold',
                active ? 'text-emerald-900' : 'text-slate-800'
              )}
            >
              {label}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{description}</p>
          </button>
        )
      })}
    </div>
  )
}

function DropZone({ accept, title, hint, file, onFile, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files) => {
    const next = files?.[0]
    if (next) onFile(next)
  }

  return (
    <div>
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition',
            dragging
              ? 'border-emerald-400 bg-emerald-50/60'
              : 'border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30'
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <Upload className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">{hint}</p>
          <Badge variant="ai" className="mt-3">
            <Sparkles className="h-3 w-3" /> AI will extract invoice fields
          </Badge>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB · Ready for AI extraction
              </p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/80 bg-white/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Preview extraction
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">Client</p>
                    <p className="font-medium text-slate-800">Acme Corp</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Amount</p>
                    <p className="font-medium text-slate-800">$12,400</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Invoice ID</p>
                    <p className="font-medium text-slate-800">INV-2049</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Due date</p>
                    <p className="font-medium text-slate-800">2026-03-20</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700 cursor-pointer"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManualForm() {
  return (
    <div className="space-y-3">
      <Input id="client" label="Client name" />
      <div className="grid grid-cols-2 gap-3">
        <Input id="amount" label="Amount (USD)" type="number" />
        <Input id="due" label="Due date" type="date" />
      </div>
      <Input id="invoice-id" label="Invoice ID (optional)" />
      <Input id="notes" label="Notes (optional)" />
    </div>
  )
}

export function CreateInvoiceModal({ open, onClose }) {
  const [method, setMethod] = useState('manual')
  const [imageFile, setImageFile] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)

  const handleClose = () => {
    setMethod('manual')
    setImageFile(null)
    setPdfFile(null)
    onClose()
  }

  const canSubmit =
    method === 'manual' || (method === 'image' && imageFile) || (method === 'pdf' && pdfFile)

  const submitLabel =
    method === 'manual'
      ? 'Create & Sync'
      : method === 'image'
        ? 'Extract & Create'
        : 'Parse PDF & Create'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Invoice"
      description="Choose how you want to add this invoice — syncs to QuickBooks."
      size="lg"
    >
      <div className="space-y-4">
        <MethodTabs
          method={method}
          onChange={(id) => {
            setMethod(id)
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={method}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {method === 'manual' && <ManualForm />}

            {method === 'image' && (
              <DropZone
                accept="image/png,image/jpeg,image/webp,image/heic"
                title="Drop invoice image here"
                hint="PNG, JPG, or WEBP up to 10MB. Snap a photo of a paper invoice or upload a screenshot."
                file={imageFile}
                onFile={setImageFile}
                onClear={() => setImageFile(null)}
              />
            )}

            {method === 'pdf' && (
              <DropZone
                accept="application/pdf"
                title="Drop invoice PDF here"
                hint="PDF up to 20MB. We'll parse line items, totals, and due dates automatically."
                file={pdfFile}
                onFile={setPdfFile}
                onClear={() => setPdfFile(null)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400">
            {method === 'manual'
              ? 'Manual entry · QuickBooks sync on create'
              : 'AI extraction · Review fields before final sync'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={!canSubmit}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
