Bilkul bro. Hum same project ko do deployment methods se run karenge:

1. Individual Dockerfiles + `docker build` / `docker run`
2. Docker Compose + `docker compose up`

Isse Docker fundamentals aur orchestration dono properly samajh aayenge.

## Final technology stack

- Monorepo: Bun Workspaces
- Frontend: Next.js
- HTTP server: Bun + Hono/Elysia
- WebSocket server: Bun WebSocket
- Database: PostgreSQL
- ORM: Prisma ya Drizzle
- Containerization: Docker
- Registry: Docker Hub
- CI/CD: GitHub Actions
- Deployment: AWS EC2
- Reverse proxy: Nginx
- HTTPS: Let’s Encrypt
- Server OS: Ubuntu

## Phase 1: System preparation

- Git check/install
- Docker Desktop check/install
- Bun check/install
- Node.js availability check, because kuch tooling ko Node ki zarurat ho sakti hai
- GitHub account/repository prepare
- Docker Hub account prepare
- AWS account and EC2 access prepare

Bun install karne ke baad verify karenge:

```bash
bun --version
```

## Phase 2: Monorepo foundation

Project structure:

```text
project/
├── apps/
│   ├── web/
│   ├── http-server/
│   └── ws-server/
├── packages/
│   ├── database/
│   ├── shared/
│   └── config/
├── package.json
├── bun.lock
└── tsconfig.json
```

Is phase mein:

- Git repository initialize
- Bun workspace configure
- Root scripts create
- Shared TypeScript configuration
- Common linting/formatting setup
- Environment variable structure
- `.gitignore` aur `.dockerignore`

## Phase 3: Next.js frontend

- Next.js application create
- Bun se dependencies manage
- Basic UI create
- HTTP API integration
- WebSocket connection
- Environment variables configure
- Development and production builds test

Next.js ke Docker-related concepts bhi dekhenge:

- Build-time vs runtime environment variables
- Client-side `NEXT_PUBLIC_*` variables
- SSR ke andar container networking
- Standalone output
- Multi-stage Docker build
- Production image size
- Container ke andar hostname binding

## Phase 4: HTTP server

Ek small REST API banayenge:

```text
GET  /health
GET  /messages
POST /messages
```

Is phase mein:

- HTTP server setup
- Request validation
- Error handling
- PostgreSQL connection
- Health endpoint
- Graceful shutdown
- Shared types ka use

## Phase 5: WebSocket server

- WebSocket server create
- Client connection handling
- Disconnect handling
- Message/event broadcasting
- Health endpoint
- Frontend ko WebSocket server se connect karna

Flow roughly:

```text
Frontend
   ├── HTTP API → existing messages
   └── WebSocket → real-time messages
```

Initially HTTP aur WebSocket services independent rahengi. Baad mein agar cross-service events ki zarurat hui to simple mechanism add karenge.

## Phase 6: PostgreSQL and database package

- Local PostgreSQL configure
- Database schema create
- Migrations setup
- Shared database package
- HTTP server ko database se connect
- Seed data create
- Persistent storage samajhna

Local development ke liye pehle PostgreSQL Docker container manually run karenge.

## Phase 7: Without Docker development

Docker se pehle ensure karenge ki sab locally work karta hai:

```bash
bun install
bun run dev
bun run build
bun run test
bun run lint
bun run typecheck
```

Verify karenge:

- Next.js frontend
- HTTP API
- WebSocket connection
- PostgreSQL persistence
- Shared workspace packages

## Phase 8: Individual Dockerfiles

Teen separate Dockerfiles banenge:

```text
apps/web/Dockerfile
apps/http-server/Dockerfile
apps/ws-server/Dockerfile
```

Har Dockerfile mein:

- Multi-stage build
- Dependency caching
- Bun runtime
- Production-only files
- Non-root user where practical
- Correct startup command
- Health check support

Next.js ke liye standalone production output use karenge.

## Phase 9: Method 1 — Dockerfiles and manual containers

Is method mein Docker Compose use nahi hoga.

### Images build karna

```bash
docker build -t project-web ...
docker build -t project-http ...
docker build -t project-ws ...
```

### Network banana

```bash
docker network create project-network
```

### Containers individually run karna

Order:

1. PostgreSQL container
2. HTTP server container
3. WebSocket server container
4. Next.js container

Hum manually handle karenge:

- Docker network
- Container names
- Ports
- Environment variables
- Volumes
- Restart policies
- Service discovery
- Container logs
- Health status

Isse clear hoga ki Docker Compose internally hamare liye kya simplify karta hai.

## Phase 10: Manual Docker CI pipeline

GitHub Actions pipeline:

1. Code checkout
2. Bun setup
3. Dependencies install
4. Lint
5. Type-check
6. Tests
7. Application build
8. Three Docker images build
9. Images validate
10. Docker Hub login
11. Images push

Tags:

```text
dockerhub-user/project-web:<commit-sha>
dockerhub-user/project-http:<commit-sha>
dockerhub-user/project-ws:<commit-sha>
```

Optional:

```text
latest
```

## Phase 11: Method 1 deployment on EC2

EC2 par deployment script individual Docker commands use karegi:

1. Docker Hub se images pull
2. Existing containers safely stop/remove
3. Docker network ensure
4. PostgreSQL volume ensure
5. Containers correct order mein run
6. Environment variables pass
7. Health endpoints check
8. Failed deployment detect
9. Previous image tag se rollback

Yahan hum practically dekhenge ki manual container management kitni repetitive ho sakti hai.

## Phase 12: Docker Compose setup

Manual Docker approach successfully complete hone ke baad:

```text
compose.yaml
```

Services:

- `web`
- `http-server`
- `ws-server`
- `postgres`

Compose configuration mein:

- Networks
- Volumes
- Environment variables
- Port mappings
- Health checks
- Dependencies
- Restart policies
- Image tags
- Production configuration

Optional separation:

```text
compose.yaml
compose.dev.yaml
compose.prod.yaml
```

## Phase 13: Method 2 — Local Docker Compose

Complete application run:

```bash
docker compose up --build
```

Learn karenge:

- `build` vs `image`
- Service names as hostnames
- Internal vs published ports
- Named volumes
- Health checks
- `depends_on`
- Logs
- Container recreation
- Compose profiles/config overrides

Then compare karenge:

```text
Manual docker run           Docker Compose
-----------------           --------------
More explicit               More declarative
More commands               Single configuration
Manual networking           Automatic networking
Manual dependency order     Defined dependencies
Harder maintenance          Easier maintenance
```

## Phase 14: Docker Compose CI pipeline

CI checks same rahenge, lekin Docker validation Compose se bhi hogi:

```bash
docker compose config
docker compose build
docker compose up -d
```

Pipeline containers start karke:

- HTTP health check
- WebSocket health check
- Frontend response check
- Database connectivity check

Uske baad containers cleanly stop honge.

## Phase 15: Method 2 deployment on EC2

Production deployment:

```bash
docker compose pull
docker compose up -d
```

Flow:

```text
Push to main
   ↓
Tests and builds
   ↓
Docker Hub par images
   ↓
EC2 deployment
   ↓
docker compose pull
   ↓
docker compose up -d
   ↓
Health verification
```

Manual deployment aur Compose deployment ko separate GitHub Actions workflows ya selectable workflow inputs se run kar sakte hain.

## Phase 16: Nginx and routing

EC2 par Nginx configure karenge:

```text
/         → Next.js
/api/*    → HTTP server
/ws       → WebSocket server
```

Is phase mein:

- WebSocket upgrade headers
- Reverse proxy
- Real client IP
- Timeouts
- Request size limits
- Internal ports hide karna
- Domain configuration

## Phase 17: HTTPS and security

- Domain ko EC2 IP se connect
- Let’s Encrypt certificate
- HTTP to HTTPS redirect
- AWS security groups
- SSH ko limited IP tak restrict
- Database port publicly expose nahi karna
- Docker Hub access token
- GitHub secrets
- Production `.env` management
- Container processes ko root se avoid karna

## Phase 18: Deployment reliability

- Commit SHA based deployments
- Container health checks
- Failed deployment detection
- Rollback script
- Database migration strategy
- Persistent PostgreSQL volume
- Restart after EC2 reboot
- Docker image cleanup
- Deployment logs

## Phase 19: Final CI/CD workflows

Eventually workflows kuch aise honge:

```text
ci.yml
├── lint
├── typecheck
├── tests
├── application build
└── Docker validation

publish-images.yml
├── build three images
├── tag with commit SHA
└── push to Docker Hub

deploy-manual.yml
└── deploy using docker pull/run

deploy-compose.yml
└── deploy using Docker Compose
```

## Phase 20: Final comparison and documentation

Project ke end mein hum document karenge:

- Local development
- Manual Docker commands
- Docker Compose commands
- CI workflow
- Manual EC2 deployment
- Compose EC2 deployment
- Environment variables
- Architecture
- Troubleshooting
- Rollback process

Final learning sequence:

```text
Bun setup
→ Monorepo
→ Next.js + HTTP + WebSocket
→ PostgreSQL
→ Run without Docker
→ Individual Dockerfiles
→ Manual docker run
→ Manual CI/CD deployment
→ Docker Compose
→ Compose CI/CD deployment
→ Nginx + HTTPS
→ Health checks and rollback
```

Ye sequence best rahega because pehle hum Docker ke underlying concepts manually samjhenge, phir dekhenge ki Docker Compose exactly kaunsi complexity solve karta hai.
