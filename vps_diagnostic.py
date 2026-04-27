#!/usr/bin/env python3
import paramiko
import sys
import os

HOST = "72.60.10.108"
PORT = 22
USERNAME = "root"

KEY_PATHS = [
    r"C:\Users\fusea\.ssh\id_rsa",
    r"C:\Users\fusea\.ssh\id_ed25519",
    r"C:\Users\fusea\.ssh\digiurban",
    os.path.expanduser("~/.ssh/id_rsa"),
    os.path.expanduser("~/.ssh/id_ed25519"),
    os.path.expanduser("~/.ssh/id_ecdsa"),
    os.path.expanduser("~/.ssh/digiurban"),
]

COMMANDS = [
    ('docker ps -a', 'docker ps -a --filter "label=com.docker.compose.project=palmital"'),
    ('ls /opt/palmital/', 'ls /opt/palmital/'),
    ('ls releases tail -5', 'ls /opt/palmital/releases/ 2>/dev/null | tail -5'),
    ('latest release', 'LATEST=$(ls -dt /opt/palmital/releases/*/ 2>/dev/null | head -1); echo "Latest release: $LATEST"; ls "$LATEST" 2>/dev/null | head -20'),
    ('compose ps', 'cd /opt/palmital/current 2>/dev/null && docker compose -p palmital -f docker-compose.production.yml --env-file .env ps -a 2>&1 || echo "No current dir or compose file"'),
    ('api logs', 'cd /opt/palmital/current 2>/dev/null && docker compose -p palmital -f docker-compose.production.yml --env-file .env logs api --tail=50 2>&1 || echo "Cannot get api logs"'),
    ('web logs', 'cd /opt/palmital/current 2>/dev/null && docker compose -p palmital -f docker-compose.production.yml --env-file .env logs web --tail=30 2>&1 || echo "Cannot get web logs"'),
    ('docker images', 'docker images | grep palmital'),
    ('docker system df', 'docker system df'),
]

def try_connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    for key_path in KEY_PATHS:
        if not os.path.exists(key_path):
            print(f"[KEY NOT FOUND] {key_path}")
            continue
        print(f"[TRYING KEY] {key_path}")
        try:
            # Try RSA key
            try:
                pkey = paramiko.RSAKey.from_private_key_file(key_path)
            except Exception:
                try:
                    pkey = paramiko.Ed25519Key.from_private_key_file(key_path)
                except Exception:
                    try:
                        pkey = paramiko.ECDSAKey.from_private_key_file(key_path)
                    except Exception as e:
                        print(f"  [CANNOT LOAD KEY] {e}")
                        continue

            client.connect(HOST, port=PORT, username=USERNAME, pkey=pkey, timeout=15, allow_agent=False, look_for_keys=False)
            print(f"[AUTH SUCCESS] Connected with key: {key_path}")
            return client
        except paramiko.AuthenticationException as e:
            print(f"  [AUTH FAILED] {e}")
        except Exception as e:
            print(f"  [CONNECTION ERROR] {e}")

    print("[ALL KEY AUTH ATTEMPTS FAILED]")
    return None

def run_command(client, label, cmd):
    print(f"\n{'='*70}")
    print(f"COMMAND [{label}]: {cmd}")
    print('='*70)
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60, get_pty=False)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        exit_code = stdout.channel.recv_exit_status()
        if out:
            print("STDOUT:")
            print(out)
        if err:
            print("STDERR:")
            print(err)
        print(f"EXIT CODE: {exit_code}")
    except Exception as e:
        print(f"[EXEC ERROR] {e}")

def main():
    print(f"Connecting to {HOST}:{PORT} as {USERNAME}")
    client = try_connect()
    if client is None:
        print("\n[FATAL] Could not connect via SSH key authentication.")
        sys.exit(1)

    for label, cmd in COMMANDS:
        run_command(client, label, cmd)

    client.close()
    print(f"\n{'='*70}")
    print("DIAGNOSTIC COMPLETE")

if __name__ == "__main__":
    main()
