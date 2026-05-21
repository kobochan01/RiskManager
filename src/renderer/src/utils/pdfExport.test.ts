import { describe, it, expect } from 'vitest'
import { buildPdfFileName } from './pdfExport'

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
