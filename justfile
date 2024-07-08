
# load .env file
set dotenv-load
# causes all just variables to be exported
set export

default:
  @just --list

cls:
    # echo "\033[H\033[J"
    # tput reset
    clear && printf '\e[3J'

chunk-file fp="data/docs/aapl-2024-q2.txt": cls
  bun runner.js {{fp}}

# add the upstream remote to the fork
git-add-upstream:
  git remote add upstream git@github.com:jparkerweb/semantic-chunking.git
  git remote -v

