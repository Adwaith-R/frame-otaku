# FRAME//OTAKU — Anime & Cinema Hub

A responsive, single-page discovery website for anime and movies. No account, login, or registration is needed. Built as a micro-project to demonstrate Docker containerization and Kubernetes deployment.

## Features

- Dark editorial-style responsive UI
- Search by title or keyword
- Separate Anime / Movies / Everything search filters
- Trending anime using the public Jikan API
- Current seasonal anime updates using Jikan
- Movie search, trending, and upcoming releases using TMDB
- Optional TMDB token settings dialog; token is saved in this browser only
- Loading and API error states, external detail links, keyboard-accessible cards
- Docker image, Docker Compose, Kubernetes Deployment + Service, health/readiness probes and resource limits

## APIs

- **Jikan API**: https://docs.api.jikan.moe/ — public MyAnimeList data; no API key required. The API can rate-limit requests.
- **TMDB API**: https://developer.themoviedb.org/docs — create an account and request an API key / Read Access Token. Click the gear icon on the site to add the token. Movie features remain unavailable until configured.

> For a classroom demo, browser-side TMDB configuration is convenient. Do not use this pattern for a public production service with a private secret. A production version should proxy TMDB requests through a backend and keep the token in a server-side environment variable.

## Run locally with Docker

Install Docker Desktop and start it. From this project folder:

```bash
docker build -t frame-otaku:1.0 .
docker run --rm -p 8080:80 frame-otaku:1.0
```

Open http://localhost:8080

Or use Docker Compose:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose down
```

## Deploy to Kubernetes with Minikube (Windows)

Prerequisites: Docker Desktop, kubectl, and Minikube installed. Start Docker Desktop first.

```powershell
minikube start --driver=docker
minikube status
```

Build the image inside Minikube's image store:

```powershell
minikube image build -t frame-otaku:1.0 .
```

Deploy the app:

```powershell
kubectl apply -f k8s/deployment.yaml
kubectl get deployments
kubectl get pods -o wide
kubectl get services
kubectl rollout status deployment/frame-otaku
```

Open it in your browser:

```powershell
minikube service frame-otaku-service
```

If the service command does not automatically open a browser, run this in a separate terminal and keep it open:

```powershell
kubectl port-forward service/frame-otaku-service 8080:80
```

Then visit http://localhost:8080

## Demonstrate Kubernetes management

Scale replicas from 2 to 3:

```powershell
kubectl scale deployment/frame-otaku --replicas=3
kubectl get pods
```

Inspect app logs:

```powershell
kubectl logs deployment/frame-otaku
```

Describe a pod / inspect probes and events:

```powershell
kubectl describe pods
kubectl get events --sort-by=.metadata.creationTimestamp
```

Update the app after changing files:

```powershell
minikube image build -t frame-otaku:1.1 .
# Update k8s/deployment.yaml image to frame-otaku:1.1
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/frame-otaku
kubectl rollout history deployment/frame-otaku
```

Cleanup:

```powershell
kubectl delete -f k8s/deployment.yaml
```

## If Minikube already has a different driver

If `minikube start --driver=docker` reports that the existing cluster was created with another driver, check:

```powershell
minikube profile list
minikube status
```

If you do not need the old cluster, delete it and recreate it with Docker (this removes the Minikube cluster):

```powershell
minikube delete
minikube start --driver=docker
```

Alternatively, use the driver already configured for your existing cluster. Do not delete it if it contains work you need.

## Suggested micro-project demonstration

1. Explain the app's purpose and API data sources.
2. Run it locally in Docker and show the site at `localhost:8080`.
3. Explain the `Dockerfile` and container image.
4. Apply the Kubernetes YAML and show the Deployment, Pods, and Service.
5. Scale replicas to 3 and show the new pod count.
6. Show logs, readiness/liveness probes, and cleanup.
7. Demonstrate search and filters; configure TMDB to show movie features.

## Folder structure

```text
otaku_cinema_hub/
├── index.html
├── styles.css
├── app.js
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── k8s/
│   └── deployment.yaml
└── README.md
```
