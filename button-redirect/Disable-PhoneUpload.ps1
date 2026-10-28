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

Write-Host 'Phone photo uploads are disabled.'

