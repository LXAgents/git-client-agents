import type { ReactNode } from 'react'
import { Inbox, Loader2 } from 'lucide-react'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[] | null
  rowKey: (row: T) => string
  loading?: boolean
  empty: ReactNode
  label: string
}

// A table on a card. `rows === null` means not loaded yet.
export function DataTable<T>({ columns, rows, rowKey, loading = false, empty, label }: Props<T>) {
  return (
    <div className="card enter overflow-x-auto">
      <table aria-label={label} aria-busy={loading} className="w-full min-w-[36rem] border-collapse text-sm">
        <thead className="text-left text-[0.7rem] font-semibold tracking-wider text-fg-muted uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`border-b border-line-muted px-5 py-3 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center text-fg-muted">
                <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
                Loading…
              </td>
            </tr>
          ) : rows && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center text-fg-muted">
                <Inbox aria-hidden className="mx-auto mb-3 size-8 opacity-50" />
                {empty}
              </td>
            </tr>
          ) : (
            rows?.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line-muted transition-colors last:border-b-0 hover:bg-overlay/60">
                {columns.map((c) => (
                  <td key={c.header} className={`px-5 py-3.5 align-middle ${c.className ?? ''}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
