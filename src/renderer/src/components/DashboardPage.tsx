import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { buildPdfFileName, buildPdfDocument } from '../utils/pdfExport'
import type { IncidentRow, MatrixData } from '../utils/pdfExport'
import { getPeriodRange, QUARTER_LABELS, QUARTER_RANGES } from '../utils/periodRange'
import type { Period } from '../utils/periodRange'
import PdfContainer from './pdf/PdfContainer'
import type { PdfContainerHandle } from './pdf/PdfContainer'

type Stats = {
  timeSlots: { slot: string; count: number }[]
  injuryTypes: { name: string; count: number }[]
  locations: { name: string; count: number }[]
  total: number
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function SlotTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const parts = (payload?.value ?? '').split('-')
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text textAnchor="middle" fontSize={8} dy={10} fill="#555">{parts[0]}</text>
      <text textAnchor="middle" fontSize={8} dy={20} fill="#555">〜</text>
      <text textAnchor="middle" fontSize={8} dy={30} fill="#555">{parts[1]}</text>
    </g>
  )
}


function buildPeriodLabel(period: Period, year: number, month: number, quarter: number): string {
  const { from, to } = getPeriodRange(period, year, month, quarter)
  if (period === 'month') return `${year}年${month}月（${from} 〜 ${to}）`
  if (period === 'quarter') return `${year}年度 ${QUARTER_LABELS[quarter - 1]}（${from} 〜 ${to}）`
  return `${year}年度（${from} 〜 ${to}）`
}

const today = new Date()
const thisCalYear = today.getFullYear()
const thisMonth = today.getMonth() + 1
const thisFiscalYear = thisMonth >= 4 ? thisCalYear : thisCalYear - 1
const thisQuarter = thisMonth >= 4 && thisMonth <= 6 ? 1
                  : thisMonth >= 7 && thisMonth <= 9 ? 2
                  : thisMonth >= 10 ? 3 : 4

export default function DashboardPage(): JSX.Element {
  const [period, setPeriod] = useState<Period>('month')
  const [selectedYear, setSelectedYear] = useState(thisCalYear)
  const [selectedMonth, setSelectedMonth] = useState(thisMonth)
  const [selectedQuarter, setSelectedQuarter] = useState(thisQuarter)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const { from, to } = getPeriodRange(period, selectedYear, selectedMonth, selectedQuarter)
    setLoading(true)
    window.api.invoke('db:get-stats', { dateFrom: from, dateTo: to }).then((result) => {
      setStats(result as Stats)
      setLoading(false)
    })
  }, [period, selectedYear, selectedMonth, selectedQuarter])

  const { from } = getPeriodRange(period, selectedYear, selectedMonth, selectedQuarter)
  const periodLabel = buildPeriodLabel(period, selectedYear, selectedMonth, selectedQuarter)

  const yearLabel = period === 'month' ? '年' : '年度'
  const yearRange = period === 'month'
    ? Array.from({ length: 5 }, (_, i) => thisCalYear - 4 + i)
    : Array.from({ length: 5 }, (_, i) => thisFiscalYear - 4 + i)

  async function handleExportPdf(): Promise<void> {
    if (!stats) return
    setExporting(true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pdfRef = { current: null as PdfContainerHandle | null }
    let root: ReturnType<typeof createRoot> | null = null
    try {
      const { from: dateFrom, to: dateTo } = getPeriodRange(period, selectedYear, selectedMonth, selectedQuarter)

      const [incidents, matrix] = await Promise.all([
        window.api.invoke('db:get-incidents-filtered', { dateFrom, dateTo }) as Promise<IncidentRow[]>,
        window.api.invoke('db:get-matrix', { dateFrom, dateTo }) as Promise<MatrixData>,
      ])

      root = createRoot(container)
      await new Promise<void>((resolve) => {
        root!.render(
          <PdfContainer
            ref={(handle) => { pdfRef.current = handle }}
            incidents={incidents}
            stats={stats}
            matrix={matrix}
            periodLabel={periodLabel}
          />
        )
        // Rechartsの描画完了を待つ
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const pageElements = pdfRef.current?.getPageElements() ?? []
      const buffer = await buildPdfDocument(pageElements)
      const defaultName = buildPdfFileName(dateFrom)
      await window.api.invoke('pdf:export-save', { buffer, defaultName })
    } finally {
      root?.unmount()
      document.body.removeChild(container)
      setExporting(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 印刷用ヘッダー（画面では非表示） */}
      <div className="hidden print:block mb-2">
        <h1 className="text-xl font-bold text-gray-800">ヒヤリハット集計レポート</h1>
        <p className="text-sm text-gray-600 mt-1">集計期間：{periodLabel}</p>
      </div>

      {/* 期間フィルタ（印刷時は非表示） */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 print:hidden space-y-3">
        {/* 期間種別ボタン */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">集計期間：</span>
          {(['month', 'quarter', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'month' ? '月別' : p === 'quarter' ? '四半期' : '年別'}
            </button>
          ))}
        </div>

        {/* 年・月・四半期セレクタ */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">{yearLabel}：</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {yearRange.map((y) => (
                <option key={y} value={y}>
                  {period === 'month' ? `${y}年` : `${y}年度`}
                </option>
              ))}
            </select>
          </div>

          {period === 'month' && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">月：</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          )}

          {period === 'quarter' && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">四半期：</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {QUARTER_LABELS.map((label, i) => (
                  <option key={i + 1} value={i + 1}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">{periodLabel}</p>
      </div>

      {loading && (
        <p className="text-center text-gray-400 text-sm py-8">読み込み中...</p>
      )}

      {!loading && stats && (
        <>
          {/* 件数サマリー + PDF出力ボタン */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
              <span className="text-gray-600 text-sm">件のインシデント</span>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="print:hidden px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'PDF生成中...' : 'PDFとして出力'}
            </button>
          </div>

          {stats.total === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              対象期間にデータがありません。
            </div>
          ) : (
            <>
              {/* 時間帯別グラフ */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">時間帯別（1時間ごと）</h2>
                {stats.timeSlots.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">データなし</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.timeSlots} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="slot"
                        tick={<SlotTick />}
                        interval={0}
                        height={50}
                        ticks={stats.timeSlots.map(s => s.slot)}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip formatter={(v) => [`${v}件`, '件数']} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* けが種類別 + 場所別 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* けが種類別（円グラフ） */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">けがの種類別</h2>
                  {stats.injuryTypes.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">データなし</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={stats.injuryTypes}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {stats.injuryTypes.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v}件`, '件数']} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 場所別（横棒グラフ） */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">場所別</h2>
                  {stats.locations.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">データなし</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        layout="vertical"
                        data={stats.locations}
                        margin={{ top: 4, right: 32, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          width={72}
                        />
                        <Tooltip formatter={(v) => [`${v}件`, '件数']} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
