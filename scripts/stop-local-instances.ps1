param(
  [string]$Root
)

$ErrorActionPreference = 'Stop'

$cleanRoot = if ([string]::IsNullOrWhiteSpace($Root)) { Get-Location } else { $Root.Trim('"') }
$resolvedRoot = [System.IO.Path]::GetFullPath($cleanRoot).TrimEnd('\')
$escapedRoot = [Regex]::Escape($resolvedRoot)
$backendPattern = "$escapedRoot[\\/]+backend[\\/]+dist[\\/]+index\.js"
$opencodeServePattern = 'opencode(?:\.cmd)?\s+serve\b'
$backendProcessNames = @('bun.exe', 'bun')
$opencodeProcessNames = @('cmd.exe', 'cmd', 'node.exe', 'node', 'bun.exe', 'bun', 'opencode.exe', 'opencode')
$ports = @(5003, 5551)

$currentProcessId = $PID
$processTargets = Get-CimInstance Win32_Process |
  Where-Object {
    $commandLine = $_.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) {
      return $false
    }

    $isBackend = $backendProcessNames -contains $_.Name -and $commandLine -match $backendPattern
    $isOpenCode = $opencodeProcessNames -contains $_.Name -and $commandLine -match $opencodeServePattern -and $commandLine -match '--port\s+5551\b'

    ($isBackend -or $isOpenCode) -and $_.ProcessId -ne $currentProcessId
  }

$portTargets = foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Get-CimInstance Win32_Process -Filter "ProcessId = $($_.OwningProcess)" -ErrorAction SilentlyContinue
    }
}

$targets = @($processTargets) + @($portTargets) |
  Where-Object { $_ -and $_.ProcessId -ne $currentProcessId } |
  Sort-Object ProcessId -Unique

if (-not $targets) {
  Write-Host 'No old local OpenCode Manager instances found.'
  exit 0
}

foreach ($target in $targets) {
  Write-Host "Stopping old instance PID $($target.ProcessId): $($target.Name)"
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500
