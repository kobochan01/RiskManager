import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

// A4横: 1123px × 794px (96dpi相当)
const PAGE_W = 1123
const PAGE_H = 794

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function SlotTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const parts = (payload?.value ?? '').split('-')
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text textAnchor="middle" fontSize={7} dy={10} fill="#555">{parts[0]}</text>
      <text textAnchor="middle" fontSize={7} dy={18} fill="#555">〜</text>
      <text textAnchor="middle" fontSize={7} dy={26} fill="#555">{parts[1]}</text>
    </g>
  )
}

type TimeSlot = { slot: string; count: number }
type NameCount = { name: string; count: number }

type Props = {
  timeSlots: TimeSlot[]
  injuryTypes: NameCount[]
  locations: NameCount[]
}

// グラフ3種を1ページにダッシュボード風レイアウトで表示（ヘッダーなし・グラフ本体のみ）
// 上段: 時間帯別（全幅）
// 下段左: けがの種類別（円グラフ）  下段右: 場所別（横棒グラフ）
export default function PdfChartDashboard({ timeSlots, injuryTypes, locations }: Props): JSX.Element {
  const PADDING = 20
  const GAP = 12
  const FOOTER_MARGIN = 20

  // 上段グラフ: 全幅
  const topW = PAGE_W - PADDING * 2
  const topH = 260

  // 下段グラフ: 左右2分割、ページ内に収まる残り高さ
  const bottomH = PAGE_H - PADDING * 2 - GAP - topH - GAP - FOOTER_MARGIN
  const bottomW = (topW - GAP) / 2

  // 場所数に応じてバーサイズ調整
  const locationBarSize = Math.min(22, Math.max(8, Math.floor((bottomH - 60) / Math.max(locations.length, 1))))

  return (
    <div
      data-landscape="true"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        padding: `${PADDING}px ${PADDING}px`,
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        color: '#111',
        backgroundColor: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 上段: 時間帯別グラフ */}
      <div style={{ marginBottom: GAP }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>
          時間帯別インシデント件数（1時間ごと）
        </div>
        {timeSlots.length === 0 ? (
          <NoData h={topH} />
        ) : (
          <BarChart width={topW} height={topH} data={timeSlots} margin={{ top: 4, right: 16, left: 0, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="slot"
              tick={<SlotTick />}
              interval={0}
              height={40}
              ticks={timeSlots.map(s => s.slot)}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
            <Tooltip formatter={(v) => [`${v}件`, '件数']} />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={16} isAnimationActive={false} />
          </BarChart>
        )}
      </div>

      {/* 下段: 左右2分割 */}
      <div style={{ display: 'flex', gap: GAP, flex: 1 }}>
        {/* 下段左: けがの種類別（円グラフ） */}
        <div style={{ width: bottomW, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>
            けがの種類別
          </div>
          {injuryTypes.length === 0 ? (
            <NoData h={bottomH} />
          ) : (
            <PieChart width={bottomW} height={bottomH}>
              <Pie
                data={injuryTypes}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="44%"
                outerRadius={Math.min(bottomH * 0.35, 110)}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine
                isAnimationActive={false}
              >
                {injuryTypes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}件`, '件数']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          )}
        </div>

        {/* 下段右: 場所別（横棒グラフ） */}
        <div style={{ width: bottomW, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>
            場所別
          </div>
          {locations.length === 0 ? (
            <NoData h={bottomH} />
          ) : (
            <BarChart
              layout="vertical"
              width={bottomW}
              height={bottomH}
              data={locations}
              margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }}
                label={{ value: '件数', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v) => [`${v}件`, '件数']} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={locationBarSize} isAnimationActive={false} />
            </BarChart>
          )}
        </div>
      </div>
    </div>
  )
}

function NoData({ h }: { h: number }): JSX.Element {
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>
      データなし
    </div>
  )
}
