import { useRef, useImperativeHandle, forwardRef } from 'react'
import PdfChartDashboard from './PdfChartPage'

type Stats = {
  timeSlots: { slot: string; count: number }[]
  injuryTypes: { name: string; count: number }[]
  locations: { name: string; count: number }[]
  total: number
}

type Props = {
  stats: Stats
  title?: string
}

export type PdfContainerHandle = {
  getChartElement: () => HTMLElement | null
}

// A4横サイズ (96dpi相当)
const PAGE_W = 1123
const PAGE_H = 794

const PdfContainer = forwardRef<PdfContainerHandle, Props>(
  function PdfContainer({ stats, title }, ref) {
    const chartRef = useRef<HTMLDivElement | null>(null)

    useImperativeHandle(ref, () => ({
      getChartElement() {
        return chartRef.current
      },
    }))

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
        {/* グラフダッシュボード（3種を1ページ） */}
        <div
          ref={chartRef}
          style={{ width: PAGE_W, height: PAGE_H, overflow: 'hidden' }}
        >
          <PdfChartDashboard
            timeSlots={stats.timeSlots}
            injuryTypes={stats.injuryTypes}
            locations={stats.locations}
            title={title}
          />
        </div>
      </div>
    )
  }
)

export default PdfContainer
