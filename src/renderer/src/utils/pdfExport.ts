import html2canvas from 'html2canvas'

// [id, occurred_at, incident_type, location_name, class_name, child_name, injury_type_name, description]
export type IncidentRow = [number, string, string, string, string, string, string, string]

export type MatrixData = {
  slotLabels: string[]
  locations: string[]
  injuryTypes: string[]
  locationMatrix: Record<string, Record<string, number>>
  injuryMatrix: Record<string, Record<string, number>>
}

export function splitIncidentsIntoPages(incidents: IncidentRow[]): IncidentRow[][] {
  if (incidents.length === 0) return [[]]
  const pages: IncidentRow[][] = []
  for (let i = 0; i < incidents.length; i += 30) {
    pages.push(incidents.slice(i, i + 30))
  }
  return pages
}

export async function buildPdfDocument(
  chartElement: HTMLElement,
  incidents: IncidentRow[],
  matrix: MatrixData,
  periodLabel: string,
): Promise<number[]> {
  // グラフページだけ html2canvas で画像化
  const canvas = await html2canvas(chartElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png')
  )
  const chartImageBytes = Array.from(new Uint8Array(await blob.arrayBuffer()))

  // Main プロセスでテキストベース PDF を生成
  return window.api.invoke('pdf:build', {
    incidents,
    matrix,
    periodLabel,
    chartImageBytes,
  }) as Promise<number[]>
}

export function buildPdfFileName(from: string): string {
  if (!from) return 'report.pdf'
  const yyyymm = from.slice(0, 4) + from.slice(5, 7)
  return `report_${yyyymm}.pdf`
}
