# Chipster Web — Dev Setup

This file covers the **frontend** (Angular dev server, `chipster-web`). The backend is in `chipster-web-server` — see `../chipster-web-server/CLAUDE.md` for ServerLauncher, PostgreSQL, configuration, and the full picture of how the two repos work together.

## Two Setup Modes

- **Servers in container** — everything runs inside the sandbox container (see below)
- **Servers on host** — backend runs on the host; see "Host setup" below and `../chipster-web-server/CLAUDE.md`

---

## Starting the Container

**Container setup** (all servers in container):
```
WORKSPACE=~/workspace PORTS=8000-8110,4200 ./sandbox.sh
```
(`PORTS=4200` is enough when serving in proxy mode — see Angular
Configuration below.)

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

In proxy mode (see Angular Configuration below), the same flag is needed:
```
cd /workspace/chipster-web && npm run start:proxy -- --host 0.0.0.0
```

**Ready signal:** There is no "Compiled successfully" log line with this Angular/Vite setup. The server is ready after the Vite dynamic import warnings (from `ng2-pdf-viewer.js`) finish printing. Verify by hitting `http://localhost:4200` rather than waiting for a log message.

To kill: `fuser -k 4200/tcp`

---

## Angular Configuration

There are two ways to serve the app.

**`npm start`** (`ng serve`) — the default. The browser connects to each
service on its own port, so every service port has to be reachable (all but
one, see the bootstrap address below).

**`npm run start:proxy`** — the dev server also proxies the backend services,
so the browser only needs the dev server port (4200). This keeps port
forwarding simple when the dev environment runs on a remote VM, and it matches
the deployments, where the ingress does the same proxying and prefix stripping.

`npm run start:proxy` is only a shorthand for `ng serve --configuration
proxy`; either form works. `proxy` is a configuration of the `serve` target in
`angular.json`, and all it does is replace the `proxyConfig` of the target's
options, so it composes with `production` too.

### Proxy mode

`proxy.conf.json` maps the prefixes to the service ports. It covers the public
APIs under `/<service>` and the admin APIs (used by the `/admin` views) under
`/<service>-admin`, the same prefixes as the ingress.

The entries are matched by string prefix in the order they appear, first match
winning, so a longer name has to precede any name it starts with — the
`-admin` entries and `session-db-events` come before the plain service names.

Switching modes takes two things that have to agree, neither of which needs a
file to be edited:

1. the dev server: `npm run start:proxy` instead of `npm start`
2. the backend: `./gradlew run -Pproxy`, which overlays
   `../chipster-web-server/conf/chipster-proxy.yaml` and points the
   `url-ext-*` and `url-admin-ext-*` addresses that service-locator hands out
   to the browser at the dev server. The backend has to be restarted to pick
   them up.

### The bootstrap address

The app reads only one service address itself, `service-locator` in
`src/assets/conf/chipster.yaml`; everything else comes from service-locator.
That address is relative (`/service-locator`), so that it needs no editing when
the mode changes. The direct mode therefore needs a proxy too, but only for
that one prefix: `proxy.conf.direct.json`, in the options of the `serve`
target. Proxy mode replaces it with `proxy.conf.json`, which has the same entry
and the rest of the services besides.

Because of that address, both modes need the services to be reachable from the
**dev server**, i.e. the dev server has to run wherever the backend runs. The
targets of the proxy configs are resolved by the dev server, not the browser,
so running the dev server in the container against a backend on the host (see
host mode in `../chipster-web-server/CLAUDE.md`) would need them to point at
`host.docker.internal` instead of `localhost`.

The proxy config and the target options are read at startup, so restart the dev
server after changing them.

---

## Backend

The Angular app talks to chipster-web-server (ServerLauncher). See `../chipster-web-server/CLAUDE.md` for how to start it, configure it, and set up PostgreSQL.
