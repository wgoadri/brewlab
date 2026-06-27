# Microsoft's official Node dev container: Debian Bookworm (FULL), Node 24, with
# git, zsh, Oh My Zsh, nvm, sudo, a non-root `node` user, and the common system
# libraries prebuilt binaries (React Native DevTools, ngrok…) need.
#
# Kept deliberately minimal: no custom npm prefix, no extra users, no volume
# pre-creation. Ownership is handled once in post-create.sh instead of trying to
# get every build layer perfect — simpler and far less fragile.
#
# TAG NOTE: javascript-node's image major is 4, so `4-24-bookworm` is correct.
# `1-24-bookworm` does NOT exist. `24-bookworm` also works (tracks latest major).
FROM mcr.microsoft.com/devcontainers/javascript-node:4-24-bookworm

# Extra shell CLIs (Claude Code bundles its own ripgrep; handy anyway).
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ripgrep jq \
 && rm -rf /var/lib/apt/lists/*

# A few project aliases appended to the image's existing zsh config.
USER node
RUN { echo ''; \
      echo 'export EDITOR=nano'; \
      echo 'alias es="npx expo start"'; \
      echo 'alias est="npx expo start --tunnel"'; \
      echo 'alias ni="npm install"'; \
      echo 'alias nr="npm run"'; \
      echo 'alias dbg="npm run db:generate"'; \
      echo 'alias dbs="npm run db:studio"'; \
    } >> /home/node/.zshrc

WORKDIR /workspace
