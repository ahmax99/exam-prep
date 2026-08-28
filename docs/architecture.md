# AWS Architectures

3 production-ready AWS architectures :

1. Case: < 10 Monthly Users (Ultra Low Traffic / MVP)

```mermaid
flowchart TD
    subgraph "Runtime"
        Users["Users"]
        Route53["Route53 (DNS)"]
        CloudFront["CloudFront (CDN) + WAF"]
        LambdaNext["Lambda<br/>(Next SSR + BFF)"]
        Cognito["Cognito Hosted UI"]
        S3Assets["S3<br/>(Static assets)"]
        LambdaAPI["Lambda<br/>(ElysiaJS backend)"]
        NeonDB["Neon Database"]
    end

    subgraph "CI/CD Pipeline"
        GitHub["GitHub"]
        GitHubAction["GitHub Action<br/>(Build Docker image,<br/>Push to ECR)"]
    end

    subgraph "Container Registry"
        ECR["ECR<br/>(Docker images)"]
    end

    subgraph "Deployment Orchestration"
        UpdateLambda["Update Lambda<br/>(New image URI)"]
        PublishVersion["Publish Lambda Version"]
        GenerateAppSpec["Generate AppSpec<br/>(CurrentVersion → TargetVersion)"]
        CodeDeploy["CodeDeploy<br/>(Blue/Green deployment,<br/>Traffic shifting,<br/>Auto rollback)"]
    end

    subgraph "Lambda Versioning"
        LambdaAlias["Lambda Alias (prod)"]
        VersionOld["Version N (old)"]
        VersionNew["Version N+1 (new)"]
    end

    Users --> Route53
    Route53 --> CloudFront
    CloudFront --> LambdaNext
    CloudFront --> S3Assets
    LambdaNext --> Cognito
    LambdaNext --> LambdaAPI
    LambdaAPI --> NeonDB

    GitHub --> GitHubAction
    GitHubAction --> ECR
    ECR --> UpdateLambda
    UpdateLambda --> PublishVersion
    PublishVersion --> GenerateAppSpec
    GenerateAppSpec --> CodeDeploy
    CodeDeploy --> LambdaAlias
    LambdaAlias -.->|Traffic shift| VersionOld
    LambdaAlias -.->|Traffic shift| VersionNew
    VersionOld -.->|Pulls image| ECR
    VersionNew -.->|Pulls image| ECR
```

**Request Routing Architecture:**

```mermaid
flowchart TD
    User[User]
    Route53[Route 53<br/>DNS Resolution]
    CloudFront[CloudFront<br/>CDN + WAF + TLS]
    NextJS[Next.js BFF<br/>SSR + Auth Gateway]
    S3[S3<br/>Static Assets]
    Elysia[Elysia Backend<br/>Lambda]
    Cognito[Cognito<br/>Managed Login]

    User --> Route53
    Route53 --> CloudFront

    CloudFront -->|/_next/*, /static/*| S3
    CloudFront -->|/api/*| Elysia
    CloudFront -->|/* default| NextJS

    NextJS -->|Public routes<br/>/, /about| User
    NextJS -->|Protected routes<br/>/blog, /account| Cognito
    NextJS -->|API calls| Elysia

    Cognito -->|JWT tokens| NextJS
    NextJS -->|HttpOnly cookie| User
```

**CloudFront Path Behavior Priority:**

```mermaid
graph TD
    CF[CloudFront Entry Point]

    CF -->|1. /_next/*| B1[S3 Static Assets<br/>Cache: VERY AGGRESSIVE<br/>TTL: 1 day - 1 year<br/>Immutable, hash-based]
    CF -->|2. /static/*| B2[S3 Public Files<br/>Cache: AGGRESSIVE<br/>Images, fonts<br/>gzip/brotli enabled]
    CF -->|3. /api/*| B3[Elysia Lambda<br/>Cache: DISABLED<br/>Forward: Auth headers, cookies<br/>JWT validation required]
    CF -->|4. /* default| B4[Next.js SSR/BFF<br/>Cache: LIMITED/DYNAMIC<br/>Auth flow handler<br/>Route protection]

    style B1 fill:#e1f5e1
    style B2 fill:#e1f5e1
    style B3 fill:#ffe1e1
    style B4 fill:#fff4e1
```

**Stateless Authentication Flow:**

```mermaid
sequenceDiagram
    participant Browser
    participant NextBFF as Next.js BFF
    participant Cognito as Cognito (OIDC)
    participant ElysiaAPI as Elysia Backend

    Note over Browser,Cognito: Login Flow
    Browser->>NextBFF: Login request
    NextBFF->>Cognito: Authenticate (OIDC)
    Cognito->>NextBFF: Returns JWT
    NextBFF->>Browser: Set HttpOnly cookie (JWT)

    Note over Browser,ElysiaAPI: API Request Flow
    Browser->>NextBFF: API request (cookie auto-sent)
    NextBFF->>NextBFF: Extract JWT from cookie
    NextBFF->>ElysiaAPI: Forward request + JWT
    ElysiaAPI->>ElysiaAPI: Verify JWT signature
    ElysiaAPI->>ElysiaAPI: Extract sub (userId)
    ElysiaAPI->>ElysiaAPI: Process request
    ElysiaAPI->>NextBFF: Response
    NextBFF->>Browser: Response
```

**Request Flow Examples:**

### Public Homepage (/)

1. Browser → Route 53 → CloudFront
2. CloudFront applies cache behavior for `/`
3. Forwards to Next.js origin if needed
4. Next.js returns homepage (no auth required)
5. CloudFront caches and returns response

### Protected Route (/blog) - Unauthenticated

1. Browser → Route 53 → CloudFront → Next.js
2. Next.js checks auth cookie (not found)
3. Next.js redirects to Cognito authorization endpoint
4. Browser → Cognito Managed Login
5. User signs in
6. Cognito → `/auth/callback` with authorization code
7. Next.js exchanges code for JWT tokens
8. Next.js stores JWT in HttpOnly cookie
9. Next.js redirects to `/blog`
10. Browser requests `/blog` again (with cookie)
11. Next.js serves protected page

### Authenticated API Request

1. Browser → Route 53 → CloudFront → Next.js
2. Next.js reads auth cookie (server-side)
3. Next.js calls Elysia with JWT
4. Elysia validates JWT, extracts `sub` (userId)
5. Elysia processes request, returns data
6. Next.js renders page, returns through CloudFront

**Architecture Best Practices:**

1. **Application-Layer Auth**: Let Next.js BFF decide which routes require login. Don't force Cognito at the edge for the entire site.

2. **CloudFront Caching Strategy**:
   - `/_next/static/*` → Cache heavily (immutable assets)
   - `/images/*`, `/static/*` → Cache heavily (public assets)
   - `/auth/*` → No caching
   - `/blog`, `/account` → Dynamic/minimal caching
   - `/api/*` → No caching, forward auth headers/cookies

3. **Path Behavior Order**: CloudFront processes the first matching pattern. Order matters for security - broader patterns placed earlier can bypass stricter rules.

4. **Security**:
   - WAF at CloudFront edge
   - JWT validation in Elysia backend
   - HttpOnly cookies (never localStorage)
   - IAM-signed requests from CloudFront to Lambda

**CloudFront to Lambda Security:**

```mermaid
sequenceDiagram
    participant User
    participant CF as CloudFront + WAF
    participant Lambda as Lambda URL

    User->>CF: HTTPS Request
    CF->>CF: Apply WAF rules
    CF->>Lambda: Signed Request (SigV4)
    Lambda->>Lambda: Verify IAM signature
    Lambda->>Lambda: Check IAM permissions
    alt Valid signature
        Lambda->>CF: Allow + Response
        CF->>User: Response
    else Invalid signature
        Lambda->>CF: Deny (403)
        CF->>User: Access Denied
    end

    Note over User,Lambda: Direct Lambda URL access blocked<br/>Only CloudFront can invoke
```

2. Case: > 3000 Monthly Users (Growing Startup)

```mermaid
flowchart TD
    Users["Users"]
    Route53["Route53 (DNS)"]
    CloudFront["CloudFront (CDN) + WAF"]
    ALB1["Internet Facing ALB (Listener rules to apply auth to only specific nextjs pages)"]
    Cognito["Cognito Hosted UI"]
    ECS1["ECS Cluster (Next.js)"]
    S3["S3<br/>(Static assets)"]
    ALB2["Internal ALB"]
    ECS2["ECS Cluster (ElysiaJS) Microservices"]
    Redis["Redis (Optional)"]
    NeonDB["Neon Database"]

    Users --> Route53
    Route53 --> CloudFront
    CloudFront --> ALB1
    CloudFront --> S3
    ALB1 --> Cognito
    ALB1 --> ECS1
    Cognito --> ECS1
    ECS1 --> ALB2
    ALB2 --> ECS2
    ECS1 --> Redis
    ECS2 --> Redis
    ECS2 --> NeonDB
```

3. Case: > 10000 Monthly Users (High Traffic / Enterprise)

```mermaid
flowchart TD
    Users["Users"]
    Route53["Route53 (DNS)"]
    CloudFront["CloudFront (CDN) + WAF"]
    ALB1["Internet Facing ALB (Listener rules to apply auth to only specific nextjs pages)"]
    Cognito["Cognito Hosted UI"]
    ECS1["ECS Cluster (Next.js)"]
    S3["S3<br/>(Static assets)"]
    ALB2["Internal ALB"]
    ECS2["ECS Cluster (ElysiaJS) HTTPS Microservices"]
    ECS3["ECS Cluster (Worker Service)"]
    SQS["SQS (Message Queue)"]
    Redis["Redis (Optional)"]
    NeonDB["Neon Database"]

    Users --> Route53
    Route53 --> CloudFront
    CloudFront --> ALB1
    CloudFront --> S3
    ALB1 --> Cognito
    ALB1 --> ECS1
    Cognito --> ECS1
    ECS1 --> ALB2
    ALB2 --> ECS2
    ECS2 --> SQS
    SQS --> ECS3
    ECS3 --> ECS2
    ECS1 --> Redis
    ECS2 --> Redis
    ECS2 --> NeonDB
```
