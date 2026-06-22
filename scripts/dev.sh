#!/bin/bash
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
DIM='\033[2m'
RESET='\033[0m'

print_startup_help() {
  echo ""
  echo -e "  ${YELLOW}${BOLD}Startup help${RESET}"
  echo -e "  ${DIM}- Make sure Docker Desktop is running before starting dev.${RESET}"
  echo -e "  ${DIM}- Run npm install from the repository root if local scripts or checks fail.${RESET}"
  echo -e "  ${DIM}- On Windows, run this through Git Bash, WSL, or npm scripts with bash available.${RESET}"
  echo ""
}

cleanup() {
  status=$?
  if [ "$STARTED_CONTAINERS" != "true" ]; then
    exit "$status"
  fi

  echo ""
  echo ""
  echo -e "  ${YELLOW}${BOLD}---------- Stopping everything ----------${RESET}"
  trap - SIGINT SIGTERM EXIT
  echo ""
  docker compose -f docker-compose.dev.yml down
  echo ""
  exit "$status"
}
STARTED_CONTAINERS=false
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo -e "${GREEN}${BOLD}---------- Starting Viulumeri - Dev Environment ----------${RESET}"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo -e "  ${RED}Docker was not found.${RESET}"
  print_startup_help
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "  ${RED}Docker is not responding.${RESET}"
  print_startup_help
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo -e "  ${YELLOW}Local node_modules was not found.${RESET}"
  echo -e "  ${DIM}The Docker dev containers can still build, but local npm scripts need npm install.${RESET}"
  echo ""
fi

if [ ! -f "server/.env" ]; then
  echo -e "  ${RED}server/.env was not found.${RESET}"
  echo -e "  ${DIM}Create server/.env with the required development settings, then retry npm run dev.${RESET}"
  print_startup_help
  exit 1
fi

export MUSIC_DIR=$(grep '^MUSIC_DIR=' server/.env | cut -d '=' -f2-)

if ! docker compose -f docker-compose.dev.yml up --build -d; then
  echo -e "  ${RED}Failed to start the dev containers.${RESET}"
  print_startup_help
  exit 1
fi
STARTED_CONTAINERS=true

echo -e "  ${GREEN}[ok]${RESET} Database started"
echo -e "  ${GREEN}[ok]${RESET} Server initialized"
echo -e "  ${GREEN}[ok]${RESET} Client initialized"
echo ""
echo -e "  ${BOLD}Local:${RESET} ${BOLD}${BLUE}http://localhost:5173${RESET}"
echo -e "  ${DIM}Ctrl+C to stop everything${RESET}"
echo ""
echo -e "  ${DIM}Streaming errors and warnings...${RESET}"
echo ""

docker compose -f docker-compose.dev.yml logs -f server client 2>&1 | grep -iE 'error|warn|missing|failed'
