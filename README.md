# Organizational Memory & Reasoning System

An AI-powered enterprise problem-solving system that prevents organizations from repeating past mistakes by pairing persistent organizational memory with large language model reasoning.

> **"Hindsight provides persistent organizational memory.**  
> **Gemini provides reasoning.**  
> **FastAPI orchestrates the workflow."**

---

## 1. What the Project Is

The **Organizational Memory & Reasoning System** is an enterprise AI application designed to help engineering and operations teams diagnose and resolve high-stakes incidents based on hard-won institutional experience.

Instead of treating every incident as an isolated event and answering from generic textbook LLM knowledge, the system follows a deterministic cognitive loop:

```
NEW PROBLEM
    │
    ▼
HINDSIGHT RETRIEVES RELEVANT MEMORY (Historical Failures & Resolutions)
    │
    ▼
GEMINI REASONS OVER MEMORY + CURRENT INCIDENT
    │
    ▼
DECISIVE ACTIONABLE RECOMMENDATION
    │
    ▼
SAVE NEW EXPERIENCE TO HINDSIGHT
```

---

## 2. The Business Problem

In fast-growing organizations, operational knowledge is notoriously fragmented:
- **Tribal Knowledge Loss**: When senior engineers leave, the hard-learned lessons of past outages leave with them.
- **Repeat Outages**: Teams repeatedly attempt intuitive "fixes" that previously failed (e.g., blindly increasing request timeouts, relaxing global rate limits, or retrying synchronous webhooks).
- **Generic AI Hallucinations**: Standard chatbots produce generic answers disconnected from the organization's unique architecture, history, and verified failure modes.

---

## 3. Why Persistent Organizational Memory Matters

Without persistent organizational memory, an AI system is merely a generic advisor. 

By integrating **Hindsight**, the system maintains an evolving substrate of institutional knowledge containing:
- **Failed Remediation Attempts**: What was tried in past outages and why it failed.
- **Verified Resolutions**: The architectural root cause and what finally stabilized the system.
- **Continuous Learning**: Every analyzed incident is synthesized and retained back into the bank for future recall.

---

## 4. How Hindsight is Used

[Hindsight (by Vectorize.io)](https://hindsight.vectorize.io) serves as the persistent memory layer:
- **Multi-Strategy Recall (`recall` / `arecall`)**: Employs semantic, keyword (BM25), entity-graph, and temporal search across memory banks to retrieve exact precedents.
- **Structured Experience Retention (`retain` / `aretain`)**: Persists structured incident records, operational contexts, and resolution outcomes with document-level idempotency (`update_mode="replace"`).
- **Isolated Memory Bank**: Configured to bank `MAICROBOTS` with dedicated operational missions and backgrounds.

All Hindsight operations are strictly encapsulated in `backend/app/services/hindsight_service.py` using the official `hindsight-client` Python SDK.

---

## 5. How Gemini is Used

Google Gemini (`gemini-2.5-flash`) serves as the reasoning layer:
- **Context Synthesis**: Ingests the current incident's symptoms, context, and the retrieved historical memories from Hindsight.
- **Causal Contrastive Reasoning**: Gemini compares previous failed approaches with successful resolutions, determining which failure traps to avoid and which root causes to prioritize.
- **Structured Output**: Returns structured recommendations, failure warnings, and verified precedent case IDs.

Gemini integration is strictly isolated in `backend/app/services/gemini_service.py`.

---

## 6. Architecture & Data Flow

```
                                ┌───────────────────────────┐
                                │    Next.js + TypeScript   │
                                │    (Tailwind CSS / UI)    │
                                └─────────────┬─────────────┘
                                              │ HTTP / SSE Stream
                                              ▼
                                ┌───────────────────────────┐
                                │      FastAPI Backend      │
                                │   (Orchestration Layer)   │
                                └──────┬─────────────┬──────┘
                                       │             │
                1. Recall Precedents   │             │ 3. Reason over History
                4. Retain New Learning │             │    + Current Problem
                                       ▼             ▼
                                ┌─────────────┐┌─────────────┐
                                │  Hindsight  ││Google Gemini│
                                │ Memory Bank ││  Reasoning  │
                                └─────────────┘└─────────────┘
```

### High-Level Folder Structure

```
project-root/
├── frontend/                     # Next.js 16 (App Router, Tailwind CSS, TypeScript)
│   ├── app/                      # Main UI routes: / and /demo
│   ├── components/               # LandingPage, IssueSelector, AnalysisFlow, MemoryResult, Header
│   ├── lib/api.ts                # API client with SSE streaming & REST fallback
│   └── types/index.ts            # Frontend TypeScript definitions
│
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS, lifespan & health
│   │   ├── core/config.py        # Pydantic BaseSettings loading from .env
│   │   ├── models/schemas.py     # Pydantic schemas for requests, responses & memory items
│   │   ├── routes/
│   │   │   ├── analysis.py       # POST /api/analyze and POST /api/analyze/stream
│   │   │   └── memory.py         # POST /api/memory and GET /api/memory
│   │   └── services/
│   │       ├── hindsight_service.py      # Encapsulated Hindsight SDK integration
│   │       ├── gemini_service.py         # Encapsulated Google Gemini reasoning
│   │       └── orchestration_service.py  # End-to-end memory recall & reasoning flow
│   └── requirements.txt
│
├── synthetic_data/               # Realistic synthetic organizational memories
│   └── organizational_memories.json
│
├── scripts/                      # Utility scripts
│   └── seed_memory.py            # Idempotent seed script to populate Hindsight
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore file
└── README.md                     # Documentation
```

---

## 7. Synthetic Data

The dataset in `synthetic_data/organizational_memories.json` provides rich operational incidents featuring both failed and successful remediation attempts:

- **Case ID**: E.g., `PAY-1021`, `PAY-1142`, `ESC-2041`, `ESC-2088`, `SUB-3012`, `SUB-3055`
- **Scenario**: E.g., `API Timeout`, `Customer Escalation`, `Repeated Payment Failure`
- **Entity**: Affected service or tenant (e.g. `Payment Gateway Service`, `Acme Global Enterprise`, `Stripe Webhook Pipeline`)
- **Symptoms**: Exact production telemetry and logs
- **Root Cause**: The technical failure mechanism
- **Action Attempted**: What the team tried
- **Outcome**: `FAILED` vs `RESOLVED`
- **Resolution**: Deep technical description of the outcome
- **Lesson Learned**: The organizational takeaway

---

## 8. Three Demonstration Scenarios

| Scenario | Incident Description | Historical Failed Attempt (Avoid) | Verified Resolution (Recommended) |
| :--- | :--- | :--- | :--- |
| **1. API Timeout** | Payment Gateway API returning `504 Gateway Timeout` during peak flash sale traffic. | **PAY-1021**: Increasing NGINX and application timeouts to 60s held hung sockets open, worsening pool exhaustion. | **PAY-1142**: Implement PgBouncer transaction pooling, add covering indices, and route read queries to replicas. |
| **2. Customer Escalation** | Enterprise client experiencing unexpected `429 Too Many Requests` on API v2 during syncs. | **ESC-2041**: Doubling global rate limit across all tiers caused unthrottled noisy-neighbor cluster degradation. | **ESC-2088**: Implement Leaky Bucket with burst allowance for enterprise SLA tier and add client-side request jitter. |
| **3. Repeated Payment Failure** | Stripe webhook failures causing recurring subscription renewals to drop and accounts to suspend. | **SUB-3012**: Retrying slow webhooks directly on Stripe caused duplicate retry storms and invoice collisions. | **SUB-3055**: Return HTTP 200 within 45ms and decouple billing state changes to async worker queues. |

---

## 9. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
# Hindsight Configuration
HINDSIGHT_API_KEY=hsk_your_key_here
HINDSIGHT_BANK_ID=MAICROBOTS
HINDSIGHT_ENDPOINT=https://api.hindsight.vectorize.io

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Backend & Frontend URLs
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## 10. How to Seed Hindsight

To populate Hindsight with the synthetic organizational memories:

```bash
# From the project root:
python scripts/seed_memory.py
```

The script is idempotent: running it multiple times updates documents without creating duplicate entries.

---

## 11. How to Run the Backend

```bash
# 1. Install dependencies (from backend directory)
cd backend
pip install -r requirements.txt

# 2. Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
- Interactive Swagger documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

## 12. How to Run the Frontend

```bash
# 1. Install dependencies (from frontend directory)
cd frontend
npm install

# 2. Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.
- Direct demo access: `http://localhost:3000/demo`

---

## 13. End-to-End Demo Workflow

1. **Screen 1 (Landing)**: Clean headline *"Your organization remembers."* Click **"Start Demo →"**.
2. **Screen 2 (Problem Selection)**: Choose one of the 3 scenarios (e.g. *API Timeout*).
3. **Screen 3 (Real-Time Analysis)**: Observe the 7-step orchestration pipeline executing in real time via Server-Sent Events.
4. **Screen 4 (Result)**:
   - See the decisive **Recommended Action**.
   - Read the **Institutional Rationale**.
   - Review the **Historical Precedents** contrasting past failures with verified fixes.
   - Confirm **Memory updated ✓** showing the newly stored learning in Hindsight.
   - Click **"Analyze Another Issue"** to test subsequent scenarios.
