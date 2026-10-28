$Watcher = Join-Path $PSScriptRoot 'watch_buttons.py'
$PhotoServer = Join-Path $PSScriptRoot 'photo_server.py'
$Processes = Get-CimInstance Win32_Process -Filter "Name = 'pythonw.exe'" |
    Where-Object {
        $_.CommandLine -and ($_.CommandLine.Contains($Watcher) -or $_.CommandLine.Contains($PhotoServer))
    }

foreach ($Process in $Processes) {
    Stop-Process -Id $Process.ProcessId -Force
}

