# Deployment Guide

pocoapoco-app deploys in two independent tracks — the Client to Cloudflare Workers (no server), and the Tracking Service to a Docker + Caddy VPS, same pattern as `tempo-app`. See `DESIGN.org`'s Deployment section for the design rationale; this doc is the operational how-to.

---

## Part 1 — Client (Cloudflare Workers)

### Prerequisites

- A [Cloudflare](https://dash.cloudflare.com) account
- This repository pushed to GitHub

### 1. Get your Cloudflare account ID

Cloudflare dashboard → any page → right sidebar shows **Account ID**.

### 2. Create an API token

[My Profile → API Tokens → Create Token](https://dash.cloudflare.com/profile/api-tokens) → use the **Edit Cloudflare Workers** template (or a custom token scoped to **Account → Workers Scripts → Edit**).

### 3. Add GitHub repository secrets

**Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | From step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | From step 1 |
| `API_BASE_URL` | The Tracking Service's public URL (see Part 2) |
| `API_BASE_URL_STAGING` | Same, for the staging Worker |

### 4. Deploy

Push to `main` → `.github/workflows/deploy.yml` runs: test → build (`API_BASE_URL` baked into the bundle) → `wrangler deploy`. Push to `staging` → `deploy-staging.yml`, same flow under the `staging-pocoapoco-client` Worker.

No DNS, no TLS cert, no server to provision — `wrangler deploy` creates the Worker on first run, reachable at the `*.workers.dev` URL Cloudflare assigns (or a custom domain, mapped later via Workers → Triggers → Custom Domains).

---

## Part 2 — Tracking Service (VPS + Docker + Caddy)

Deliberately mirrors `tempo-app`'s own `DEPLOYMENT.md` as closely as possible — same suite, same shape. The one structural difference: a per-repo SSH deploy key (see step 6) rather than reusing one key across repos.

### Prerequisites

- A VPS with Docker installed, already running the shared Caddy proxy — reuse the same droplet `tempo-app`/`loyalty-app-api` already share (the proxy itself lives in a separate repo, `github.com:tzohpilotl/droplet-proxy`), or provision a new one following `tempo-app/DEPLOYMENT.md` steps 1–4 if starting fresh
- The Google OAuth client already shared with `loyalty-app-web` (see below)
- This repository pushed to GitHub

### 1. Add this backend's callback URL to the shared Google OAuth client

[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → open the existing OAuth client (the one `loyalty-app-web` uses, in its project) → **Authorized redirect URIs** → add:

```
https://pocoapoco.tzohpilotl.com/auth/google/callback
```

This is additive — existing entries (Clerk's `https://clerk.loyalty.tzohpilotl.com/v1/oauth_callback`) stay untouched. Note this is a **redirect URI**, not a JavaScript origin — pocoapoco's backend uses a server-side Passport flow like `tempo-app`, not a client-side one like Clerk.

### 2. Point a domain at the droplet and add it to the shared proxy

Add an A record for `pocoapoco.tzohpilotl.com` pointing at the droplet's IP, verify with `dig`.

The reverse proxy in front of every app on this droplet (Caddy, Cloudflare Origin CA certs — not automatic Let's Encrypt, despite what `tempo-app/DEPLOYMENT.md` claims) lives in its own repo: `github.com:tzohpilotl/droplet-proxy` (checked out locally at `~/Code/personal_droplet_proxy`). Its own `.env.example` documents the pattern for adding a new service — applied here:

(There's a separate, older `loyalty-app-proxy` repo — nginx + GitLab CI, proxying only `loyalty_app:8080` — that looks like a predecessor to this one and is no longer in active use. Don't confuse the two; `droplet-proxy` is the one actually fronting `tempo-app` and `loyalty-app-api` today.)

1. In that repo's `.env` (on the server) and `.env.example` (in the repo), add:
   ```
   TRACKING_SERVICE_DOMAIN=pocoapoco.tzohpilotl.com
   ```
2. In that repo's `Caddyfile`, add a new site block following the existing ones:
   ```
   {$TRACKING_SERVICE_DOMAIN} {
       tls /etc/caddy/certs/origin.crt /etc/caddy/certs/origin.key

       rate_limit {
           zone tracking_service {
               key    {remote_host}
               events 60
               window 1m
           }
       }

       encode gzip zstd

       header {
           Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
           X-Frame-Options             "DENY"
           X-Content-Type-Options      "nosniff"
           Referrer-Policy             "strict-origin-when-cross-origin"
           -Server
       }

       reverse_proxy tracking-service:3002
   }
   ```
   `tracking-service` is the network alias `backend/compose.yaml` already joins `droplet_proxy_network` under — no change needed on this repo's side. `3002` must match whatever `PORT` is set to in this repo's server-side `.env` (step 6 below).
3. Push to `droplet-proxy`'s `main` branch (or run its deploy workflow manually) — its own `deploy.yml` copies `compose.yaml`/`Caddyfile`/`Dockerfile` to the server and runs `docker compose up --build --detach`.

### 3. Set up GitHub Actions secrets

**Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `SSH_HOST` | The droplet's IP address |
| `SSH_USERNAME` | `root` (or your deploy user) |
| `SSH_PRIVATE_KEY` | Contents of the per-repo deploy key's private half (see step 6) |

`GITHUB_TOKEN` (for pushing images to GHCR) is automatic — no secret needed.

### 4. First deploy — give the server read access to this repo

**This repo uses a dedicated deploy key, not a key shared across repos** — a key added as a deploy key on one GitHub repo only grants access to that repo, not others, even from the same server. If the server already has a deploy key for `tempo-app`, it will *not* work here.

On the **server**, generate a new key dedicated to this repo:

```bash
ssh-keygen -t ed25519 -C "pocoapoco-vps-deploy" -f ~/.ssh/pocoapoco_deploy -N ""
cat ~/.ssh/pocoapoco_deploy.pub
```

Add it on GitHub: **This repository → Settings → Deploy keys → Add deploy key** — paste the public key, leave *Allow write access* unchecked (read-only is enough to clone).

Tell SSH to use this key specifically for this repo's clone:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com-pocoapoco
    HostName github.com
    IdentityFile ~/.ssh/pocoapoco_deploy
    IdentitiesOnly yes
EOF
```

(The host alias matters — if `tempo-app` also has a deploy key with its own alias, cloning via a bare `github.com` host would pick whichever key SSH tries first, not necessarily the right one per repo.)

### 5. Clone the repo on the server

```bash
cd /opt
git clone git@github.com-pocoapoco:tzohpilotl/pocoapoco.git pocoapoco
cd pocoapoco/backend
```

### 6. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in all values:

```env
GITHUB_USERNAME=tzohpilotl

PORT=3002

DB_HOST=db
DB_PORT=5432
DB_USER=tracking_service
DB_PASSWORD=<generate: openssl rand -hex 16>
DB_NAME=tracking_service

SESSION_SECRET=<generate: openssl rand -hex 32>

GOOGLE_CLIENT_ID=<from the shared OAuth client>
GOOGLE_CLIENT_SECRET=<from the shared OAuth client>
GOOGLE_CALLBACK_URL=https://pocoapoco.tzohpilotl.com/auth/google/callback
```

### 7. Make the GHCR image pullable

GHCR packages are private by default. Either:

**Option A — make the package public** (simpler): after the first GitHub Actions run pushes an image, go to your GitHub profile → **Packages** → `pocoapoco-tracking-service` → set visibility to **Public**.

**Option B — authenticate on the server**: log in with a [Personal Access Token](https://github.com/settings/tokens) (`read:packages` scope):

```bash
echo "<your-pat>" | docker login ghcr.io -u tzohpilotl --password-stdin
```

### 8. First run

Wait for the first `Backend Tests` → `Deploy Backend` run to complete (check the **Actions** tab), then:

```bash
cd /opt/pocoapoco/backend
docker compose pull
docker compose up -d
docker compose exec -T app npm run migration:run:prod
```

(Ongoing deploys run this migration step automatically — see step 9. It's only manual here because nothing has deployed yet.)

### 9. Verify

```bash
curl https://pocoapoco.tzohpilotl.com/projects
# {"message":"Unauthorized","statusCode":401}  — expected, confirms the server + auth guard are both up
```

### 10. Ongoing deployments

Push to `main` (touching `backend/**`) → `backend-tests.yml` runs the test suite → on success, `backend-deploy.yml` triggers automatically via `workflow_run`: builds + pushes a `:latest` image to GHCR, then SSHes in and runs:

```bash
cd /opt/pocoapoco/backend
git pull
docker compose pull
docker compose up -d --remove-orphans
docker compose exec -T app npm run migration:run:prod
docker image prune -f
```

No staging environment for the backend — single environment, matching `tempo-app`.

This `git pull` doesn't reference the deploy key directly — it works because the initial clone in step 5 used the aliased URL (`git@github.com-pocoapoco:...`), which git stored as the `origin` remote in `/opt/pocoapoco/.git/config`. Every subsequent bare `git pull` reuses that stored URL, which makes SSH consult `~/.ssh/config` (step 4) and pick the right per-repo key automatically — no change needed in the workflow YAML itself. Two ways this silently breaks:

- The repo gets re-cloned at some point using a bare `git@github.com:...` URL instead of the aliased one — `origin` then points at plain `github.com`, and `git pull` falls back to whichever key SSH tries first (possibly the wrong one, if the server has multiple repos' deploy keys installed).
- `~/.ssh/config` gets edited or removed on the server — the alias only exists there, not in the repo's own git config, so it doesn't travel with the repo.

### 11. Operations

**View logs:**

```bash
docker compose logs -f app
docker compose logs -f db
```

**Manual deploy (without pushing to main):**

```bash
cd /opt/pocoapoco/backend
git pull
docker compose pull
docker compose up -d --remove-orphans
docker compose exec -T app npm run migration:run:prod
```

**Stop / start:**

```bash
docker compose stop
docker compose start
```

**Restart a single service:**

```bash
docker compose restart app
```

**Run a migration manually** (e.g. after generating one without a full redeploy):

```bash
docker compose exec -T app npm run migration:run:prod
```

### 12. Data backup

The Postgres database lives in a Docker named volume (`tracking_service_postgres_data`). Back it up with `pg_dump` rather than copying the raw volume (safer under concurrent writes):

```bash
docker compose exec -T db pg_dump -U tracking_service tracking_service > backups/tracking-service-$(date +%Y%m%d).sql
```

Automate with cron:

```cron
0 3 * * * cd /opt/pocoapoco/backend && docker compose exec -T db pg_dump -U tracking_service tracking_service > /opt/pocoapoco/backups/tracking-service-$(date +\%Y\%m\%d).sql
```

Restore:

```bash
cat backups/tracking-service-20261106.sql | docker compose exec -T db psql -U tracking_service tracking_service
```

### 13. Destroying / rebuilding

Remove everything including data:

```bash
docker compose down -v   # deletes the Postgres volume — irreversible
```

Remove containers only (keep data):

```bash
docker compose down
```

---

## Security notes

- TLS is handled by the shared Caddy proxy (`github.com:tzohpilotl/droplet-proxy`), same as `tempo-app`/`loyalty-app-api` — not configured per-app in this repo. It uses Cloudflare Origin CA certs, not Let's Encrypt.
- `SESSION_SECRET` and `DB_PASSWORD` must be strong random values — never reuse across environments or apps in the suite.
- The deploy SSH key is per-repo and read-only (step 4) — it can clone this repo and nothing else, even though it lives on the same server as `tempo-app`'s own (differently-scoped) deploy key.
- Postgres is never exposed outside the `droplet_proxy_network`/default compose network — only the app container is reachable via Caddy.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are shared with `loyalty-app-web` (same OAuth client, by design — see `DESIGN.org`, Open Questions: Future shared identity across the suite). A Google account authorized for one is technically authorized for both unless per-app restrictions are added later.
