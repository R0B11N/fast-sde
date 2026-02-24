/** Escape a cell for CSV (quotes if contains comma/newline) */
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

/** Export an array of row objects to CSV and trigger download */
export function downloadCsv(rows: Record<string, string | number>[], filename: string, columns?: string[]) {
  const keys = columns ?? (rows[0] ? Object.keys(rows[0]) : [])
  const header = keys.map(escapeCell).join(',')
  const body = rows.map((row) => keys.map((k) => escapeCell(String(row[k] ?? ''))).join(','))
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
