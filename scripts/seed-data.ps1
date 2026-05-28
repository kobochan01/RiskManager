$dbPath = "$env:APPDATA\RiskManager\riskmanager.db"
$sqlFile = "c:\Project\RiskManager\scripts\seed-data.sql"

$sqlite3cmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
$sqlite = if ($sqlite3cmd) { $sqlite3cmd.Source } else { "$env:LOCALAPPDATA\Microsoft\WinGet\Links\sqlite3.exe" }

if (-not (Test-Path $dbPath)) {
    Write-Error "DBファイルが見つかりません: $dbPath`nアプリを一度起動・終了してから実行してください。"
    exit 1
}

& $sqlite $dbPath ".read $sqlFile"
Write-Host "完了！アプリを起動して確認してください。"
