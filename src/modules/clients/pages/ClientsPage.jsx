import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Formik, Form } from 'formik'
import { Plus, Search, Users, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { PaginationControls } from '@/shared/components/ui/PaginationControls'
import { FormikAuthField } from '@/modules/auth/components/FormikAuthField'
import { FormikSelect } from '@/modules/auth/components/FormikSelect'
import { FormikPhoneField } from '@/shared/components/FormikPhoneField'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientStats,
} from '@/modules/clients/hooks/useClients'
import { clientSchema, clientInitialValues } from '@/modules/clients/validation/client.schema'
import { PREFERRED_CHANNELS, RISK_TIERS, CURRENCIES } from '@/shared/constants/config'
import { AppError } from '@/shared/errors/AppError'
import { getUserMessage } from '@/shared/errors/errorHandler'
import { formatCurrency, cn } from '@/shared/lib/utils'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

const PER_PAGE = 15

function ClientFormModal({ open, onClose, client }) {
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const isEdit = Boolean(client)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit client' : 'Add client'}
      description="Tenant-scoped CRM record used by DueWise collections."
    >
      <Formik
        enableReinitialize
        initialValues={
          client
            ? {
                ...clientInitialValues,
                ...client,
                preferred_channel: client.preferred_channel || '',
                risk_tier: client.risk_tier || '',
                currency: client.currency ? String(client.currency).toUpperCase() : 'USD',
              }
            : clientInitialValues
        }
        validationSchema={clientSchema}
        validateOnChange={false}
        onSubmit={async (values, { setErrors, setStatus }) => {
          setStatus(undefined)
          const payload = {
            name: values.name.trim(),
            company_name: values.company_name?.trim() || undefined,
            email: values.email?.trim() || undefined,
            phone: values.phone?.trim() || undefined,
            whatsapp_phone: values.whatsapp_phone?.trim() || undefined,
            currency: values.currency?.trim()?.toUpperCase() || undefined,
            tax_number: values.tax_number?.trim() || undefined,
            address: values.address?.trim() || undefined,
            preferred_channel: values.preferred_channel || undefined,
            risk_tier: values.risk_tier || undefined,
          }
          try {
            if (isEdit) await updateClient.mutateAsync({ id: client.id, ...payload })
            else await createClient.mutateAsync(payload)
            onClose()
          } catch (err) {
            const appError = AppError.fromUnknown(err)
            appError.applyToFormik(setErrors)
            setStatus(getUserMessage(appError))
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="flex flex-col" noValidate>
            <div className="space-y-3">
              <FormikAuthField name="name" label="Client name" placeholder="Acme Corp Ltd" />
              <FormikAuthField
                name="company_name"
                label="Company name"
                placeholder="Acme International"
              />
              <div className="grid gap-3">
                <FormikPhoneField name="phone" label="Phone (optional)" defaultCountry="US" />
                <FormikPhoneField
                  name="whatsapp_phone"
                  label="WhatsApp (optional)"
                  defaultCountry="US"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormikAuthField name="email" label="Email" type="email" placeholder="billing@…" />
                <FormikSelect name="currency" label="Currency">
                  <option value="">Select currency</option>
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </FormikSelect>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormikSelect name="preferred_channel" label="Preferred channel">
                  <option value="">Select</option>
                  {PREFERRED_CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </FormikSelect>
                <FormikSelect name="risk_tier" label="Risk tier">
                  <option value="">Select</option>
                  {RISK_TIERS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </FormikSelect>
              </div>
              <FormikAuthField name="tax_number" label="Tax number" />
              <FormikAuthField name="address" label="Address" />
              {status && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{status}</p>
              )}
            </div>
            <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex justify-end gap-2 border-t border-slate-100 bg-white px-5 pt-3 pb-1">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  )
}

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState(searchParams.get('risk_tier') || '')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  useEffect(() => {
    const fromUrl = searchParams.get('risk_tier') || ''
    if (fromUrl !== risk) setRisk(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const filters = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      search: debouncedSearch || undefined,
      risk_tier: risk || undefined,
    }),
    [page, debouncedSearch, risk]
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useClients(filters)
  const clients = data?.data ?? []
  const meta = data?.meta ?? {}
  const { data: stats, isLoading: statsLoading } = useClientStats()
  const deleteClient = useDeleteClient()

  const onRiskChange = (value) => {
    setRisk(value)
    setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('risk_tier', value)
    else next.delete('risk_tier')
    setSearchParams(next, { replace: true })
  }

  const handleDelete = async (client) => {
    if (!window.confirm(`Delete client “${client.name}”? This cannot be undone.`)) return
    setDeletingId(client.id)
    try {
      await deleteClient.mutateAsync(client.id)
    } catch {
      /* hook handles toast */
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tenant CRM — contacts DueWise sequences chase for recovery.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Clients', value: stats?.total_clients ?? '—' },
          {
            label: 'Outstanding',
            value: stats ? formatCurrency(stats.total_outstanding || 0) : '—',
          },
          {
            label: 'Recovered',
            value: stats ? formatCurrency(stats.total_recovered || 0) : '—',
          },
          { label: 'Avg days to pay', value: stats?.average_days_to_pay ?? '—' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-12 rounded-lg" />
              ) : (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search name, company, email…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
          <select
            value={risk}
            onChange={(e) => onRiskChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">All risk tiers</option>
            {RISK_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-rose-600">{getUserMessage(error)}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No clients yet</p>
            <p className="text-xs text-slate-400">Add your first client to start collections.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {clients.map((client) => (
          <Card key={client.id} className="transition hover:border-emerald-200">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  {client.risk_tier && (
                    <Badge
                      className={cn(
                        client.risk_tier === 'high' && 'bg-rose-50 text-rose-700',
                        client.risk_tier === 'medium' && 'bg-amber-50 text-amber-700',
                        client.risk_tier === 'low' && 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {client.risk_tier}
                    </Badge>
                  )}
                  {client.preferred_channel && (
                    <Badge variant="secondary">{client.preferred_channel}</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {[client.company_name, client.email, client.phone].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="mr-1 text-right">
                  <p className="text-xs text-slate-400">Outstanding</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatCurrency(client.total_outstanding || 0)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(client)
                    setModalOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-rose-600"
                  disabled={deletingId === client.id || deleteClient.isPending}
                  onClick={() => handleDelete(client)}
                  aria-label={`Delete ${client.name}`}
                >
                  {deletingId === client.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && !isError && (meta.total > 0 || clients.length > 0) && (
        <Card>
          <PaginationControls
            meta={meta}
            page={page}
            onPageChange={setPage}
            isFetching={isFetching}
            className="border-0"
          />
        </Card>
      )}

      <ClientFormModal
        open={modalOpen}
        client={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
