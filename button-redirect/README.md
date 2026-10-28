# Optional companion helper

Samsung does not deliver physical Home or branded streaming keys to an ordinary Tizen web app.
This helper observes the TV's local application API and launches the dashboard after configured
transitions. It does not modify firmware or the TV's key map.

The helper can also host a small PIN-protected photo inbox. The dashboard copies synchronized
images into TV storage, so the images remain available while the helper is offline.

## Prepare the configuration

Copy `config.example.toml` to `config.toml`, then edit:

- `tv.host`: reserved LAN address of your TV
- `tv.dashboard`: installed Tizen application ID
- `prime_apps`: regional app IDs used to detect a branded key
- `return_from_apps`: apps after which a Home transition should return to the dashboard
- `photos.pin`: a new private PIN; never use the example value

The configuration, pairing tokens, uploaded photos, and logs are ignored by Git.

## Windows

Requirements: Windows 10/11 and Python 3.11 or newer.

```powershell
py -3 -m venv ..\.venv-couchctl
Copy-Item .\config.example.toml .\config.toml
.\Start-ButtonRedirect.ps1
.\Install-Autostart.ps1
```

The scheduled task starts at Windows sign-in. `Stop-ButtonRedirect.ps1` stops the processes and
`Remove-Autostart.ps1` removes automatic startup.

If you want phone uploads, allow inbound TCP 8096 only on the private/local subnet. Never create a
router port-forward for it.

## Raspberry Pi Zero 2 W

Use Raspberry Pi OS Lite 64-bit and a reliable wall power supply. TV USB ports often switch off
during standby, which prevents the helper from seeing TV startup.

```bash
sudo apt update
sudo apt install -y git python3
sudo useradd --system --home /opt/tizen-dashboard --shell /usr/sbin/nologin dashboard
sudo git clone YOUR_REPOSITORY_URL /opt/tizen-dashboard
sudo install -d -o dashboard -g dashboard /etc/tizen-dashboard /var/log/tizen-dashboard
sudo cp /opt/tizen-dashboard/button-redirect/config.example.toml /etc/tizen-dashboard/config.toml
sudo nano /etc/tizen-dashboard/config.toml
sudo chown dashboard:dashboard /etc/tizen-dashboard/config.toml /var/log/tizen-dashboard
sudo chmod 600 /etc/tizen-dashboard/config.toml
sudo cp /opt/tizen-dashboard/button-redirect/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tizen-dashboard.service tizen-dashboard-photos.service
```

Check status:

```bash
systemctl status tizen-dashboard.service tizen-dashboard-photos.service
journalctl -u tizen-dashboard.service -n 50 --no-pager
```

Open `http://PI_ADDRESS:8096` from a phone on the same Wi-Fi to use the photo inbox.

## Behaviour and limits

- A ten-second grace period avoids immediately fighting normal Samsung navigation.
- Dashboard-triggered Wi-Fi, Bluetooth, Settings, screen sharing, Live TV, and HDMI exits are not
  redirected.
- Regional app IDs and firmware behaviour vary. Test each configured app on your own TV.
- The helper is a practical workaround, not a guarantee that Samsung firmware will never change.
