$TaskName = 'Tizen Dashboard Button Redirect'
$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Task) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
& (Join-Path $PSScriptRoot 'Stop-ButtonRedirect.ps1')

