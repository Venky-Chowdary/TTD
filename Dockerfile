FROM node:20-slim AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_API_BASE=''
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

COPY --from=frontend /app/dist ./dist
COPY pyproject.toml main.py ./
RUN pip install --no-cache-dir -e .

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
