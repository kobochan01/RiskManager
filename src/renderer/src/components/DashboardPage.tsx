import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { buildPdfFileName } from '../utils/pdfExport'

type Period = 'month' | 'quarter' | 'year' | 'custom'

type Stats = {
  timeSlots: { slot: string; count: number }[]
  injuryTypes: { name: string; count: number }[]
  locations: { name: string; count: number }[]
  total: number
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date()
  if (period === 'custom') {
    return { from: customFrom, to: customTo }
  }
  if (period === 'month') {
    return {
      from: toDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toDateString(today)
    }
  }
  if (period === 'quarter') {
    const q = Math.floor(today.getMonth() / 3)
    return {
      from: toDateString(new Date(today.getFullYear(), q * 3, 1)),
      to: toDateString(today)
    }
  }
  // year
  return {
    from: toDateString(new Date(today.getFullYear(), 0, 1)),
    to: toDateString(today)
  }
}

export default function DashboardPage(): JSX.Element {
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState(() => toDateString(new Date()))
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const { from, to } = getPeriodRange(period, customFrom, customTo)
    if (!from || !to) return
    setLoading(true)
    window.api.invoke('db:get-stats', { dateFrom: from, dateTo: to }).then((result) => {
      setStats(result as Stats)
      setLoading(false)
    })
  }, [period, customFrom, customTo])

  const { from, to } = getPeriodRange(period, customFrom, customTo)
  const periodLabel = from && to ? `${from} 〜 ${to}` : ''

  async function handleExportPdf(): Promise<void> {
    setExporting(true)
    try {
      const defaultName = buildPdfFileName(from)
      const result = await window.api.invoke('pdf:export', { defaultName }) as { success: boolean }
      if (!result.success) return
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 印刷用ヘッダー（画面では非表示） */}
      <div className="hidden print:block mb-2">
        <h1 className="text-xl font-bold text-gray-800">ヒヤリハット集計レポート</h1>
        {periodLabel && <p className="text-sm text-gray-600 mt-1">集計期間：{periodLabel}</p>}
      </div>

      {/* 期間フィルタ（印刷時は非表示） */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 print:hidden">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">集計期間：</span>
          {(['month', 'quarter', 'year', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'month' ? '今月' : p === 'quarter' ? '今四半期' : p === 'year' ? '今年' : 'カスタム'}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400 text-sm">〜</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          )}
        </div>
        {periodLabel && (
          <p className="mt-2 text-xs text-gray-400">{periodLabel}</p>
        )}
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
                <h2 className="text-sm font-semibold text-gray-700 mb-4">時間帯別（15分刻み）</h2>
                {stats.timeSlots.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">データなし</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.timeSlots} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="slot"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
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
