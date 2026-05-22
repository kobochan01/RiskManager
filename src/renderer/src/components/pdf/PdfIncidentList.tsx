import type { IncidentRow } from '../../utils/pdfExport'

function formatOccurredAt(raw: string): string {
  const d = new Date(raw.replace(' ', 'T'))
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}時${mm}分`
}

const PAGE_W = 1123
const PAGE_H = 794

type Props = {
  incidents: IncidentRow[]
  periodLabel: string
  pageNum: number
  totalPages: number
}

export default function PdfIncidentList({ incidents, periodLabel, pageNum, totalPages }: Props): JSX.Element {
  return (
    <div
      data-landscape="true"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        padding: '16px 24px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        fontSize: 11,
        color: '#111',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ページヘッダー */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold' }}>ヒヤリハット事案一覧</div>
          <div style={{ fontSize: 10, color: '#555' }}>集計期間：{periodLabel}</div>
        </div>
        <div style={{ fontSize: 9, color: '#888' }}>{pageNum} / {totalPages}</div>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 9, width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 130 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 90 }} />
            <col />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: '#1e40af', color: '#fff' }}>
              <th style={th()}>発生日時</th>
              <th style={th()}>場所</th>
              <th style={th()}>クラス</th>
              <th style={th()}>園児名</th>
              <th style={th()}>けがの種類</th>
              <th style={th()}>事故内容</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(([, occurredAt, location, className, childName, injuryType, description], idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f0f4ff' }}>
                <td style={td()}>{formatOccurredAt(String(occurredAt))}</td>
                <td style={td()}>{location}</td>
                <td style={td()}>{className}</td>
                <td style={td()}>{childName}</td>
                <td style={td()}>{injuryType}</td>
                <td style={{ ...td(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function th(): React.CSSProperties {
  return {
    padding: '4px 6px',
    border: '1px solid #93c5fd',
    textAlign: 'left',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }
}

function td(): React.CSSProperties {
  return {
    padding: '3px 6px',
    border: '1px solid #e5e7eb',
  }
}
