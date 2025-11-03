start:
	npx concurrently "cd server && node server" "cd client && npm run dev"
