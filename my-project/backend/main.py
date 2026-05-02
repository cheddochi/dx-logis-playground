from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://my-project-vue.onrender.com",
        "https://my-project-react-mhgj.onrender.com",
        "http://localhost:5173",   # Vue 로컬 개발
        "http://localhost:5174",   # React 로컬 개발
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "FastAPI is running 🚀"}

@app.get("/health")
async def health():
    return {"status": "ok"}