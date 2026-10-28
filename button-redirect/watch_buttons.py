"""Redirect Samsung remote Home/Prime outcomes to Tizen Dashboard.

This does not modify the TV firmware or key map. Samsung does not expose the
physical keys to ordinary Tizen web apps. Instead, the watcher observes which
installed app is visible through the TV's local HTTP API:

* Prime Video becoming visible means the branded Prime key was pressed.
* A tracked streaming app disappearing with no replacement means Samsung Home
  was opened, normally by the physical Home key.

The watcher deliberately does not redirect when Dashboard opens Settings,
Bluetooth, Wi-Fi, screen sharing, Live TV, or HDMI.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import socket
import sys
import time
import tomllib
import urllib.error
import urllib.request
from pathlib import Path


def load_config(path: Path) -> dict:
    with path.open("rb") as stream:
        data = tomllib.load(stream)
    tv = data.get("tv") or {}
    required = ("host", "dashboard", "prime_apps", "return_from_apps")
    missing = [key for key in required if not tv.get(key)]
    if missing:
        raise ValueError("Missing config values: " + ", ".join(missing))
    tv["poll_seconds"] = max(0.25, float(tv.get("poll_seconds", 0.5)))
    tv["home_grace_seconds"] = max(0.5, float(tv.get("home_grace_seconds", 0.9)))
    tv["startup_delay_seconds"] = max(2.0, float(tv.get("startup_delay_seconds", 10.0)))
    return tv


class Log:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def write(self, message: str) -> None:
        stamp = dt.datetime.now().astimezone().isoformat(timespec="seconds")
        line = f"{stamp} {message}"
        with self.path.open("a", encoding="utf-8") as stream:
            stream.write(line + "\n")
        print(line, flush=True)


class SamsungLocalApi:
    def __init__(self, host: str):
        self.base = f"http://{host}:8001/api/v2/applications"

    def state(self, app_id: str) -> tuple[bool | None, bool | None]:
        try:
            with urllib.request.urlopen(f"{self.base}/{app_id}", timeout=1.5) as response:
                value = json.loads(response.read() or b"{}")
            return bool(value.get("running")), bool(value.get("visible"))
        except (OSError, ValueError, urllib.error.URLError):
            return None, None

    def launch(self, app_id: str) -> tuple[bool, str]:
        request = urllib.request.Request(f"{self.base}/{app_id}", method="POST", data=b"")
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                return 200 <= response.status < 300, f"HTTP {response.status}"
        except Exception as exc:  # keep the watcher alive during TV standby/reconnect
            return False, f"{type(exc).__name__}: {str(exc)[:160]}"


def visible_app(api: SamsungLocalApi, app_ids: list[str]) -> tuple[bool, str | None]:
    reached = False
    # Samsung's small port-8001 service drops connections when queried in
    # parallel. Keep this sequential and intentionally modest.
    for app_id in app_ids:
        running, visible = api.state(app_id)
        if running is not None:
            reached = True
        if visible:
            return True, app_id
    return reached, None


def singleton_socket(port: int = 47617) -> socket.socket:
    guard = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        guard.bind(("127.0.0.1", port))
        guard.listen(1)
        return guard
    except OSError as exc:
        guard.close()
        raise RuntimeError("The TV dashboard redirector is already running") from exc


def run(config_path: Path, log_path: Path) -> int:
    tv = load_config(config_path)
    log = Log(log_path)
    guard = singleton_socket()
    api = SamsungLocalApi(str(tv["host"]))
    dashboard = str(tv["dashboard"])
    prime_apps = {str(value) for value in tv["prime_apps"]}
    return_apps = {str(value) for value in tv["return_from_apps"]}
    candidates = [dashboard] + sorted(prime_apps | return_apps)

    previous: str | None = None
    none_since: float | None = None
    startup_since: float | None = None
    protected_none = False
    initialised = False
    reachable_before = False
    log.write(
        f"START host={tv['host']} dashboard={dashboard} "
        f"prime={','.join(sorted(prime_apps))}"
    )

    try:
        while True:
            reached, current = visible_app(api, candidates)
            now = time.monotonic()

            if not reached:
                if reachable_before:
                    log.write("TV unavailable or asleep; waiting")
                reachable_before = False
                initialised = False
                previous = None
                none_since = None
                startup_since = None
                protected_none = False
                time.sleep(2.0)
                continue

            if not reachable_before:
                log.write("TV reachable")
            reachable_before = True

            # Baseline the current screen after startup/reconnect. This avoids
            # redirecting an app that the user was already intentionally using.
            if not initialised:
                initialised = True
                previous = current
                none_since = None
                startup_since = now if current is None else None
                protected_none = False
                time.sleep(tv["poll_seconds"])
                continue

            if current is not None:
                none_since = None
                startup_since = None
                protected_none = False
                if current in prime_apps and current != previous:
                    ok, detail = api.launch(dashboard)
                    log.write(f"PRIME -> DASHBOARD {'OK' if ok else 'FAILED'} {detail}")
                    previous = dashboard if ok else current
                    time.sleep(1.0)
                    continue
                previous = current
                time.sleep(tv["poll_seconds"])
                continue

            if startup_since is not None:
                if now - startup_since >= tv["startup_delay_seconds"]:
                    ok, detail = api.launch(dashboard)
                    log.write(f"STARTUP IDLE -> DASHBOARD {'OK' if ok else 'FAILED'} {detail}")
                    previous = dashboard if ok else None
                    startup_since = None
                    time.sleep(1.0)
                    continue
                time.sleep(tv["poll_seconds"])
                continue

            # Do not infer Home after Dashboard disappears: Dashboard itself
            # opens Settings, Bluetooth, Wi-Fi, sharing, Live TV and HDMI.
            if previous == dashboard:
                previous = None
                protected_none = True
                none_since = None
                time.sleep(tv["poll_seconds"])
                continue
            if protected_none:
                time.sleep(tv["poll_seconds"])
                continue
            if previous not in return_apps:
                previous = None
                none_since = None
                time.sleep(tv["poll_seconds"])
                continue

            if none_since is None:
                none_since = now
            elif now - none_since >= tv["home_grace_seconds"]:
                source = previous
                ok, detail = api.launch(dashboard)
                log.write(f"HOME after {source} -> DASHBOARD {'OK' if ok else 'FAILED'} {detail}")
                previous = dashboard if ok else None
                none_since = None
                time.sleep(1.0)
                continue

            time.sleep(tv["poll_seconds"])
    except KeyboardInterrupt:
        log.write("STOP requested")
        return 0
    finally:
        guard.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    here = Path(__file__).resolve().parent
    parser.add_argument("--config", type=Path, default=here / "config.toml")
    parser.add_argument("--log", type=Path, default=here / "button-redirect.log")
    args = parser.parse_args()
    try:
        return run(args.config.resolve(), args.log.resolve())
    except Exception as exc:
        print(f"FATAL {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

