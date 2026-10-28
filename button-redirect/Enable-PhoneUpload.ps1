$ErrorActionPreference = 'Stop'

$RuleName = 'Tizen Dashboard Photos'
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $IsAdmin) {
    $PowerShell = (Get-Command powershell.exe).Source
    $Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"'
    Start-Process -FilePath $PowerShell -Verb RunAs -ArgumentList $Arguments -Wait
    exit
}

Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule

New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow `
    -Protocol TCP -LocalPort 8096 -RemoteAddress LocalSubnet -Profile Private,Public `
    -Description 'Allow phones and the Samsung TV on the local subnet to upload Dashboard backgrounds.' | Out-Null

Write-Host 'Phone photo uploads are enabled on TCP 8096 for the local subnet.'

