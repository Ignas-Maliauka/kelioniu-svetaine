start:
	npx concurrently "cd server && node server" "cd client && npm run dev"
dependencies:
	cd server && npm install
	cd client && npm install
	npm install