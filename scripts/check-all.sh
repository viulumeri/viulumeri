#!/bin/bash
BOLD='\033[1m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

cleanup() {
  if [ "$STARTED_MONGODB" = "true" ]; then
    docker compose -f docker-compose.dev.yml down mongodb >/dev/null 2>&1
  fi
}
STARTED_MONGODB=false
trap cleanup EXIT

print_common_help() {
  echo ""
  echo -e "  ${YELLOW}${BOLD}Troubleshooting${RESET}"
  echo -e "  ${DIM}- Make sure Docker Desktop is running; MongoDB for tests starts in Docker.${RESET}"
  echo -e "  ${DIM}- Run npm install from the repository root before running checks.${RESET}"
  echo -e "  ${DIM}- Run npm install inside e2e/ if Playwright dependencies are missing.${RESET}"
  echo -e "  ${DIM}- On Windows, Git Bash or WSL is usually the smoothest shell for these scripts.${RESET}"
}

run_step() {
  local name="$1"
  shift

  echo "---------- $name ----------"
  if ! "$@"; then
    echo ""
    echo -e "  ${RED}${BOLD}$name failed.${RESET}"
    print_common_help
    exit 1
  fi
  echo ""
}

if [ ! -d "node_modules" ]; then
  echo -e "  ${RED}Root node_modules was not found.${RESET}"
  echo -e "  ${DIM}Run npm install from the repository root, then retry npm run check:all.${RESET}"
  exit 1
fi

if [ ! -f "server/.env" ]; then
  echo -e "  ${RED}server/.env was not found.${RESET}"
  echo -e "  ${DIM}Create server/.env with the required development and test settings, then retry npm run check:all.${RESET}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "  ${RED}Docker is not responding.${RESET}"
  echo -e "  ${DIM}Start Docker Desktop, wait until it is ready, then retry npm run check:all.${RESET}"
  exit 1
fi

run_step "HEALTHCHECK" npm run healthcheck

run_step "LINTING CLIENT" npm run lint --workspace=client
run_step "LINTING SERVER" npm run lint --workspace=server

echo "---------- UNIT & INTEGRATION TESTS ----------"
if docker compose -f docker-compose.dev.yml ps -q --status running mongodb | grep -q .; then
  MONGODB_WAS_RUNNING=true
else
  MONGODB_WAS_RUNNING=false
fi

if ! docker compose -f docker-compose.dev.yml up -d mongodb; then
  echo ""
  echo -e "  ${RED}${BOLD}Could not start MongoDB for tests.${RESET}"
  print_common_help
  exit 1
fi
if [ "$MONGODB_WAS_RUNNING" != "true" ]; then
  STARTED_MONGODB=true
fi

if ! npm run test --workspace=server; then
  echo ""
  echo -e "  ${RED}${BOLD}UNIT & INTEGRATION TESTS failed.${RESET}"
  print_common_help
  echo -e "  ${YELLOW}Note:${RESET} this step often fails on Windows when local npm scripts use Unix-style environment variables."
  echo -e "  ${DIM}Only MongoDB runs in Docker here; the server tests themselves run on your host machine.${RESET}"
  exit 1
fi
echo ""

run_step "E2E TESTS" npm --prefix e2e/ run test

echo "---------- To view E2E report: cd e2e && npx playwright show-report ----------"
