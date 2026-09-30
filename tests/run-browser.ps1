# Runs TerpTaste's browser tests in headless Microsoft Edge (Windows PowerShell 5.1+).
#   powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1            # all suites
#   powershell -ExecutionPolicy Bypass -File tests\run-browser.ps1 -Only deals # one suite
#
# Each suite is a script (tests/browser/*.js) appended to a copy of index.html, with a
# <base> pointing back at the repo so every asset loads. The script clicks through the app
# and writes what it observed as JSON into <pre id="RESULT">. A suite FAILS if it produces
# no result or records any page errors; otherwise the observed values are printed for review.
# Note: most suites report observations rather than assert them, so read the output.
param([string]$Only = '')

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rootUrl = 'file:///' + ($root -replace '\\', '/')
$out = Join-Path $env:TEMP 'terptaste-tests'
New-Item -ItemType Directory -Force $out | Out-Null
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { Write-Error 'Microsoft Edge not found.'; exit 2 }

$index = Get-Content (Join-Path $root 'index.html') -Raw
$page = ($index -replace '<head>', "<head><base href=""$rootUrl/"">") -replace '</body>\s*</html>\s*$', ''
$legacy = '<script>localStorage.setItem(''terptaste:user:v1'',''{"checkIns":[{"id":"marathon","date":"2026-09-20"}]}'');</script>'

$suites = @(
  @{ name = 'filters';              file = 'filters.js' },
  @{ name = 'detail-saved-undo';    file = 'detail-saved-undo.js' },
  @{ name = 'detail-loading-error'; file = 'detail-loading-error.js' },
  @{ name = 'vote-nav';             file = 'vote-nav.js' },
  @{ name = 'vote-final';           file = 'vote-final.js';   query = '?friendsVote=1' },
  @{ name = 'deals';                file = 'deals.js';        query = '?today=mon' },
  @{ name = 'crew-reviews';         file = 'crew-reviews.js' },
  @{ name = 'discover';             file = 'discover.js';     prelude = '<script>localStorage.clear();</script>' },
  @{ name = 'legacy-checkins';      file = 'legacy-checkins.js'; prelude = $legacy },
  @{ name = 'a11y';                 file = 'a11y.js' },
  @{ name = 'states-loading';       file = 'states.js';       query = '?delay=900' },
  @{ name = 'states-error';         file = 'states.js';       query = '?fail=1' }
)

# Every run gets a brand-new browser profile (fresh localStorage) that is deleted
# afterwards, so results never depend on a previous run.
function New-Profile { Join-Path $out ('profile-' + [guid]::NewGuid().ToString('N')) }
function Remove-Profile($p) { if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue } }

$failed = 0
foreach ($s in $suites) {
  if ($Only -and $s.name -notlike "*$Only*") { continue }
  $html = $page
  if ($s.prelude) { $html = $html -replace '<script src="js/data/mock-places.js"></script>', ($s.prelude + '<script src="js/data/mock-places.js"></script>') }
  $html + (Get-Content (Join-Path $root "tests\browser\$($s.file)") -Raw) + '</body></html>' | Set-Content -Encoding utf8 (Join-Path $out "$($s.name).html")
  $url = "file:///" + (($out -replace '\\', '/') + "/$($s.name).html") + $s.query
  $prof = New-Profile
  $dom = & $edge --headless=new --disable-gpu --allow-file-access-from-files "--user-data-dir=$prof" --window-size=1280,900 --virtual-time-budget=40000 --dump-dom $url 2>$null | Out-String
  Remove-Profile $prof
  if ($dom -match '<pre id="RESULT">(.*?)</pre>') {
    $r = $Matches[1] | ConvertFrom-Json
    $errs = @($r.errors | Where-Object { $_ }) + @($r.errorsOtherThanTestSwitch | Where-Object { $_ })
    $status = if ($errs.Count) { $failed++; 'FAIL' } else { 'ok  ' }
    "[$status] $($s.name)$($s.query)  page errors: $($errs.Count)"
    ($r | ConvertTo-Json -Depth 5 -Compress)
  } else { $failed++; "[FAIL] $($s.name)$($s.query)  no result (the page didn't finish)" }
}

if (-not $Only -or 'responsive' -like "*$Only*") {
  (Get-Content (Join-Path $root 'tests\browser\responsive.html') -Raw) -replace '\{\{ROOT\}\}', $rootUrl | Set-Content -Encoding utf8 (Join-Path $out 'responsive.html')
  $prof = New-Profile
  $dom = & $edge --headless=new --disable-gpu --allow-file-access-from-files "--user-data-dir=$prof" --window-size=1700,900 --virtual-time-budget=40000 --dump-dom ("file:///" + ($out -replace '\\', '/') + '/responsive.html') 2>$null | Out-String
  Remove-Profile $prof
  if ($dom -match '<pre id="RESULT">(\{.*?\})</pre>') {
    $j = $Matches[1]
    $status = if ($j -match 'OVER') { $failed++; 'FAIL' } else { 'ok  ' }
    "[$status] responsive (320/375/768/1280/1600px, no horizontal scroll)"
    $j
  } else { $failed++; '[FAIL] responsive  no result' }
}

"`n$failed suite(s) failed."
exit $failed
