# Mr. Poke

Pokes lazy people to review their Gitlab MRs.

## ToC

- [Mr. Poke](#mr-poke)
  - [ToC](#toc)
  - [Getting started](#getting-started)

## Getting started

The service allows to setup plain and simple slack notifications for GitLab. In the same time it's 100% secure, since your data stays in your organisation and is not sent to any 3rd parties.

In order to do that you'll need to follow few simple steps.

### Prerequisites

#### Slack App

1. Create app in [slack](https://api.slack.com/apps/).
2. Go to "OAuth & Permissions" and add scopes. For now it's enough `chat:write`, `users.profile:read`, `users:read`, `users:read.email`. In future it may evolve with adding new functions.
3. Install your app into workspace.
4. Save your `Bot User OAuth Token` for later.

#### GitLab App

1. Go to your [GitLab](https://gitlab.com) and create an app with scopes `read_user`, `openid`, `profile`, `email`.
2. Optionally add redirect URI, if you already know the domain where it will be hosted (example: `https://mr-poke.example.com/login/gitlab/callback`).
3. Save `Application ID` and `Secret` for later.

#### Mr. Poke service deployment

##### Docker

##### Helm chart
