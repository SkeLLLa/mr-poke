# Mr. Poke

Pokes lazy people to review their Gitlab MRs.

## ToC

- [Mr. Poke](#mr-poke)
  - [ToC](#toc)
  - [Description](#description)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
      - [Postgres database](#postgres-database)
      - [Slack App](#slack-app)
      - [GitLab App](#gitlab-app)
      - [GitLab group webhook](#gitlab-group-webhook)
      - [Mr. Poke service deployment](#mr-poke-service-deployment)
        - [Bare metal](#bare-metal)
        - [Docker](#docker)
        - [Helm chart](#helm-chart)
        - [Terraform](#terraform)
  - [TODOs](#todos)

## Description

The service allows to setup plain and simple slack notifications for GitLab. It doesn't annoy you with creating channels per MR, all notifications go to the slack app messages.

What does it do:

- Notifies MR authors when they forgot to put assignees and reviewers.
- Notifies reviewers when MR is opened (or updated from Draft state).
- Notifies asignees when MR was approved and became ready to merge.

In the same time it's 100% secure, since your data stays in your organisation and is not sent to any 3rd parties.

## Setup

### Prerequisites

#### Postgres database

Backend uses [prisma](https://www.prisma.io/) to connect to database. For now it's set to postgres. But you may adjust it to your needs by changing datasource provider in [prisma/schema.prisma](https://github.com/SkeLLLa/mr-poke/blob/master/prisma/schema.prisma).

#### Slack App

1. Create app in [slack](https://api.slack.com/apps/).
2. Go to "OAuth & Permissions" and add scopes. For now it's enough `chat:write`, `users.profile:read`, `users:read`, `users:read.email`. In future it may evolve with adding new functions.
3. Install your app into workspace.
4. Save your `Bot User OAuth Token` for later.

#### GitLab App

1. Go to your [GitLab](https://gitlab.com) and create an app with scopes `read_user`, `openid`, `profile`, `email`.
2. Optionally add redirect URI, if you already know the domain where it will be hosted (example: `https://mr-poke.example.com/login/gitlab/callback`).
3. Save `Application ID` and `Secret` for later.

#### GitLab group webhook

1. Go to your [GitLab](https://gitlab.com) and create an create groop webhook.
2. Put your url, for example `https://mr-poke.example.com/hooks/gitlab` and select "Merge request events".
3. Create "Secret token" for webhook and save it.

#### Mr. Poke service deployment

##### Bare metal

To run the service locally or on bare metal you need [node.js](https://nodejs.org/en) version 18+ and [pnpm](https://pnpm.io/).

1. Clone the repo
2. Install dependencies via `pnpm i`
3. Setup needed environment variables (see [docker](#docker) for the list)
4. Run via `pnpm run start:prod`

##### Docker

Docker images are available in repo: [SkeLLLa/mr-poke](https://github.com/SkeLLLa/mr-poke/pkgs/container/mr-poke)

```shell
docker pull ghcr.io/skellla/mr-poke:latest
```

Available environment variables:

```shell
  DATABASE_URL="<postgres connection string>"
  GL_HOOK_TOKEN="<gitlab webhook secret token for request validation>"
  GL_CLIENT_ID="<gitlab application id>"
  GL_CLIENT_SECRET="<gitlab application secret>"
  OAUTH2_CALLBACK_URI="<gitlab oaut2 callback uri>"
  GL_ACCESS_TOKEN="<gitlab access token>"
  SLACK_TOKEN="<slack bot token>"
```

For other env variables see [config](https://github.com/SkeLLLa/mr-poke/blob/master/src/config/index.ts).

Example:

```shell
  GL_CLIENT_ID="01....."
  GL_CLIENT_SECRET="gloas-...."
  OAUTH2_CALLBACK_URI="https://mr-poke.example.com/login/gitlab/callback"
  GL_ACCESS_TOKEN="glpat-...."
  SLACK_TOKEN="xoxb-...-...-..."
  GL_HOOK_TOKEN="super-secret"
  DATABASE_URL="postgresql://user:password@127.0.0.1:5432/mr-poke-db"
  SLACK_EMAIL_DOMAINS="example.com"
  PG_BOUNCER_ENABLED=false
  PG_SSL_MODE=disable
  LOG_LEVEL=debug
  SERVER_PORT=3000
```

##### Helm chart

Helm chart is available via OCI [repo](https://github.com/SkeLLLa/mr-poke/pkgs/container/charts%2Fmr-poke)

To see available versions and default values use command:

```shell
 helm show all oci://ghcr.io/skellla/charts/mr-poke
```

To install app you can use helm command as well, but don't forget to create your `values.yaml` and pass env variables mentioned in [docker](#docker) section.

Example:

```yaml
env:
  PG_BOUNCER_ENABLED: 'true'
  PG_SSL_MODE: 'require'
  ENV: 'production'
  NODE_ENV: 'production'
  LOG_LEVEL: 'debug'
  GL_CLIENT_ID: '01.....'
  GL_CLIENT_SECRET: 'gloas-....'
  OAUTH2_CALLBACK_URI: 'https://mr-poke.example.com/login/gitlab/callback'
  GL_ACCESS_TOKEN: 'glpat-....'
  SLACK_TOKEN: 'xoxb-...-...-...'
  GL_HOOK_TOKEN: 'super-secret'
  DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/mr-poke-db'
  SLACK_EMAIL_DOMAINS: 'example.com'

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.org/mergeable-ingress-type: minion
    kubernetes.io/tls-acme: 'true'
    nginx.ingress.kubernetes.io/jaeger-service-name: 'ingress-service-mr-poke'
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "server: testing";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Xss-Protection: 1";
      more_set_headers "X-Robots-Tag: noindex, nofollow, nosnippet, noarchive";
  hosts:
    - host: ''
      paths:
        - /

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app.kubernetes.io/instance
              operator: In
              values:
                - service-mr-poke
        topologyKey: 'kubernetes.io/hostname'

serviceMonitor:
  enabled: true
  labels:
    prometheus: monitoring
    release: prometheus
  interval: 1m
  scrapeTimeout: 30s
```

```shell
 helm install mr-poke oci://ghcr.io/skellla/charts/mr-poke -f my-values.yaml
```

##### Terraform

Install using terraform and helm release provider. Example config:

```tf
variable "host" {
  type = string
}

variable "slack_notifications_db_uri" {
  sensitive = true
  type      = string
}

variable "gitlab_webhook_token" {
  sensitive = true
  type      = string
}

variable "gitlab_app_id" {
  sensitive = true
  type      = string
}

variable "gitlab_app_secret" {
  sensitive = true
  type      = string
}

variable "gitlab_oauth_callback_uri" {
  type = string
}

variable "slack_token" {
  type      = string
  sensitive = true
}

variable "gitlab_access_token" {
  type      = string
  sensitive = true
}

resource "helm_release" "mr_poke" {
  name             = "mr-poke"
  create_namespace = true
  cleanup_on_fail  = true
  namespace        = "default"
  repository       = "oci://ghcr.io/skellla/charts"
  chart            = "mr-poke"
  version          = "1.0.0"
  values = [
    "${file("${path.module}/mr-poke.values.yaml")}"
  ]

  set {
    name  = "ingress.hosts[0].host"
    value = var.host
  }

  set {
    name  = "ingress.tls[0].hosts[0]"
    value = var.host
  }

  set {
    name  = "env.DATABASE_URL"
    value = var.slack_notifications_db_uri
  }

  set {
    name  = "env.GL_HOOK_TOKEN"
    value = var.gitlab_webhook_token
  }

  set {
    name  = "env.GL_CLIENT_ID"
    value = var.gitlab_app_id
  }

  set {
    name  = "env.GL_CLIENT_SECRET"
    value = var.gitlab_app_secret
  }

  set {
    name  = "env.OAUTH2_CALLBACK_URI"
    value = var.gitlab_oauth_callback_uri
  }

  set {
    name  = "env.GL_ACCESS_TOKEN"
    value = var.gitlab_access_token
  }

  set {
    name  = "env.SLACK_TOKEN"
    value = var.slack_token
  }
}
```

## TODOs

There are lot's of thing could be done. But hopefully GitLab team after years of development will make their slack app usable.

Here's a small list of possible improvements, so PRs welcome:

- [] Add periodic notification to reviewers if MR is not ready to merge (not enough approvals).
- [] Integrate `i18next` to localize slack messages based on user locale.
- [] Add application homepage with list of unreviewed MRs.
- [] Add npm binary package for those who don't want installing gitlab webhooks.
- [] You tell me.
