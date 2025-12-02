# Context Engine v2.0 - Architecture Document

**Status**: Draft
**Version**: 2.0.0
**Date**: November 2025

---

## 1. Executive Summary

### Problem
Users interact with multiple AI platforms (ChatGPT, Claude, Gemini) and scatter knowledge across various tools (Notion, Docs, Code). AI assistants lack persistent memory of past conversations and context from other sources, forcing users to repeat information and manually paste context.

### Solution
**Context Engine v2.0** is a browser-first universal memory layer. It captures conversations across AI platforms, ingests knowledge from external sources, and automatically injects relevant context into new AI interactions. It combines the cross-platform utility of Mem0, the content ingestion of Supermemory, and the cognitive architecture of OpenMemory into a single, developer-focused tool.

### Key Innovations
1.  **Hybrid Storage**: Local-first speed (IndexedDB) + Cloud sync (PostgreSQL) for privacy and performance.
2.  **Cognitive Memory Sectors**: Organizing memories into Episodic (events), Semantic (facts), and Procedural (how-to) sectors for smarter retrieval.
3.  **Universal Injection**: A non-intrusive "Brain Button" injected into any AI chat interface for on-demand context.
4.  **Visual Memory Graph**: Interactive visualization of memory connections to explore knowledge.

### Value Proposition
"Your AI memory, everywhere you go. Remember everything, repeat nothing."

---

## 2. System Architecture

### High-Level Components

```mermaid
graph TB
    subgraph "Client (Browser Extension)"
        UI[Popup UI & Settings]
        CS[Content Scripts]
        BG[Background Service Worker]
        LDB[(Local IndexedDB)]
    end

    subgraph "Cloud Infrastructure"
        API[Node.js/Hono API]
        DB[(PostgreSQL)]
        VEC[(pgvector)]
        AUTH[Auth Service]
    end

    subgraph "External Systems"
        AI[AI Platforms (ChatGPT/Claude)]
        LLM[Embedding Provider (Gemini/OpenAI)]
        SRC[Data Sources (Notion/Drive)]
    end

    CS -->|Capture/Inject| AI
    CS <-->|Msg Passing| BG
    UI <-->|Msg Passing| BG
    BG <-->|Read/Write| LDB
    BG <-->|Sync/Embed| API
    API <-->|Store| DB
    API <-->|Vector Search| VEC
    API <-->|Generate| LLM
    API <-->|Ingest| SRC
```

### Data Flow

1.  **Capture**:
    *   User chats on ChatGPT/Claude.
    *   Content Script detects DOM changes.
    *   Extracts messages → Sends to Background.
    *   Background saves to Local IndexedDB (immediate).

2.  **Process (Async)**:
    *   Background pushes new memories to Cloud API (if online).
    *   API generates embeddings via LLM Provider.
    *   API categorizes memory (Episodic/Semantic).
    *   Stores in PostgreSQL + pgvector.

3.  **Retrieve & Inject**:
    *   User opens a new chat.
    *   Content Script injects "Brain Button".
    *   User clicks Button or types trigger.
    *   Background searches Local DB (fast) + Cloud Vector DB (smart).
    *   Relevant context injected into chat input.

### Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind | Modern, maintainable, rich UI ecosystem. |
| **Extension** | Manifest V3 | Required for Chrome Web Store compliance. |
| **Local DB** | Dexie.js (IndexedDB) | robust wrapper for IndexedDB, easy querying. |
| **Backend** | Hono (Node.js adapter) | Lightweight, ultra-fast, portable to edge if needed. |
| **Database** | PostgreSQL (Neon/Supabase) | Relational + Vector support in one (pgvector). |
| **Embeddings** | Google Gemini API | Free tier is generous, good performance. |
| **Visuals** | react-force-graph-2d | Excellent for visualizing memory connections. |

---

## 3. Core Components

### 3.1 Browser Extension (Client)
*   **Manifest V3**: Service worker-based background process.
*   **Content Scripts**:
    *   `chatgpt.ts`: DOM observers for chat.openai.com.
    *   `claude.ts`: DOM observers for claude.ai.
    *   `injector.ts`: Renders the floating "Brain" button.
*   **Popup UI**: React application for searching memories, viewing the graph, and settings.

### 3.2 Storage Layer
*   **Local-First (Phase 1)**:
    *   `Dexie.js` stores `conversations`, `messages`, and `settings`.
    *   Full-text search via Dexie's text indices.
    *   Zero latency, works offline.
*   **Cloud Sync (Phase 2)**:
    *   Sync queue in IndexedDB.
    *   Background worker pushes changes to API.
    *   Conflict resolution: "Last Write Wins" (simple) for MVP.

### 3.3 Memory Engine
*   **Ingestion**: Raw text → Chunking → Embedding.
*   **Categorization (OpenMemory Style)**:
    *   *Episodic*: "I worked on the auth bug yesterday."
    *   *Semantic*: "The auth API endpoint is /v1/login."
    *   *Procedural*: "To fix auth, run `npm run build`."
*   **Retrieval**:
    *   Hybrid Search: Keywords (Local) + Semantic (Cloud).
    *   Re-ranking based on Recency + Relevance.

### 3.4 Injection System
*   **Manual Trigger**: User clicks "Brain" icon → Opens Memory Menu → Selects Memory → Inserts into textbox.
*   **Auto-Suggest (Phase 3)**: As user types, relevant memories appear in a tooltip.

---

## 4. Data Models

### 4.1 Database Schema (PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (Sessions)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    platform TEXT NOT NULL, -- 'chatgpt', 'claude'
    title TEXT,
    external_id TEXT, -- Platform specific ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Memories (Processed/Chunked)
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    source_id UUID REFERENCES conversations(id), -- Link back to source
    content TEXT NOT NULL,
    category TEXT, -- 'episodic', 'semantic'
    embedding VECTOR(768), -- Gemini dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);
```

### 4.2 Local Schema (Dexie.js)

```typescript
interface LocalConversation {
  id?: number; // Auto-increment
  platform: 'chatgpt' | 'claude';
  title: string;
  timestamp: number;
  messages: Array<{ role: string, content: string }>;
  synced: boolean; // Sync status
}
```

---

## 5. Implementation Roadmap

### Phase 1: MVP (Foundation) - Weeks 1-2
**Goal**: Capture conversations locally and provide basic search.
*   [x] Extension skeleton (Manifest V3, React, Tailwind).
*   [x] Content scripts for ChatGPT and Claude (detection).
*   [ ] **CRITICAL**: Implement DOM scraping logic to actually capture text.
*   [ ] **CRITICAL**: Implement IndexedDB storage (Dexie.js).
*   [ ] **CRITICAL**: Build "Memory List" UI in Popup.
*   [ ] **CRITICAL**: Simple keyword search (local).
*   [ ] **CRITICAL**: Manual Context Injection (Brain Button).

### Phase 2: Cloud & Intelligence - Weeks 3-4
**Goal**: Enable semantic search and persistence across devices.
*   [ ] Setup PostgreSQL + Hono backend.
*   [ ] Implement "Sync" button (dump local JSON to Cloud).
*   [ ] Integrate Gemini API for embeddings.
*   [ ] Implement Vector Search endpoint.
*   [ ] Add "Graph View" to visualize connections.

### Phase 3: Advanced & Integrations - Month 2+
**Goal**: Expand beyond chat to knowledge management.
*   [ ] Notion & Google Drive integration (OAuth).
*   [ ] Auto-summarization of old sessions.
*   [ ] Multi-user teams.
*   [ ] Mobile companion app (PWA).

---

## 6. Technical Decisions & Trade-offs

| Decision | Choice | Alternatives | Rationale |
| :--- | :--- | :--- | :--- |
| **Storage Strategy** | **Hybrid (Local + Cloud)** | Local-only / Cloud-only | Local-only lacks vector search power. Cloud-only is slow and costly. Hybrid gives speed + intelligence. |
| **Embeddings** | **Gemini API** | OpenAI / Local Ollama | Gemini has a generous free tier suitable for MVP. Local Ollama is too heavy for a browser extension. |
| **Memory Model** | **Simplified Sectors** | Flat / Full Cognitive | Full OpenMemory (5 sectors) is overkill for MVP. A simplified tag-based approach (Category field) is sufficient. |
| **UI Framework** | **React** | Vanilla JS | Complex UI (Graph, Lists, Settings) is unmaintainable in Vanilla JS. React ecosystem speeds up dev. |
| **Backend Runtime** | **Node.js (Hono)** | Python (FastAPI) | Keeps stack unified (TypeScript everywhere). Hono is lightweight and standards-compliant. |

---

## 7. Cost Analysis (Estimated)

**Phase 1 (MVP)**:
*   **Cost**: $0
*   **Hosting**: Local machine / Github Pages
*   **DB**: Local IndexedDB
*   **AI**: None

**Phase 2 (Cloud)**:
*   **Hosting (Backend)**: Railway/Render Free Tier -> $5/mo.
*   **Database**: Neon/Supabase Free Tier (0.5GB storage).
*   **Embeddings**: Google Gemini Free Tier (60 RPM).
*   **Total**: **$0 - $5 / month** for first 100 users.

**Break-even**:
*   If charging $5/mo for "Pro" features (Cloud Sync):
*   1 User covers hosting costs.

---

## 8. Conclusion

This architecture prioritizes **developer velocity** and **user privacy** (Local-First). It avoids the pitfall of "premature scaling" by using free-tier cloud services and leveraging client-side processing where possible. The result is a powerful, portfolio-ready application that solves a real problem immediately.
