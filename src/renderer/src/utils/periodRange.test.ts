import { describe, it, expect } from 'vitest'
import { getPeriodRange } from './periodRange'

describe('getPeriodRange - month', () => {
  it('1月（31日）の範囲を返す', () => {
    expect(getPeriodRange('month', 2026, 1, 1)).toEqual({ from: '2026-01-01', to: '2026-01-31' })
  })

  it('2月（平年・28日）の範囲を返す', () => {
    expect(getPeriodRange('month', 2025, 2, 1)).toEqual({ from: '2025-02-01', to: '2025-02-28' })
  })

  it('2月（うるう年・29日）の範囲を返す', () => {
    expect(getPeriodRange('month', 2024, 2, 1)).toEqual({ from: '2024-02-01', to: '2024-02-29' })
  })

  it('12月の範囲を返す', () => {
    expect(getPeriodRange('month', 2026, 12, 1)).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })
})

describe('getPeriodRange - quarter', () => {
  it('Q1（4〜6月）は同じ年の範囲を返す', () => {
    expect(getPeriodRange('quarter', 2025, 5, 1)).toEqual({ from: '2025-04-01', to: '2025-06-30' })
  })

  it('Q2（7〜9月）は同じ年の範囲を返す', () => {
    expect(getPeriodRange('quarter', 2025, 8, 2)).toEqual({ from: '2025-07-01', to: '2025-09-30' })
  })

  it('Q3（10〜12月）は同じ年の範囲を返す', () => {
    expect(getPeriodRange('quarter', 2025, 11, 3)).toEqual({ from: '2025-10-01', to: '2025-12-31' })
  })

  it('Q4（1〜3月）は翌年の範囲を返す（年度またぎ）', () => {
    // 2025年度Q4 = 2026年1〜3月
    expect(getPeriodRange('quarter', 2025, 1, 4)).toEqual({ from: '2026-01-01', to: '2026-03-31' })
  })

  it('Q4（1〜3月）は翌年のうるう年に対応する', () => {
    // 2023年度Q4 = 2024年1〜3月（2024はうるう年だが3月は31日）
    expect(getPeriodRange('quarter', 2023, 1, 4)).toEqual({ from: '2024-01-01', to: '2024-03-31' })
  })
})

describe('getPeriodRange - year', () => {
  it('年度の範囲は4/1〜翌年3/31を返す', () => {
    expect(getPeriodRange('year', 2025, 1, 1)).toEqual({ from: '2025-04-01', to: '2026-03-31' })
  })

  it('年度をまたぐ計算が正しい（2024年度）', () => {
    expect(getPeriodRange('year', 2024, 1, 1)).toEqual({ from: '2024-04-01', to: '2025-03-31' })
  })
})
