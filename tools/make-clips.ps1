# 金曲猜歌王 — 音檔批次剪輯
#
# 讀 tools/clips.csv,把每一首來源檔剪成 15 秒的 audio/<id>.m4a。
# 只處理有填 source 和 start 的列,其他的略過,可以分好幾次慢慢補。
#
#   .\tools\make-clips.ps1              剪好還沒剪過的
#   .\tools\make-clips.ps1 -Force       全部重剪
#   .\tools\make-clips.ps1 -Seconds 12  改片段長度
#
# 需要先安裝 ffmpeg:  winget install Gyan.FFmpeg

param(
  [int]$Seconds = 15,
  [switch]$Force
)

$root = Split-Path -Parent $PSScriptRoot
$csv  = Join-Path $PSScriptRoot 'clips.csv'
$out  = Join-Path $root 'audio'

$ffmpeg = $null
try { $ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source } catch { }
if (-not $ffmpeg) {
  Write-Host ""
  Write-Host "找不到 ffmpeg。先安裝再跑一次:" -ForegroundColor Yellow
  Write-Host "    winget install Gyan.FFmpeg"
  Write-Host "裝完要開一個新的終端機視窗,PATH 才會更新。"
  Write-Host ""
  exit 1
}

if (-not (Test-Path $csv)) {
  Write-Host "找不到 $csv" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

$rows    = Import-Csv -Path $csv
$done    = 0
$skipped = 0
$failed  = @()
$todo    = @()

foreach ($row in $rows) {
  $id = $row.id.Trim()
  if ([string]::IsNullOrWhiteSpace($id)) { continue }

  $src   = $row.source.Trim()
  $start = $row.start.Trim()
  $dest  = Join-Path $out "$id.m4a"

  # 還沒填來源的,記下來最後一起提醒
  if ([string]::IsNullOrWhiteSpace($src) -or [string]::IsNullOrWhiteSpace($start)) {
    $todo += "$id  ($($row.title) — $($row.artist))"
    continue
  }

  if ((Test-Path $dest) -and (-not $Force)) {
    $skipped++
    continue
  }

  if (-not (Test-Path $src)) {
    $failed += "$id  找不到來源檔:$src"
    continue
  }

  # start 只填數字就當作秒數,也可以填 1:02 或 00:01:02
  if ($start -match '^\d+(\.\d+)?$') { $ss = $start } else { $ss = $start }

  Write-Host ("剪 {0,-18} {1} @ {2}" -f $id, $row.title, $start)
  & $ffmpeg -y -loglevel error -ss $ss -t $Seconds -i $src -vn -c:a aac -b:a 96k -ar 44100 $dest
  if ($LASTEXITCODE -eq 0) {
    $done++
  } else {
    $failed += "$id  ffmpeg 失敗(檢查 start 是否超過歌曲長度)"
  }
}

Write-Host ""
Write-Host "===== 結果 =====" -ForegroundColor Cyan
Write-Host "剪好      $done 首"
Write-Host "已存在略過 $skipped 首   (要重剪加 -Force)"

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "失敗 $($failed.Count) 首:" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  $_" }
}

if ($todo.Count -gt 0) {
  Write-Host ""
  Write-Host "還沒填來源的有 $($todo.Count) 首:" -ForegroundColor Yellow
  $todo | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
  if ($todo.Count -gt 10) { Write-Host "  ...還有 $($todo.Count - 10) 首" }
  Write-Host ""
  Write-Host "沒有音檔的歌,遊戲會繼續用合成的示範音,流程照樣跑得完。"
}
Write-Host ""
