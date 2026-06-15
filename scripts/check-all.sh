echo "---------- 🔍 HEALTHCHECK ----------"
npm run healthcheck || exit 1

echo "---------- 🧹 LINTING ----------"
npm --prefix client/ run lint && npm --prefix server/ run lint || exit 1

echo "---------- 🧪 UNIT & INTEGRATION TESTS ----------"
npm --prefix server/ run test || exit 1

echo "---------- 🎭 E2E TESTS ----------"
npm --prefix e2e/ run test

echo "---------- 👉 To view E2E report navigate to e2e: cd e2e && npx playwright show-report ----------"