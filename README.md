# DocuMind AI

DocuMind AI is a production-ready AI web application for document-based Q&A and customer support. It leverages a cloud-native **RAG (Retrieval-Augmented Generation)** pipeline using **Upstash Vector** and **Groq**, combined with **Firebase** for fast, secure authentication.

## Features
- **Scalable Vector Search**: Serverless embeddings and retrieval via Upstash Vector.
- **RAG Pipeline**: Upload PDFs and TXT files, chunked automatically, and queried for exact context matches.
- **Glassmorphism UI**: Beautiful, premium UI featuring Dark Mode, Framer Motion animations, and markdown streaming.
- **Customer Support Mode**: One-click toggle changes the AI's persona to act as a professional support agent based strictly on the uploaded knowledge base.
- **Strict Hallucination Control**: Prompt engineering that prevents the AI from answering outside of the uploaded document context in Support Mode.
- **Multi-Workspace**: Organize your documents and chats cleanly.

## Tech Stack
- Frontend: Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Lucide React
- Backend: Next.js API Routes, Firebase Admin SDK
- Authentication: Firebase Auth (Client & Admin)
- Database (Relational/Metadata): Firebase Firestore
- Database (Vector): Upstash Vector
- AI SDK: Vercel AI SDK
- LLM: Groq (llama-3.1-8b-instant or similar)

## Getting Started

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose (for ChromaDB)
- Ollama (installed locally)
- Firebase Project (Free tier)

### 2. Environment Variables
Rename `.env.local.example` to `.env.local` and add your Firebase credentials.

### 3. Setup Commands
```bash
# Set up Python Microservice for ChromaDB
cd python_backend
python -m venv venv
# Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
pip install -r requirements.txt
python main.py

# In a new terminal, install Node.js dependencies
npm install

# Start Next.js development server
npm run dev
```

### 4. Running Ollama Models
Before uploading documents or chatting, ensure your Ollama instance is running and you have pulled the required models:
```bash
ollama serve
ollama pull llama3
ollama pull nomic-embed-text
```

## Deployment
This project is deployment-ready for platforms like Vercel. Ensure your deployment environment has access to a centralized ChromaDB instance and an Ollama/OpenAI API endpoint (by updating the ENV keys respectively).
