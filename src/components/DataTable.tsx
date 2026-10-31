import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

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

// A GitHub-settings style bordered table. `rows === null` means not loaded yet.
export function DataTable<T>({ columns, rows, rowKey, loading = false, empty, label }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table aria-label={label} aria-busy={loading} className="w-full min-w-[36rem] border-collapse text-sm">
        <thead className="bg-canvas-subtle text-left text-xs font-semibold text-fg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`border-b border-line px-4 py-2.5 ${c.className ?? ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-fg-muted">
                <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
                Loading…
              </td>
            </tr>
          ) : rows && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-fg-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows?.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line-muted last:border-b-0 hover:bg-canvas-subtle/60">
                {columns.map((c) => (
                  <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>
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
