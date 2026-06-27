export PATH="$HOME/.npm-global/bin:$PATH"

export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="powerlevel10k/powerlevel10k"

plugins=(
  git
  node
  npm
  docker
  vscode
  zsh-autosuggestions
  zsh-syntax-highlighting
)

source "$ZSH/oh-my-zsh.sh"

export EDITOR=nano

HISTSIZE=10000
SAVEHIST=10000
HISTFILE="$HOME/.history/.zsh_history"

setopt SHARE_HISTORY
setopt HIST_IGNORE_DUPS

alias es="npx expo start"
alias est="npx expo start --tunnel"
alias ni="npm install"
alias nr="npm run"
alias dbg="npm run db:generate"
alias dbs="npm run db:studio"

[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh