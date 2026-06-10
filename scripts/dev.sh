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

docker compose up -d

echo -e "  ${GREEN}✓${RESET} Database started"
echo ""

npx concurrently \
  --names "server,client" \
  --prefix-colors "cyan,magenta" \
  "npm run dev --workspace=server 2>&1 | grep -iE 'error|warn|missing|failed'" \
  "npm run dev --workspace=client 2>&1 | grep -iE 'error|warn|ready|localhost'" \
  2>&1 | grep -v "exited with code" &
CONCURRENTLY_PID=$!

echo -ne "  ${DIM}Starting up...${RESET}\r"
sleep 1
echo -e "  ${BOLD}Local:${RESET} ${BOLD}${BLUE}http://localhost:5173${RESET}            "
echo -e "  ${DIM}Ctrl+C to stop${RESET}"
echo ""

wait $CONCURRENTLY_PID
exit 0