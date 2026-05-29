// [id, occurred_at, incident_type, location_name, class_name, child_name, injury_type_name, description]
export type IncidentRow = [number, string, string, string, string, string, string, string]

export function buildPdfFileName(from: string): string {
  if (!from) return 'report.pdf'
  const yyyymm = from.slice(0, 4) + from.slice(5, 7)
  return `report_${yyyymm}.pdf`
}


