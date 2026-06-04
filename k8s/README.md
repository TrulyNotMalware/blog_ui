# k8s — blog-fe (Next.js)

Deploys into the `blog` namespace. **Run the BE repo's `kubectl apply -k k8s/` first to create the namespace.**

## Pre-deploy steps

### 1. Build the image — NEXT_PUBLIC_* are injected at build time

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  -t ghcr.io/TrulyNotMalware/blog-fe:latest .
docker push ghcr.io/TrulyNotMalware/blog-fe:latest
```

### 2. Fill in the Gateway details

Replace the following placeholders in `httproute.yaml` with real values:

| Placeholder | Description |
|---|---|
| `REPLACE_ME_gateway_name` | Gateway resource name |
| `REPLACE_ME_gateway_namespace` | Namespace the Gateway lives in |
| `yourdomain.com` | Your real domain |

`networkpolicy.yaml` currently pins the gateway data-plane namespace to `api-service`
(the self-operated Spring Cloud Gateway). If you move to a different Gateway API
implementation, change it to e.g. `envoy-gateway-system`.

### 3. Deploy

```bash
kubectl apply -k k8s/
kubectl -n blog rollout status deploy/blog-fe
```

## Files

| File | Purpose |
|---|---|
| `configmap.yaml` | Runtime env vars (NODE_ENV, PORT, etc.) |
| `deployment.yaml` | 2 replicas, readOnlyRootFilesystem, non-root user |
| `service.yaml` | ClusterIP :3000 |
| `httproute.yaml` | Gateway API HTTPRoute |
| `hpa.yaml` | 2–6 replicas, CPU 70% / mem 80% |
| `pdb.yaml` | minAvailable: 1 |
| `networkpolicy.yaml` | default-deny + allow Gateway/BE/DNS |
