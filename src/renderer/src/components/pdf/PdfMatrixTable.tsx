import type { MatrixData } from '../../utils/pdfExport'

// A4横: 1123px × 794px (96dpi相当)
const PAGE_W = 1123

// 場所列+けが種類列の合計がこの値を超えたら上下分割表示
const SPLIT_THRESHOLD = 15

type Props = {
  matrix: MatrixData
  periodLabel: string
}

export default function PdfMatrixTable({ matrix, periodLabel }: Props): JSX.Element {
  const { slotLabels, locations, injuryTypes, locationMatrix, injuryMatrix } = matrix
  const isSplit = locations.length + injuryTypes.length > SPLIT_THRESHOLD

  return (
    <div
      data-landscape="true"
      style={{
        width: PAGE_W,
        height: 794,
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold' }}>時間帯別集計表</div>
        <div style={{ fontSize: 10, color: '#555' }}>集計期間：{periodLabel}</div>
      </div>

      {slotLabels.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', paddingTop: 60, fontSize: 10 }}>
          対象期間にデータがありません。
        </div>
      ) : isSplit ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 場所別テーブル */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>場所別</div>
            <table style={{ borderCollapse: 'collapse', fontSize: 9, width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: '#fff' }}>
                  <th style={{ ...th(), width: 80, textAlign: 'center' }}>時間帯</th>
                  {locations.map((col) => (
                    <th key={`loc-${col}`} style={{ ...th(), textAlign: 'center' }}>{col}</th>
                  ))}
                  <th style={{ ...th(), width: 40, textAlign: 'center' }}>合計</th>
                </tr>
              </thead>
              <tbody>
                {slotLabels.map((slot, idx) => {
                  const locRow = locationMatrix[slot] ?? {}
                  const rowTotal = locations.reduce((sum, col) => sum + (locRow[col] ?? 0), 0)
                  return (
                    <tr key={slot} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f0f4ff' }}>
                      <td style={{ ...td(), textAlign: 'center', fontWeight: 'bold' }}>{slot}</td>
                      {locations.map((col) => (
                        <td key={`loc-${col}`} style={{ ...td(), textAlign: 'center' }}>
                          {locRow[col] ? locRow[col] : ''}
                        </td>
                      ))}
                      <td style={{ ...td(), textAlign: 'center', fontWeight: 'bold', backgroundColor: '#dbeafe' }}>
                        {rowTotal || ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* けがの種類別テーブル */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>けがの種類別</div>
            <table style={{ borderCollapse: 'collapse', fontSize: 9, width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: '#fff' }}>
                  <th style={{ ...th(), width: 80, textAlign: 'center' }}>時間帯</th>
                  {injuryTypes.map((col) => (
                    <th key={`inj-${col}`} style={{ ...th(), textAlign: 'center' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slotLabels.map((slot, idx) => {
                  const injRow = injuryMatrix[slot] ?? {}
                  return (
                    <tr key={slot} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f0f4ff' }}>
                      <td style={{ ...td(), textAlign: 'center', fontWeight: 'bold' }}>{slot}</td>
                      {injuryTypes.map((col) => (
                        <td key={`inj-${col}`} style={{ ...td(), textAlign: 'center' }}>
                          {injRow[col] ? injRow[col] : ''}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 9, width: '100%' }}>
            <thead>
              {/* 1行目: グループヘッダー */}
              <tr style={{ backgroundColor: '#1e40af', color: '#fff' }}>
                <th style={{ ...th(), width: 80, textAlign: 'center' }} rowSpan={2}>時間帯</th>
                <th style={{ ...th(), textAlign: 'center' }} colSpan={locations.length}>場所別</th>
                <th style={{ ...th(), textAlign: 'center' }} colSpan={injuryTypes.length}>けがの種類別</th>
                <th style={{ ...th(), width: 40, textAlign: 'center' }} rowSpan={2}>合計</th>
              </tr>
              {/* 2行目: 列ラベル */}
              <tr style={{ backgroundColor: '#3b5fc0', color: '#fff' }}>
                {locations.map((col) => (
                  <th key={`loc-${col}`} style={{ ...th(), textAlign: 'center' }}>{col}</th>
                ))}
                {injuryTypes.map((col) => (
                  <th key={`inj-${col}`} style={{ ...th(), textAlign: 'center' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slotLabels.map((slot, idx) => {
                const locRow = locationMatrix[slot] ?? {}
                const injRow = injuryMatrix[slot] ?? {}
                const rowTotal = locations.reduce((sum, col) => sum + (locRow[col] ?? 0), 0)
                return (
                  <tr key={slot} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f0f4ff' }}>
                    <td style={{ ...td(), textAlign: 'center', fontWeight: 'bold' }}>{slot}</td>
                    {locations.map((col) => (
                      <td key={`loc-${col}`} style={{ ...td(), textAlign: 'center' }}>
                        {locRow[col] ? locRow[col] : ''}
                      </td>
                    ))}
                    {injuryTypes.map((col) => (
                      <td key={`inj-${col}`} style={{ ...td(), textAlign: 'center' }}>
                        {injRow[col] ? injRow[col] : ''}
                      </td>
                    ))}
                    <td style={{ ...td(), textAlign: 'center', fontWeight: 'bold', backgroundColor: '#dbeafe' }}>
                      {rowTotal || ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function th(): React.CSSProperties {
  return {
    padding: '4px 6px',
    border: '1px solid #93c5fd',
    whiteSpace: 'nowrap',
  }
}

function td(): React.CSSProperties {
  return {
    padding: '3px 6px',
    border: '1px solid #e5e7eb',
  }
}
