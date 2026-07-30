# Suggested SocMed Caddy snippet (plan 22)

Dave confirmed current live blocks are bare `encode gzip` + `reverse_proxy`.
Caddy defaults already upgrade WebSockets. Prefer an explicit `/socket.io*` handle
for clarity / buffering edge cases:

```caddy
socmed.rustinedave.com {
	encode gzip

	handle /socket.io* {
		reverse_proxy 127.0.0.1:3200
	}

	handle {
		reverse_proxy 127.0.0.1:3200
	}
}

socmed-dev.rustinedave.com {
	encode gzip

	handle /socket.io* {
		reverse_proxy 127.0.0.1:3201
	}

	handle {
		reverse_proxy 127.0.0.1:3201
	}
}
```

Apply on the box (`/etc/caddy/Caddyfile`, sudo) and reload Caddy during T4.
Do not edit Signals (`dev-asia.getalloro.com`) in this plan.
