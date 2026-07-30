.PHONY: dev stop

dev:
	bash start-local.sh

stop:
	pkill -f "uvicorn main:app" || true
	pkill -f "vite --host" || true
