import { useRef, useImperativeHandle, forwardRef } from 'react'
import PdfIncidentList from './PdfIncidentList'
import PdfMatrixTable from './PdfMatrixTable'
import PdfChartDashboard from './PdfChartPage'
import { splitIncidentsIntoPages } from '../../utils/pdfExport'
import type { IncidentRow, MatrixData } from '../../utils/pdfExport'

type Stats = {
  timeSlots: { slot: string; count: number }[]
  injuryTypes: { name: string; count: number }[]
  locations: { name: string; count: number }[]
  total: number
}

type Props = {
  incidents: IncidentRow[]
  stats: Stats
  matrix: MatrixData
  periodLabel: string
}

export type PdfContainerHandle = {
  getPageElements: () => HTMLElement[]
}

// A4横サイズ (96dpi相当)
const PAGE_W = 1123
const PAGE_H = 794

const PdfContainer = forwardRef<PdfContainerHandle, Props>(
  function PdfContainer({ incidents, stats, matrix, periodLabel }, ref) {
    const pageRefs = useRef<(HTMLDivElement | null)[]>([])

    const incidentPages = splitIncidentsIntoPages(incidents)
    const totalIncidentPages = incidentPages.length

    // 全ページ: 事案一覧×N + 集計表×2（前半・後半）+ グラフダッシュボード×1
    const totalPages = totalIncidentPages + 3

    useImperativeHandle(ref, () => ({
      getPageElements() {
        return pageRefs.current.filter((el): el is HTMLDivElement => el !== null)
      },
    }))

    let pageIdx = 0

    return (
      <div
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {/* 事案一覧ページ */}
        {incidentPages.map((pageIncidents, i) => (
          <div
            key={`incident-${i}`}
            data-landscape="true"
            ref={(el) => { pageRefs.current[pageIdx++] = el }}
            style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}
          >
            <PdfIncidentList
              incidents={pageIncidents}
              periodLabel={periodLabel}
              pageNum={i + 1}
              totalPages={totalPages}
            />
          </div>
        ))}

        {/* 集計表 前半（07:00〜11:59） */}
        <div data-landscape="true" ref={(el) => { pageRefs.current[pageIdx++] = el }}
          style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}>
          <PdfMatrixTable matrix={matrix} periodLabel={periodLabel} slotRange="am" />
        </div>

        {/* 集計表 後半（12:00〜17:59） */}
        <div data-landscape="true" ref={(el) => { pageRefs.current[pageIdx++] = el }}
          style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}>
          <PdfMatrixTable matrix={matrix} periodLabel={periodLabel} slotRange="pm" />
        </div>

        {/* グラフダッシュボード（3種を1ページ） */}
        <div data-landscape="true" ref={(el) => { pageRefs.current[pageIdx++] = el }}
          style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}>
          <PdfChartDashboard
            timeSlots={stats.timeSlots}
            injuryTypes={stats.injuryTypes}
            locations={stats.locations}
            periodLabel={periodLabel}
          />
        </div>
      </div>
    )
  }
)

export default PdfContainer
