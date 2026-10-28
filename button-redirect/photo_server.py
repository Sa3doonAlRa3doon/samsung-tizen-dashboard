"""LAN photo inbox for Tizen Dashboard.

The phone/browser resizes images before upload. The TV downloads each image and
copies it into IndexedDB, so photos remain available when this server is off.
"""

from __future__ import annotations

import argparse
import html
import json
import mimetypes
import threading
import time
import tomllib
import urllib.parse
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tizen Dashboard Photos</title>
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#0b1020;color:#f5f7ff}*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#263767,#0b1020 55%);padding:28px}
main{max-width:780px;margin:auto;background:#11182dcc;border:1px solid #ffffff20;border-radius:28px;padding:28px;box-shadow:0 30px 80px #0008}
h1{margin:0 0 8px;font-size:clamp(28px,6vw,48px)}p{color:#b9c5e5;line-height:1.5}.row{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}
input,button,label.pick{border:0;border-radius:14px;padding:14px 18px;font-size:17px}input{background:#fff;color:#111;min-width:150px;flex:1}
button,label.pick{background:#5078ff;color:#fff;font-weight:700;cursor:pointer}button.danger{background:#702d45}input[type=file]{display:none}
#status{min-height:24px;color:#9dd7ff;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:20px}
.card{background:#080c18;border-radius:16px;overflow:hidden;border:1px solid #ffffff18}.card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.meta{padding:10px;display:grid;gap:8px}.name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.small{font-size:13px;color:#aeb9d6}
</style></head><body><main>
<h1>Dashboard photos</h1><p>Choose photos from this phone or laptop. They are resized, sent over your home Wi‑Fi, then copied permanently into the TV.</p>
<div class="row"><input id="pin" inputmode="numeric" maxlength="8" placeholder="PIN shown on TV"><label class="pick" for="files">Choose photos</label><input id="files" type="file" accept="image/*" multiple><button id="refresh">Refresh</button></div>
<div id="status">Enter your configured PIN, then choose photos.</div><div id="grid" class="grid"></div>
</main><script>
const $=s=>document.querySelector(s), status=$('#status'), pin=$('#pin'), grid=$('#grid');
pin.value=localStorage.getItem('tizen-dashboard-photo-pin')||'';
function api(path){localStorage.setItem('tizen-dashboard-photo-pin',pin.value);return path+(path.includes('?')?'&':'?')+'pin='+encodeURIComponent(pin.value)}
async function list(){try{const r=await fetch(api('/api/photos'),{cache:'no-store'});if(!r.ok)throw Error('Check the PIN');const d=await r.json();grid.innerHTML='';d.photos.forEach(p=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<img src="${api('/photos/'+encodeURIComponent(p.file))}"><div class="meta"><div class="name"></div><div class="small">Saved for TV sync</div><button class="danger">Remove from inbox</button></div>`;c.querySelector('.name').textContent=p.name;c.querySelector('button').onclick=async()=>{await fetch(api('/api/photos/'+p.id),{method:'DELETE'});list()};grid.appendChild(c)});status.textContent=d.photos.length+' photo(s) waiting / available for TV sync';}catch(e){status.textContent=e.message}}
function resize(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height,s=Math.min(1,1920/w,1080/h);w=Math.round(w*s);h=Math.round(h*s);const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>{URL.revokeObjectURL(url);b?resolve(b):reject(Error('Could not resize'))},'image/jpeg',.9)};img.onerror=reject;img.src=url})}
$('#files').onchange=async e=>{const files=[...e.target.files];for(let i=0;i<files.length;i++){status.textContent=`Preparing ${i+1} of ${files.length}…`;const blob=await resize(files[i]);const r=await fetch(api('/api/upload'),{method:'POST',headers:{'Content-Type':'image/jpeg','X-Filename':encodeURIComponent(files[i].name)},body:blob});if(!r.ok){status.textContent='Upload failed: '+await r.text();return}}status.textContent='Uploaded. The TV will sync within 30 seconds while Dashboard is open.';e.target.value='';list()};
$('#refresh').onclick=list;if(pin.value)list();
</script></body></html>"""


class Store:
    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self.manifest = root / "manifest.json"
        self.lock = threading.Lock()
        self.log_lock = threading.Lock()
        self.access_log = root.parent / "photo-server.log"

    def log(self, line: str) -> None:
        with self.log_lock:
            with self.access_log.open("a", encoding="utf-8") as stream:
                stream.write(time.strftime("%Y-%m-%d %H:%M:%S") + " " + line + "\n")

    def read(self) -> list[dict]:
        with self.lock:
            if not self.manifest.exists():
                return []
            try:
                return json.loads(self.manifest.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                return []

    def _write(self, photos: list[dict]) -> None:
        temp = self.manifest.with_suffix(".tmp")
        temp.write_text(json.dumps(photos, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(self.manifest)

    def add(self, body: bytes, name: str, content_type: str) -> dict:
        photo_id = f"{int(time.time())}-{uuid.uuid4().hex[:10]}"
        suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(content_type, ".jpg")
        filename = photo_id + suffix
        (self.root / filename).write_bytes(body)
        item = {"id": photo_id, "name": name or "My photo", "file": filename, "bytes": len(body)}
        with self.lock:
            photos = []
            if self.manifest.exists():
                try:
                    photos = json.loads(self.manifest.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    photos = []
            photos.append(item)
            self._write(photos)
        return item

    def remove(self, photo_id: str) -> bool:
        with self.lock:
            photos = []
            if self.manifest.exists():
                try:
                    photos = json.loads(self.manifest.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    photos = []
            item = next((p for p in photos if p.get("id") == photo_id), None)
            if not item:
                return False
            photos = [p for p in photos if p.get("id") != photo_id]
            self._write(photos)
            try:
                (self.root / str(item["file"])).unlink(missing_ok=True)
            except OSError:
                pass
            return True


def handler_factory(store: Store, pin: str):
    class Handler(BaseHTTPRequestHandler):
        server_version = "TizenDashboardPhotoInbox/1.0"

        def log_message(self, fmt: str, *args) -> None:
            line = self.address_string() + " " + (fmt % args)
            store.log(line)
            print(time.strftime("%Y-%m-%d %H:%M:%S"), line, flush=True)

        def _cors(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type,X-Filename,X-Upload-Pin")

        def _send(self, status: int, body: bytes, content_type: str) -> None:
            self.send_response(status)
            self._cors()
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _authorised(self) -> bool:
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            supplied = (query.get("pin") or [""])[0] or self.headers.get("X-Upload-Pin", "")
            return supplied == pin

        def do_OPTIONS(self) -> None:
            self.send_response(HTTPStatus.NO_CONTENT)
            self._cors()
            self.end_headers()

        def do_GET(self) -> None:
            parsed = urllib.parse.urlsplit(self.path)
            if parsed.path == "/":
                self._send(HTTPStatus.OK, PAGE.encode("utf-8"), "text/html; charset=utf-8")
                return
            if not self._authorised():
                self._send(HTTPStatus.UNAUTHORIZED, b"Wrong PIN", "text/plain; charset=utf-8")
                return
            if parsed.path == "/api/photos":
                body = json.dumps({"photos": store.read()}).encode("utf-8")
                self._send(HTTPStatus.OK, body, "application/json")
                return
            if parsed.path.startswith("/photos/"):
                filename = Path(urllib.parse.unquote(parsed.path.split("/", 2)[2])).name
                target = store.root / filename
                if not target.is_file():
                    self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")
                    return
                self._send(HTTPStatus.OK, target.read_bytes(), mimetypes.guess_type(target.name)[0] or "application/octet-stream")
                return
            self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")

        def do_POST(self) -> None:
            parsed = urllib.parse.urlsplit(self.path)
            if parsed.path != "/api/upload":
                self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")
                return
            if not self._authorised():
                self._send(HTTPStatus.UNAUTHORIZED, b"Wrong PIN", "text/plain")
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length < 1 or length > 12 * 1024 * 1024:
                self._send(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, b"Image must be under 12 MB", "text/plain")
                return
            content_type = self.headers.get("Content-Type", "").split(";", 1)[0].lower()
            if content_type not in ("image/jpeg", "image/png", "image/webp"):
                self._send(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, b"JPEG, PNG or WebP only", "text/plain")
                return
            body = self.rfile.read(length)
            name = urllib.parse.unquote(self.headers.get("X-Filename", "My photo"))[:180]
            item = store.add(body, name, content_type)
            self._send(HTTPStatus.CREATED, json.dumps(item).encode("utf-8"), "application/json")

        def do_DELETE(self) -> None:
            parsed = urllib.parse.urlsplit(self.path)
            if not self._authorised():
                self._send(HTTPStatus.UNAUTHORIZED, b"Wrong PIN", "text/plain")
                return
            if not parsed.path.startswith("/api/photos/"):
                self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")
                return
            photo_id = urllib.parse.unquote(parsed.path.rsplit("/", 1)[-1])
            if store.remove(photo_id):
                self._send(HTTPStatus.OK, b'{"removed":true}', "application/json")
            else:
                self._send(HTTPStatus.NOT_FOUND, b"Not found", "text/plain")

    return Handler


def main() -> int:
    parser = argparse.ArgumentParser()
    here = Path(__file__).resolve().parent
    parser.add_argument("--config", type=Path, default=here / "config.toml")
    args = parser.parse_args()
    with args.config.open("rb") as stream:
        config = tomllib.load(stream).get("photos") or {}
    root = here / str(config.get("directory", "uploads"))
    bind = str(config.get("bind", "0.0.0.0"))
    port = int(config.get("port", 8096))
    pin = str(config.get("pin", ""))
    if not pin:
        raise SystemExit("Photo server PIN is missing")
    server = ThreadingHTTPServer((bind, port), handler_factory(Store(root), pin))
    print(f"Photo inbox: http://{bind}:{port} PIN {pin}", flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

