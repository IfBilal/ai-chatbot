"""
AI Chatbot — FastAPI backend.

Stateless streaming proxy to Groq. The frontend owns conversation state
(localStorage); this service simply relays a turn list to a Groq-hosted model
and streams the tokens back over Server-Sent Events.
"""

from __future__ import annotations

import json
import os
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_INSTRUCTION = (
    "You are an advanced AI assistant. "
    "Respond with precision and clarity. Be concise but complete. "
    "Use markdown for structure when it aids readability. "
    "Avoid filler and excessive hedging."
)

# A single shared client. The SDK is safe to reuse across requests.
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="AI Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., min_length=1)


def to_groq_messages(messages: List[Message]) -> list[dict]:
    """Prepend the system instruction and pass turns through unchanged.

    Groq speaks the OpenAI chat schema, so our (user/assistant) roles map 1:1.
    """
    out: list[dict] = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    out.extend({"role": m.role, "content": m.content} for m in messages)
    return out


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL, "configured": client is not None}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the server.",
        )

    payload = to_groq_messages(req.messages)

    def event_stream():
        try:
            stream = client.chat.completions.create(
                model=MODEL,
                messages=payload,
                temperature=0.7,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:  # surface a clean error event to the client
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
