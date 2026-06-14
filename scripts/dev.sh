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
  echo -e "  ${YELLOW}${BOLD}---------- Stopping server and client ----------${RESET}"
  trap - SIGINT SIGTERM EXIT
  echo ""
  echo -e "  ${RED}MongoDB is still running!"
  echo -e "  To stop it, run: ${BLUE}$ docker compose down${RESET}"
  echo ""
  kill 0
}
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo -e "${GREEN}${BOLD}---------- Starting Viulumeri - Dev Environment ----------${RESET}"
echo ""

docker compose -f docker-compose.dev.yml up -d --build -d

echo -e "  ${GREEN}✓${RESET} Database started"
echo -e "  ${GREEN}✓${RESET} Server initialized"
echo -e "  ${GREEN}✓${RESET} Client initialized"
echo ""
echo -e "  ${BOLD}Local:${RESET} ${BOLD}${BLUE}http://localhost:5173${RESET}            "
echo -e "  ${DIM}Ctrl+C to stop everything${RESET}"
echo ""

echo -e "  ${DIM}Recent server notices:${RESET}"
docker compose logs server --tail 50 2>&1 | grep -iE 'error|warn|missing|failed' | sed "s/^/  ${DIM}/" | sed "s/\$/${RESET}/"
 
echo ""
echo -e "  ${DIM}Containers running in background. Stop with: docker compose down${RESET}"
echo -e "  ${DIM}Follow logs with: docker compose logs -f${RESET}"
echo ""

echo ""
echo -e "  ${DIM}Following logs (Ctrl+C to stop everything)...${RESET}"
echo ""

# Keep script alive and stream logs so Ctrl+C has something to interrupt
docker compose logs -f