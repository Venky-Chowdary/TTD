# TTD Booking Assistant

A helper dashboard for Tirumala Tirupati Devasthanams (TTD) online bookings.

This is **not** an auto-booking bot and does **not** store payment or credit-card details. It helps you:

- Save pilgrim profiles (with optional OCR from an ID photo/PDF).
- Track TTD quota release times with a live countdown.
- Generate a console/userscript to pre-fill the official TTD booking form quickly.
- Generate a Tampermonkey monitor userscript that watches the official TTD page for availability keywords and alerts you immediately.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + MongoDB
- Auth: JWT stored in `localStorage`

## Local development

1. Start MongoDB (or use Docker):
   ```bash
   docker run -d --name ttd-mongo -p 27017:27017 mongo:7
   ```

2. Start the backend:
   ```bash
   cd api
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. Start the frontend:
   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:5173 and register an account.

## Docker Compose

1. Copy `.env.example` to `.env` and change `JWT_SECRET`.
2. Build and run:
   ```bash
   docker compose up --build
   ```
3. Open http://localhost.

## Deployment notes

- Set a strong `JWT_SECRET` in production.
- Serve the app over HTTPS; JWTs are stored in browser `localStorage`.
- No credit card or payment details are ever stored or transmitted.
