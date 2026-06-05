#!/usr/bin/env python3
import http.server, subprocess, threading, os

TOKEN = "71df4ea718328296b2d7fb68872aab8cedaa1a34d80d11eb0b92e8f25507def7"
LOG = "/opt/palmital/webhook-deploy.log"
SCRIPT = "/opt/palmital/deploy-from-webhook.sh"

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def do_POST(self):
        if self.path != "/deploy":
            self.send_response(404); self.end_headers(); return
        auth = self.headers.get("Authorization", "")
        if auth != "Bearer " + TOKEN:
            self.send_response(401); self.end_headers()
            self.wfile.write(b"Unauthorized"); return
        length = int(self.headers.get("Content-Length", 0))
        if length: self.rfile.read(length)
        self.send_response(202); self.end_headers()
        self.wfile.write(b"Deploy triggered")
        def run_deploy():
            with open(LOG, "a") as f:
                f.write("\n=== DEPLOY triggered ===\n")
            subprocess.run(["bash", SCRIPT],
                           stdout=open(LOG, "a"), stderr=subprocess.STDOUT)
        threading.Thread(target=run_deploy, daemon=True).start()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200); self.end_headers()
            self.wfile.write(b"ok"); return
        self.send_response(404); self.end_headers()

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 8109), Handler)
    print("Webhook :8109", flush=True)
    server.serve_forever()
