$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$PythonW = Join-Path $Root '.venv-couchctl\Scripts\pythonw.exe'
$Watcher = Join-Path $PSScriptRoot 'watch_buttons.py'
$PhotoServer = Join-Path $PSScriptRoot 'photo_server.py'
$Config = Join-Path $PSScriptRoot 'config.toml'
$Log = Join-Path $PSScriptRoot 'button-redirect.log'

if (-not (Test-Path -LiteralPath $PythonW)) {
    throw "Missing redirector Python environment: $PythonW"
}

$Running = Get-CimInstance Win32_Process -Filter "Name = 'pythonw.exe'"
$AlreadyRunning = $Running |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Watcher) }
if (-not $AlreadyRunning) {
    $Arguments = @(
        '"' + $Watcher + '"',
        '--config', '"' + $Config + '"',
        '--log', '"' + $Log + '"'
    ) -join ' '

    Start-Process -FilePath $PythonW -ArgumentList $Arguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}

$PhotoRunning = $Running |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($PhotoServer) }
if (-not $PhotoRunning) {
    $PhotoArguments = @(
        '"' + $PhotoServer + '"',
        '--config', '"' + $Config + '"'
    ) -join ' '

    Start-Process -FilePath $PythonW -ArgumentList $PhotoArguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}

