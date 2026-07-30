import os
from fastapi.staticfiles import StaticFiles
from api.main import app

if os.path.isdir("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
