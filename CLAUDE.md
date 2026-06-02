# Chipster Web — Dev Setup

This file covers the **frontend** (Angular dev server, `chipster-web`). The backend is in `chipster-web-server` — see `../chipster-web-server/CLAUDE.md` for ServerLauncher, PostgreSQL, configuration, and the full picture of how the two repos work together.

## Two Setup Modes

- **Servers in container** — everything runs inside the sandbox container (see below)
- **Servers on host** — backend runs on the host; see the host-mode section and `../chipster-web-server/CLAUDE.md`

---

## Starting the Container

**Container setup** (all servers in container):
```
WORKSPACE=~/workspace PORTS=8000-8110,4200 ./sandbox.sh
```

**Host setup** (backend on host, container for Claude Code only):
```
WORKSPACE=~/workspace ./sandbox.sh
```

**Check before starting servers:**
```
cat /sys/fs/cgroup/pids.max   # must be ≥ 4096
free -h                        # must have ≥ 6 GiB RAM
```
If either is insufficient, restart the container with the correct settings.

---

## Starting the Angular Dev Server

### Check node_modules Platform First

If `node_modules` was installed on the host, the native Rollup binary will be the wrong platform and Angular will fail to start with a "Cannot find module @rollup/rollup-linux-arm64-gnu" error.

Check before starting:
```
ls /workspace/chipster-web/node_modules/@rollup/
```
Should show `rollup-linux-arm64-gnu`. If it shows `rollup-darwin-arm64`, reinstall from inside the container:
```
cd /workspace/chipster-web && rm -rf node_modules && npm install
```

### Start

Must use `--host 0.0.0.0` — otherwise the server only binds to container-localhost and is unreachable from the host browser:
```
cd /workspace/chipster-web && npm start -- --host 0.0.0.0
```

**Ready signal:** There is no "Compiled successfully" log line with this Angular/Vite setup. The server is ready after the Vite dynamic import warnings (from `ng2-pdf-viewer.js`) finish printing. Verify by hitting `http://localhost:4200` rather than waiting for a log message.

To kill: `fuser -k 4200/tcp`

---

## Angular Configuration

### Container mode

`src/assets/conf/chipster.yaml`:
```yaml
service-locator: http://localhost:8003
```

### Host mode

`src/assets/conf/chipster.yaml`:
```yaml
service-locator: http://localhost:8003
```

The service-locator URL is used by the browser on the host, so `localhost` resolves correctly in both modes.

---

## Backend

The Angular app talks to chipster-web-server (ServerLauncher). See `../chipster-web-server/CLAUDE.md` for how to start it, configure it, and set up PostgreSQL.
