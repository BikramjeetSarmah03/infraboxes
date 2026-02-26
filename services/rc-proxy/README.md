# ResellerClub Proxy (Fly.io)

This service is a small Express proxy that runs on Fly.io with a stable egress IP for ResellerClub IP allowlisting.

## Local development

```bash
cd services/rc-proxy
npm install

export RESELLERCLUB_AUTH_USER_ID=1310328
export RESELLERCLUB_API_KEY=bmZUZC4cHEB3oxPEVH5RcosWgScwL67X
export PROXY_TOKEN=change-me

npm start
```

The server listens on `http://localhost:8080` by default.

## Deploy to Fly.io

```bash
cd services/rc-proxy
fly launch --name <app-name> --region iad --no-deploy
fly deploy
```

### Set secrets

```bash
fly secrets set \
  RESELLERCLUB_AUTH_USER_ID=1310328 \
  RESELLERCLUB_API_KEY=bmZUZC4cHEB3oxPEVH5RcosWgScwL67X \
  PROXY_TOKEN=FlyV1 fm2_lJPECAAAAAAAETUexBBiR757N4ffsYYdUR/g0bEcwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABYu7B8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDwJlG3h4hmWcg2xnEI7K2+UJAvwyyM86Ylm8kKOU/GspQDen7YZmHQPAHuB6H1sFQrE2vWinIxD/ChBRL7ETqiaZtF3tYsiN0yoiDSEoCDhweVtD7mw1XvbOQo038aG3p48eJYrte9J5da0Q3dQ1Vv6WXm/O3TaHqWnyAzTgJDkYUWlkxZz6HLlrQ9BgcQgRBFKpNcdtYlwg+85zd/yu6JEivfvuFNx5vGrfgKZmQo=,fm2_lJPETqiaZtF3tYsiN0yoiDSEoCDhweVtD7mw1XvbOQo038aG3p48eJYrte9J5da0Q3dQ1Vv6WXm/O3TaHqWnyAzTgJDkYUWlkxZz6HLlrQ9BgcQQ+3aZ1KuipRkjG3pUC/0X68O5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5pfJ4gzwAAAAEldLw+F84AFUrxCpHOABVK8QzEEGQRFZ2TX1DKJK4lPkWrE37EIPMjO8LLQ6Y4zdc+OFqEBrC94iWz5+FsanqaPrSf+X1o \
  -a <app-name>
```

### Allocate a static egress IP (IAD)

```bash
fly ips allocate-egress -a <app-name> -r iad
```

## Endpoint tests

Set these environment variables for the examples:

```bash
export RC_PROXY_URL="https://<app-name>.fly.dev"
export RC_PROXY_TOKEN="<your-strong-token>"
```

### Health

```bash
curl "$RC_PROXY_URL/health"
```

### Egress IP

```bash
curl \
  -H "Authorization: Bearer $RC_PROXY_TOKEN" \
  "$RC_PROXY_URL/egress-ip"
```

### Domain availability

```bash
curl \
  -X POST \
  -H "Authorization: Bearer $RC_PROXY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domainNames":["example"],"tlds":["com","net"]}' \
  "$RC_PROXY_URL/domains/available"
```

### Customer search

```bash
curl \
  -H "Authorization: Bearer $RC_PROXY_TOKEN" \
  "$RC_PROXY_URL/customers/search?no-of-records=10&page-no=1&status=Active"
```
