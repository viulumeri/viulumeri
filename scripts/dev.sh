#!/bin/bash
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
DIM='\033[2m'
RESET='\033[0m'

cleanup() {
  echo ""
  echo ""
  echo -e "  ${YELLOW}${BOLD}---------- Stopping everything ----------${RESET}"
  trap - SIGINT SIGTERM EXIT
  echo ""
  docker compose -f docker-compose.dev.yml down
  echo ""
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo -e "${GREEN}${BOLD}---------- Starting Viulumeri - Dev Environment ----------${RESET}"
echo ""

export MUSIC_DIR=$(grep '^MUSIC_DIR=' server/.env | cut -d '=' -f2-)
docker compose -f docker-compose.dev.yml up --build -d

echo -e "  ${GREEN}✓${RESET} Database started"
echo -e "  ${GREEN}✓${RESET} Server initialized"
echo -e "  ${GREEN}✓${RESET} Client initialized"
echo ""
echo -e "  ${BOLD}Local:${RESET} ${BOLD}${BLUE}http://localhost:5173${RESET}            "
echo -e "  ${DIM}Ctrl+C to stop everything${RESET}"
echo ""
echo -e "  ${DIM}Streaming errors and warnings...${RESET}"
echo ""

docker compose -f docker-compose.dev.yml logs -f server client 2>&1 | grep -iE 'error|warn|missing|failed'