$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env'
$examplePath = Join-Path $root '.env.example'

if (-not (Test-Path -LiteralPath $examplePath)) {
  throw '.env.example was not found.'
}

$needsCreate = -not (Test-Path -LiteralPath $envPath)
if (-not $needsCreate) {
  $existing = Get-Content -LiteralPath $envPath -Raw
  $needsCreate = $existing -match 'AUTH_SECRET=\$\(openssl rand -base64 32\)' -or $existing -notmatch '(?m)^PORT='
}

if ($needsCreate) {
  Copy-Item -LiteralPath $examplePath -Destination $envPath -Force
}

$content = Get-Content -LiteralPath $envPath -Raw
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
try {
  $rng.GetBytes($bytes)
} finally {
  $rng.Dispose()
}
$secret = [Convert]::ToBase64String($bytes)

if ($content -match '(?m)^AUTH_SECRET=(CHANGE_ME_GENERATE_WITH_openssl_rand_base64_32|\$\(openssl rand -base64 32\)|\s*)\s*$') {
  $content = $content -replace '(?m)^AUTH_SECRET=.*$', "AUTH_SECRET=$secret"
}

$content = $content -replace '(?m)^NODE_ENV=.*$', 'NODE_ENV=production'
$content = $content -replace '(?m)^CORS_ORIGIN=.*$', 'CORS_ORIGIN=*'
if ($content -match '(?m)^#?\s*AUTH_TRUSTED_ORIGINS=') {
  $content = $content -replace '(?m)^#?\s*AUTH_TRUSTED_ORIGINS=.*$', 'AUTH_TRUSTED_ORIGINS=*'
} else {
  $content = $content.TrimEnd() + "`r`nAUTH_TRUSTED_ORIGINS=*`r`n"
}
$content = $content -replace '(?m)^PASSKEY_ORIGIN=.*$', 'PASSKEY_ORIGIN=http://localhost:5003'

Set-Content -LiteralPath $envPath -Value $content -Encoding UTF8

$binDir = Join-Path $PSScriptRoot '.bin'
if (-not (Test-Path -LiteralPath $binDir)) {
  New-Item -ItemType Directory -Path $binDir | Out-Null
}

$opencodeCommand = Get-Command opencode -ErrorAction SilentlyContinue
if ($opencodeCommand) {
  $opencodeSource = $opencodeCommand.Source
  $shimPath = Join-Path $binDir 'opencode.cmd'
  if ($opencodeSource.EndsWith('.ps1', [System.StringComparison]::OrdinalIgnoreCase)) {
    $shim = "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$opencodeSource`" %*`r`n"
  } else {
    $shim = "@echo off`r`n`"$opencodeSource`" %*`r`n"
  }
  Set-Content -LiteralPath $shimPath -Value $shim -Encoding ASCII
}
