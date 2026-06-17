echo "---------- 🔍 HEALTHCHECK ----------"
npm run healthcheck || exit 1

echo "---------- 🧹 LINTING ----------"
npm run lint --workspace=client || exit 1
npm run lint --workspace=server || exit 1

echo "---------- 🧪 UNIT & INTEGRATION TESTS ----------"
docker compose -f docker-compose.dev.yml up -d mongodb
npm run test --workspace=server || exit 1

echo "---------- 🎭 E2E TESTS ----------"
npm --prefix e2e/ run test
docker compose -f docker-compose.dev.yml down mongodb

echo "---------- 👉 To view E2E report navigate to e2e: cd e2e && npx playwright show-report ----------"