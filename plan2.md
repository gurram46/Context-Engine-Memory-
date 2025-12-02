# Context Engine v2 - Full Architecture Design

## Project Context & History

### What We Already Tried (Phase 1 - MCP Server)
- Built MCP server for Claude Code/Codex/Cursor
- Goal: Save coding sessions, resume across different AI tools
- **FAILED**: Desktop tools sandbox external connections
- **FAILED**: Local bridge also rejected
- Cost: ₹2k in credits, 2 weeks of time
- Result: Working tech, wrong distribution channel

### Why We're Pivoting (Phase 2 - Browser Extension + Memory Layer)
- Desktop MCP distribution = blocked by vendor sandboxing
- Browser extensions = no restrictions, bigger market
- Need monetizable product (unemployed, need project for interviews)
- Timeline: 2 months to working product

### What We've Researched
Cloned and analyzed three repos as reference architectures:

**Mem0 (mem0ai/mem0):**
- Cross-platform conversation sync (9+ AI tools)
- Multi-vector-store backend (Qdrant, Chroma, Pinecone)
- 90% token compression
- Chrome extension for auto-capture

**Supermemory (supermemoryai/supermemory):**
- Universal memory hub (Notion, Drive, Web, Conversations)
- Cloudflare serverless ($5/mo for 20k users)
- LLM Bridge (API translation between providers)
- MCP protocol integration

**OpenMemory (caviraoss/openmemory):**
- Cognitive memory architecture (5 sectors: episodic, semantic, procedural, emotional, reflective)
- Cheapest ($0.30-0.40/1M tokens vs $2.50+ competitors)
- Single-waypoint associative graph
- 110-130ms query latency

## What We Want to Build

### Core Value Proposition
"AI that remembers everything you've ever read, written, or said - and uses it intelligently in any conversation."

### Hybrid Approach (Best of All Worlds)
1. **Session Continuity** (my original idea): Save ChatGPT chat, resume in Claude
2. **Universal Memory** (Supermemory): Capture from Notion, Drive, Web, PDFs
3. **Smart Retrieval** (OpenMemory): Semantic search with context awareness
4. **Cross-Platform** (Mem0): Works with any AI tool

### Target Users
- Freelancers, students, researchers (personal knowledge management)
- Small teams (shared memory workspace)
- Developers (myself for portfolio/interviews)

### Monetization Model
- Free tier: Basic local storage
- Pro ($5-10/mo): Cloud sync, unlimited storage
- Team ($15/seat): Shared workspaces

## Requirements for This Architecture Document

### What You Should Design

**1. System Architecture**
- High-level component diagram
- Data flow (capture → store → retrieve → inject)
- All planned features (even if not in MVP)
- Clear phase boundaries (MVP vs v2 vs v3)

**2. Technical Stack Recommendations**
Based on the three repos analyzed:
- Which parts to copy from Mem0/Supermemory/OpenMemory
- Which parts to build custom
- Technology choices (frontend, backend, database, embeddings)

**3. Storage Strategy**
- Local vs cloud (hybrid approach)
- Schema design (sessions, memories, embeddings, user data)
- Sync mechanism between local/cloud

**4. Memory Model**
- Do we need multi-sector (OpenMemory style) or flat (Mem0 style)?
- Semantic search (embeddings) or full-text?
- Compression/summarization strategy

**5. Integration Architecture**
- Browser extension (ChatGPT, Claude, Gemini web pages)
- Future: Notion, Google Drive, PDFs
- API design for third-party integrations

**6. Retrieval & Injection System**
- How to find relevant memories for current conversation
- How to inject context without overwhelming the AI
- Smart ranking/filtering

**7. Implementation Phases**
Clear breakdown:
- **Phase 1 (Weeks 1-2)**: MVP - What MUST work
- **Phase 2 (Weeks 3-4)**: Enhanced - Nice to have
- **Phase 3 (Future)**: Advanced - Can defer

### What You Should NOT Do
- ❌ Don't write actual code yet (architecture only)
- ❌ Don't over-optimize for scale (starting with 10 users)
- ❌ Don't add every feature (prioritize ruthlessly)
- ❌ Don't make it too complex (I need to implement this myself)

## Constraints

### Budget
- ₹2k remaining for cloud services
- Must be cost-effective (prefer free tiers initially)

### Time
- 2 months total
- 5 hours/day coding
- Using AI assistants (Claude Code, Codex) for implementation

### Technical
- Browser extension (Chrome first, Firefox later)
- Backend: Node.js/Bun (TypeScript)
- Database: PostgreSQL (Neon/Supabase free tier)
- Embeddings: Start cheap (Ollama local?) or skip for MVP

### Distribution
- Must work in browser (no desktop app)
- Easy setup (<5 minutes for new user)
- Works offline (local storage)
- Optional cloud sync

## Reference Architectures (Use as Abstractions)

You have access to these cloned repos - use them as reference:

**From Mem0:**
- Cross-platform conversation capture mechanism
- Multi-backend storage adapters
- Chrome extension architecture

**From Supermemory:**
- Universal content ingestion pipeline
- LLM Bridge pattern (API translation)
- Serverless deployment strategy

**From OpenMemory:**
- Multi-sector memory organization
- Cost-efficient local-first approach
- Semantic retrieval scoring

## Expected Output

### 1. Architecture Document Structure
```
1. Executive Summary
   - Problem statement
   - Solution approach
   - Key innovations

2. System Architecture
   - Component diagram
   - Data flow diagram
   - Technology stack

3. Core Components
   - Browser Extension (capture)
   - Storage Layer (local + cloud)
   - Memory Engine (search + retrieve)
   - Injection System (context delivery)

4. Data Models
   - Database schemas
   - API contracts
   - Memory structures

5. Integration Patterns
   - AI tool integrations (ChatGPT, Claude, etc.)
   - Content sources (Notion, Drive, etc.)
   - Extension APIs

6. Implementation Roadmap
   - Phase 1: MVP (weeks 1-2)
   - Phase 2: Enhanced (weeks 3-4)
   - Phase 3: Advanced (future)

7. Technical Decisions
   - Stack choices with rationale
   - Trade-offs considered
   - Risks and mitigations

8. Cost Analysis
   - Infrastructure costs per phase
   - Scaling considerations
   - Break-even calculations
```

### 2. Decision Matrix

For each major technical decision, provide:
- Options considered (with pros/cons)
- Recommendation
- Rationale based on constraints

Example decisions:
- Local-first vs cloud-first storage
- Embeddings provider (OpenAI vs Ollama vs none)
- Memory model (flat vs multi-sector)
- Extension framework (vanilla vs React)

### 3. Phase Boundaries

**Clear definition of:**
- What MUST be in MVP (non-negotiable)
- What SHOULD be in v2 (important but can wait)
- What COULD be in v3 (nice-to-have)

## Success Criteria

This architecture is "done" when:
1. ✅ I can see the full system (all features planned)
2. ✅ Phases are clearly prioritized
3. ✅ Technical decisions are justified
4. ✅ I can start implementing Phase 1 immediately
5. ✅ It's impressive for job interviews (shows system design skills)

## Questions You Should Answer

1. **Storage**: SQLite local + Postgres cloud, or something else?
2. **Embeddings**: Worth the cost/complexity in MVP or defer?
3. **Memory Model**: Flat (simple) vs multi-sector (sophisticated)?
4. **Extension Tech**: Vanilla JS (fast) vs React (maintainable)?
5. **Backend**: Do we even need one for MVP or just local storage?
6. **Sync**: How to sync local → cloud without conflicts?

## Final Notes

- This is a **full architecture** document (not just MVP)
- But clearly mark what's Phase 1 vs later
- Be opinionated (recommend specific choices, don't say "it depends")
- Keep it practical (I'm implementing this myself with AI help)
- Focus on what makes THIS different from Mem0/Supermemory/OpenMemory

**Design the system I should build, not the system that's "architecturally pure."**

What's the architecture?
