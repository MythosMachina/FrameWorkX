# FrameWorkX

AI community platform for model training, image generation, public/private galleries, multi-user management, and a built-in credit system.

## What FrameWorkX Is
- AI community website with user accounts, roles, and permissions.
- Integrated trainer pipeline for LoRA/model workflows.
- Integrated generator for prompt-based image creation.
- Gallery and social-style sharing flows for models and outputs.
- Credit-based usage and admin controls for platform operations.

## Local Setup (No Docker)

### Requirements
- Node.js 20+
- PostgreSQL 15+
- Python 3 (required by tagging/thumbnail/training helpers)

### 1) Configure environment
Copy `.env.example` to `.env` and update at least:
- `FRAMEWORKX_DATABASE_URL`
- `FRAMEWORKX_INSTALL_KEY`
- `FRAMEWORKX_STORAGE_ROOT`

Example:

```bash
cp .env.example .env
```

Note for automatic setup:
- If `./.env` exists in your current clone, setup copies it to `<target-dir>/.env`.
- You can override this explicitly with `--env-source /path/to/.env`.

### 2) Automatic install (recommended, with sudo)
Start the setup pipeline:

```bash
sudo ./scripts/setup/run.sh --target-dir /opt/FrameWorkX
```

Behavior:
- Detailed setup output is written to `setup.log` (default: repository root).
- Terminal output is reduced to a live visual progress/status display.
- If Node.js is below v20 (or missing), setup stops first and asks for confirmation before upgrading Node.js (warning included about possible impact to other apps on the same host).
- On success it prints:
  - App URL (`server-ip + ui-port`)
  - service status command
  - first-user creation command

What this setup configures:
- Step 1: core dependency check/install (`scripts/setup/01-deps.sh`)
- Step 2: user/group, folder permissions, app copy (`scripts/setup/02-provision.sh`)
- Step 3: build, DB migration, systemd install/start (`scripts/setup/03-systemd.sh`)

Installed services:
- `frameworkx-api.service`
- `frameworkx-ui.service`
- `frameworkx-edge.service`
- `frameworkx-indexer.service`
- `frameworkx-worker@.service` (templated worker instances)

Manual/advanced path:
- Use a custom runtime user: `sudo ./scripts/setup/run.sh --target-dir /opt/FrameWorkX --run-user fxuser`
- Install without auto-start: `sudo ./scripts/setup/run.sh --target-dir /opt/FrameWorkX --no-enable`
- Provide env file directly: `sudo ./scripts/setup/run.sh --target-dir /opt/FrameWorkX --env-source /path/to/.env`
- Custom log path: `sudo ./scripts/setup/run.sh --target-dir /opt/FrameWorkX --log-file /var/log/frameworkx-setup.log`
- Non-interactive Node upgrade approval: `sudo FX_ALLOW_NODE_UPGRADE=1 ./scripts/setup/run.sh --target-dir /opt/FrameWorkX`

Check status:

```bash
systemctl list-units 'frameworkx*' --all --no-pager
```

### 3) Manual install (no setup scripts)
Use this path if you want full manual control.

1. Create runtime user/group:

```bash
sudo groupadd --system frameworkx || true
sudo useradd --system --gid frameworkx --home-dir /opt/FrameWorkX --shell /usr/sbin/nologin frameworkx || true
```

2. Copy the project to target path:

```bash
sudo mkdir -p /opt/FrameWorkX
sudo rsync -a --delete ./ /opt/FrameWorkX/ \
  --exclude ".git/" \
  --exclude ".env" \
  --exclude "node_modules/" \
  --exclude ".venv/" \
  --exclude ".venv-trainer/" \
  --exclude "storage/" \
  --exclude "logs/" \
  --exclude ".logs/" \
  --exclude ".run/" \
  --exclude "*.log"
```

3. Prepare environment:

```bash
sudo cp /opt/FrameWorkX/.env.example /opt/FrameWorkX/.env
sudo chown -R frameworkx:frameworkx /opt/FrameWorkX
```

4. Install dependencies and build:

```bash
sudo -u frameworkx bash -lc "cd /opt/FrameWorkX && npm install && npm run build"
```

5. Run DB migrations:

```bash
sudo -u frameworkx bash -lc "cd /opt/FrameWorkX && set -a && source /opt/FrameWorkX/.env && set +a && npm run -w @frameworkx/db migrate"
```

6. Install systemd units from templates:

```bash
for tpl in /opt/FrameWorkX/scripts/systemd/*.service.tpl; do
  unit="$(basename "$tpl" .tpl)"
  sudo sed \
    -e "s|__APP_DIR__|/opt/FrameWorkX|g" \
    -e "s|__ENV_FILE__|/opt/FrameWorkX/.env|g" \
    -e "s|__RUN_AS_USER__|frameworkx|g" \
    -e "s|__RUN_AS_GROUP__|frameworkx|g" \
    "$tpl" | sudo tee "/etc/systemd/system/$unit" >/dev/null
done
```

7. Enable/start services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now frameworkx-api frameworkx-ui frameworkx-edge frameworkx-indexer
sudo systemctl enable --now \
  frameworkx-worker@health \
  frameworkx-worker@intake \
  frameworkx-worker@prep \
  frameworkx-worker@generation \
  frameworkx-worker@training \
  frameworkx-worker@credit \
  frameworkx-worker@stats \
  frameworkx-worker@notification
```

8. Verify:

```bash
systemctl list-units 'frameworkx*' --all --no-pager
curl -s http://127.0.0.1:5100/health
```

## First User
Register your first user (typically admin in a fresh system):

```bash
curl -s -X POST http://127.0.0.1:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","username":"your_user","password":"your_password"}'
```

## Optional S3 migration
Upload local `storage/` files to S3 and rewrite `files.file_registry.path`:

```bash
export FRAMEWORKX_DATABASE_URL=postgres://...
export FRAMEWORKX_STORAGE_ROOT=./storage
export S3_BUCKET=your-bucket
export S3_REGION=eu-central-1
export S3_PREFIX=frameworkx
node scripts/migrate-to-s3.mjs
```
