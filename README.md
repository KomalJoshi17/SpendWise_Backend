# Backend — Hushh (Express API)

Purpose: REST API for customers, segments, campaigns and AI message generation.

## Requirements
- Node.js >= 18
- MongoDB (local or Atlas)

## Install
```bash
cd backend
npm install
```

## Environment (.env) example
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/hushh
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_key
CORS_ORIGINS=http://localhost:5173

## Run (development)
```bash
npm run dev
```

## Common scripts
- npm run dev — start with nodemon
- npm run start — production start
- npm run lint — lint code (if configured)
- npm run test — run tests (if present)

## API overview (high-level)
- Auth: /api/auth/*
- Customers: /api/customers
- Segments: /api/segments
- Campaigns: /api/campaigns
- AI: /api/generate-messages
- Health: GET /

## Conventions
- MVC pattern: routes → controllers → services → models
- Responses: { success: boolean, data?, message?, error? }
- Protect routes via authMiddleware (JWT)

## Production notes
- Use environment variables for secrets
- Deploy to platforms like Railway, Render, or Heroku
- Use MongoDB Atlas for managed DB