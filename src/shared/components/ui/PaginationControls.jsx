import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'

/**
 * Laravel-style pagination controls using `meta` from API responses.
 */
export function PaginationControls({
  meta,
  page,
  onPageChange,
  isFetching = false,
  className = '',
}) {
  const currentPage = meta?.current_page || page || 1
  const lastPage = meta?.last_page || 1
  const total = meta?.total
  const from = meta?.from
  const to = meta?.to

  if (!total && lastPage <= 1) return null

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs text-slate-500">
        {from != null && to != null
          ? `Showing ${from}–${to}${total != null ? ` of ${total}` : ''}`
          : total != null
            ? `${total} total`
            : `Page ${currentPage} of ${lastPage}`}
        {isFetching ? ' · Updating…' : ''}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs font-medium text-slate-600">
          Page {currentPage} / {lastPage}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage >= lastPage || isFetching}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
