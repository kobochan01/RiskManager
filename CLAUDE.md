# RiskManager プロジェクト

## アプリの起動・再起動

`npm run dev` は `SET ELECTRON_RUN_AS_NODE=&&` を含む cmd 構文のため、
PowerShell から `Start-Process -FilePath "npm"` で直接呼び出すとメモ帳が開く。

**必ず以下のコマンドを使うこと：**

```powershell
# 起動（コンソールウィンドウ非表示）
Start-Process cmd -ArgumentList "/c npm run dev" -WorkingDirectory "C:\Projects\RiskManager" -WindowStyle Hidden

# 終了
Get-Process | Where-Object { $_.Name -like "*electron*" } | Stop-Process -Force

# 再起動（終了 → 起動）
Get-Process | Where-Object { $_.Name -like "*electron*" } | Stop-Process -Force
Start-Sleep 1
Start-Process cmd -ArgumentList "/c npm run dev" -WorkingDirectory "C:\Projects\RiskManager" -WindowStyle Hidden
```

## GitHub ワークフロー

- ラベル: `bug` / `enhancement` / `documentation` / `chore`
- PR テンプレート: `.github/PULL_REQUEST_TEMPLATE.md`
