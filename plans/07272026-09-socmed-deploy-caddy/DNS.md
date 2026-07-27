# DNS — human step (do this last)

Caddy + apps are live on `alloro-asia` (`168.144.128.47`). TLS for socmed hosts will issue after DNS points here.

## Records to set (at your DNS provider / Squarespace)

| Type | Host | Value |
|------|------|-------|
| A | `socmed` | `168.144.128.47` |
| A | `socmed-dev` | `168.144.128.47` |

Full names:

- `socmed.rustinedave.com` → `168.144.128.47`
- `socmed-dev.rustinedave.com` → `168.144.128.47`

Remove or override any existing Squarespace A/CNAME records for those hosts.

## After DNS propagates

```bash
# from your laptop
dig +short socmed.rustinedave.com
dig +short socmed-dev.rustinedave.com
# both should show 168.144.128.47

curl -sI https://socmed.rustinedave.com/api/health
curl -sI https://socmed-dev.rustinedave.com/api/health
```

Caddy will obtain Let's Encrypt certs automatically once HTTP-01 succeeds.

## Branch mapping (already wired)

| Git branch | Server dir | Port | Host |
|------------|------------|------|------|
| `main` | `/var/www/socmed-prod` | 3200 | `socmed.rustinedave.com` |
| `dev` | `/var/www/socmed-dev` | 3201 | `socmed-dev.rustinedave.com` |
