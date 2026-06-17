#!/bin/bash
BOLD='\033[1m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}Viulumeri - Available commands${RESET}"
echo ""
echo -e "  ${CYAN}npm run healthcheck${RESET}  ${DIM}TypeScript check only${RESET}"
echo -e "  ${CYAN}npm run check:all${RESET}    ${DIM}Run lint, e2e tests, and TypeScript checks${RESET}"
echo -e "  ${CYAN}npm run dev${RESET}          ${DIM}Start full dev environment (database, server, client)${RESET}"
echo -e "  ${CYAN}npm run dev:reset${RESET}    ${DIM}Wipe database and stop all containers${RESET}"
echo -e "  ${CYAN}npm run help${RESET}         ${DIM}Shows this${RESET}"
echo ""