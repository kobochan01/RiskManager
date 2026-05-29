import { describe, it, expect } from 'vitest'
import { buildPdfFileName, splitIncidentsIntoPages } from './pdfExport'
import type { IncidentRow } from './pdfExport'

function makeRows(n: number): IncidentRow[] {
  return Array.from({ length: n }, (_, i) => [
    i + 1, '2026-01-01T09:00', 'ヒヤリハット', '園庭', '年少', `子供${i + 1}`, '打撲', '説明',
  ] as IncidentRow)
}

describe('buildPdfFileName', () => {
  it('今月: 開始日のYYYYMMを使ったファイル名を返す', () => {
    expect(buildPdfFileName('2026-05-01')).toBe('report_202605.pdf')
  })

  it('今四半期: 開始日のYYYYMMを使ったファイル名を返す', () => {
    expect(buildPdfFileName('2026-04-01')).toBe('report_202604.pdf')
  })

  it('今年: 開始日のYYYYMMを使ったファイル名を返す', () => {
    expect(buildPdfFileName('2026-01-01')).toBe('report_202601.pdf')
  })

  it('カスタム: 開始日のYYYYMMを使ったファイル名を返す', () => {
    expect(buildPdfFileName('2025-12-15')).toBe('report_202512.pdf')
  })

  it('fromが空の場合はデフォルトファイル名を返す', () => {
    expect(buildPdfFileName('')).toBe('report.pdf')
  })
})

describe('splitIncidentsIntoPages', () => {
  it('0件のとき [[]] を返す（空ページが1つ）', () => {
    expect(splitIncidentsIntoPages([])).toEqual([[]])
  })

  it('1件のとき1ページに収まる', () => {
    const pages = splitIncidentsIntoPages(makeRows(1))
    expect(pages).toHaveLength(1)
    expect(pages[0]).toHaveLength(1)
  })

  it('30件ちょうどのとき1ページに収まる（境界値）', () => {
    const pages = splitIncidentsIntoPages(makeRows(30))
    expect(pages).toHaveLength(1)
    expect(pages[0]).toHaveLength(30)
  })

  it('31件のとき2ページに分割される（境界値+1）', () => {
    const pages = splitIncidentsIntoPages(makeRows(31))
    expect(pages).toHaveLength(2)
    expect(pages[0]).toHaveLength(30)
    expect(pages[1]).toHaveLength(1)
  })

  it('60件のとき2ページに分割される', () => {
    const pages = splitIncidentsIntoPages(makeRows(60))
    expect(pages).toHaveLength(2)
    expect(pages[0]).toHaveLength(30)
    expect(pages[1]).toHaveLength(30)
  })

  it('61件のとき3ページに分割される', () => {
    const pages = splitIncidentsIntoPages(makeRows(61))
    expect(pages).toHaveLength(3)
    expect(pages[2]).toHaveLength(1)
  })
})
