/**
 * テスト用シードデータ生成スクリプト
 * 対象期間: 2025-04-01 〜 2026-03-31
 * 実行: node scripts/seed.mjs
 */
import initSqlJs from '../node_modules/sql.js/dist/sql-wasm.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(
  process.env.APPDATA,
  'risk-manager',
  'riskmanager.db'
)
const WASM_PATH = join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

// --- マスタデータ定義 ---
const LOCATIONS = ['保育室', '園庭', 'トイレ', '廊下', '遊戯室', '食堂', '玄関', '階段']
const CLASSES = ['０歳児クラス', '１歳児クラス', '２歳児クラス', '３歳児クラス', '４歳児クラス', '５歳児クラス']
const INJURY_TYPES = ['擦り傷', '切り傷', '打撲', '捻挫', '虫刺され', '頭部打撲', 'やけど', 'その他']

// --- 子どもの名前サンプル ---
const CHILD_NAMES = [
  '山田 太郎', '鈴木 花子', '佐藤 健太', '田中 さくら', '伊藤 蓮',
  '渡辺 ひまり', '山本 大輝', '中村 あおい', '小林 翔太', '加藤 ゆい',
  '吉田 颯太', '松本 みなみ', '井上 陸', '木村 はな', '林 悠斗',
  '斎藤 ことね', '清水 海斗', '山口 りな', '橋本 朝陽', '阿部 まひろ',
  '石川 蒼', '田村 こころ', '前田 湊', '藤田 ほのか', '後藤 春樹',
  '岡田 柚希', '長谷川 大和', '村田 芽依', '近藤 龍之介', '坂本 葵',
]

// --- 事故内容テンプレート ---
const DESCRIPTION_TEMPLATES = {
  '擦り傷': [
    '園庭で走っていて転倒し、膝を擦り傷した。消毒・処置済み。',
    '遊具から降りる際にバランスを崩し、手のひらを擦り傷した。',
    '廊下で滑って転び、肘に擦り傷ができた。',
    '砂場で遊中に転倒し、膝と手に擦り傷を負った。',
  ],
  '切り傷': [
    '工作中にはさみで指を切ってしまった。止血後に保護者へ連絡済み。',
    '棚の角に指がぶつかり、小さな切り傷ができた。',
    '食事中に食器が割れ、手に軽い切り傷を負った。',
  ],
  '打撲': [
    '椅子から落ちて背中を打撲した。経過観察中。',
    '友達と遊んでいる際に頭同士がぶつかり、おでこを打撲した。',
    '遊具に身体をぶつけ、脚を打撲した。',
    '走っていてドアに腕をぶつけ打撲した。',
  ],
  '捻挫': [
    '園庭で遊んでいてジャンプした際に着地に失敗し、足首を捻挫した。',
    '遊戯室での運動中に足を踏み外し、足首を軽く捻った。',
  ],
  '虫刺され': [
    '園庭での外遊び中に蜂に刺された。アレルギー反応なし、保護者へ連絡済み。',
    '砂場近くで遊んでいた際に虫に刺され、腕が腫れた。',
    '外遊び後に腕に虫刺されを発見。かゆみあり、保護者へ報告。',
  ],
  '頭部打撲': [
    '遊具から落下し頭部を打撲した。意識清明・経過観察中。',
    '室内で転倒し後頭部を床に打ちつけた。保護者へ連絡、受診を勧めた。',
    '友達と走って遊んでいる際に衝突し、頭を打った。しばらく安静にさせた。',
  ],
  'やけど': [
    '給食の汁物が腕にかかり軽いやけどを負った。冷却処置済み。',
    '熱い飲み物に触れてしまい、指に軽いやけどをした。',
  ],
  'その他': [
    '目に砂が入り、洗浄処置を行った。',
    '鼻血が出た。止血処置済み、経過良好。',
    '歯を食器にぶつけ、口の中を軽く傷つけた。',
    '爪が割れて指先が痛い状態になった。手当て済み。',
    '転倒時に噛んで舌を少し切ってしまった。',
  ],
}

// --- 乱数ユーティリティ ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randItem(arr) {
  return arr[randInt(0, arr.length - 1)]
}

// 2025-04-01 〜 2026-03-31 の範囲でランダムなDateTimeを生成
// フォームと同じローカル時刻形式 YYYY-MM-DDTHH:MM で返す（UTC変換しない）
function randDateTime() {
  const start = new Date('2025-04-01')
  const end   = new Date('2026-03-31')
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  const d  = new Date(ts)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const hh   = String(randInt(7, 18)).padStart(2, '0')
  const min  = String(randInt(0, 59)).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

async function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`DBファイルが見つかりません: ${DB_PATH}`)
    process.exit(1)
  }

  const wasmBinary = readFileSync(WASM_PATH)
  const SQL = await initSqlJs({ wasmBinary })
  const buffer = readFileSync(DB_PATH)
  const db = new SQL.Database(buffer)

  // 既存の seed データをクリア（マスタデータは保持）
  db.run('DELETE FROM incidents')

  // --- マスタデータ挿入（なければ追加）---
  for (const name of LOCATIONS) {
    db.run('INSERT OR IGNORE INTO locations (name) VALUES (?)', [name])
  }
  for (const name of CLASSES) {
    db.run('INSERT OR IGNORE INTO classes (name) VALUES (?)', [name])
  }
  for (const name of INJURY_TYPES) {
    db.run('INSERT OR IGNORE INTO injury_types (name) VALUES (?)', [name])
  }

  // マスタIDマップを取得
  const locRows = db.exec('SELECT id, name FROM locations')[0]?.values ?? []
  const clsRows = db.exec('SELECT id, name FROM classes')[0]?.values ?? []
  const injRows = db.exec('SELECT id, name FROM injury_types')[0]?.values ?? []

  const locMap = Object.fromEntries(locRows.map(([id, name]) => [name, id]))
  const clsMap = Object.fromEntries(clsRows.map(([id, name]) => [name, id]))
  const injMap = Object.fromEntries(injRows.map(([id, name]) => [name, id]))

  console.log('場所:', Object.keys(locMap))
  console.log('クラス:', Object.keys(clsMap))
  console.log('けがの種類:', Object.keys(injMap))

  // --- 100件の事案を挿入 ---
  // location列が残っているか確認
  const cols = db.exec('PRAGMA table_info(incidents)')[0]?.values.map((r) => r[1]) ?? []
  const hasLegacyLocation = cols.includes('location')

  const INSERT_SQL = hasLegacyLocation
    ? `INSERT INTO incidents (occurred_at, location, location_id, class_id, child_name, injury_type_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    : `INSERT INTO incidents (occurred_at, location_id, class_id, child_name, injury_type_id, description)
       VALUES (?, ?, ?, ?, ?, ?)`

  let count = 0
  for (let i = 0; i < 100; i++) {
    const injuryType = randItem(INJURY_TYPES)
    const templates = DESCRIPTION_TEMPLATES[injuryType]
    const description = randItem(templates)
    const location = randItem(LOCATIONS)
    const cls = randItem(CLASSES)
    const childName = randItem(CHILD_NAMES)
    const occurredAt = randDateTime()

    const params = hasLegacyLocation
      ? [occurredAt, location, locMap[location], clsMap[cls], childName, injMap[injuryType], description]
      : [occurredAt, locMap[location], clsMap[cls], childName, injMap[injuryType], description]

    db.run(INSERT_SQL, params)
    count++
  }

  // 保存
  const data = db.export()
  writeFileSync(DB_PATH, Buffer.from(data))
  console.log(`✓ ${count}件の事案を挿入しました`)

  // 確認
  const total = db.exec('SELECT COUNT(*) FROM incidents')[0]?.values[0][0]
  console.log(`DBの事案総数: ${total}件`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
