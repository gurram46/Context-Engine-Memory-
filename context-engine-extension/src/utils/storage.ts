import Dexie, { type Table } from 'dexie';
import { cosineSimilarity } from '../services/gemini';

export interface Conversation {
    id?: number;
    platform: string;
    url: string;
    title: string;
    messages: { role: string; content: string }[];
    timestamp: number;
    embedding?: number[];
    sessionId?: string;
    contentHash?: string;
}

export interface Document {
    id?: number;
    title: string;
    filename: string;
    content: string; // Full content (optional, might be too large)
    timestamp: number;
    chunkCount: number;
}

export interface Chunk {
    id?: number;
    documentId: number;
    content: string;
    embedding: number[];
}

export class ContextEngineDB extends Dexie {
    conversations!: Table<Conversation>;
    documents!: Table<Document>;
    chunks!: Table<Chunk>;

    constructor() {
        super('ContextEngineDB');
        this.version(1).stores({
            conversations: '++id, platform, url, timestamp'
        });
        this.version(2).stores({
            conversations: '++id, platform, url, timestamp, sessionId'
        });
        this.version(3).stores({
            conversations: '++id, platform, url, timestamp, sessionId',
            documents: '++id, title, timestamp',
            chunks: '++id, documentId'
        });
    }
}

let dbInstance: ContextEngineDB | null = null;

export function getDb(): ContextEngineDB {
    if (!dbInstance) {
        dbInstance = new ContextEngineDB();
    }
    return dbInstance;
}

// Helper to generate SHA-256 hash of content
async function generateHash(content: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveConversation(
    platform: string,
    url: string,
    title: string,
    messages: { role: string; content: string }[],
    merge: boolean = false,
    embedding?: number[]
) {
    let sessionId = url;
    try {
        const urlObj = new URL(url);
        if (platform === 'chatgpt') {
            const match = urlObj.pathname.match(/\/(?:c|chat)\/([a-f0-9-]+)/);
            if (match) sessionId = match[1];
        } else if (platform === 'claude') {
            const match = urlObj.pathname.match(/\/chat\/([a-z0-9-]+)/);
            if (match) sessionId = match[1];
        } else if (platform === 'gemini') {
            const match = urlObj.pathname.match(/\/app\/([a-z0-9-]+)/);
            if (match) sessionId = match[1];
        }
    } catch (e) {
        console.warn('Failed to parse URL for sessionId:', e);
    }

    console.log('[Storage] saveConversation called:', { platform, sessionId, title, messagesCount: messages.length, merge });

    const contentString = JSON.stringify(messages);
    const contentHash = await generateHash(contentString);

    let existing;
    if (sessionId !== url) {
        existing = await getDb().conversations.where('sessionId').equals(sessionId).first();
    }

    if (!existing) {
        existing = await getDb().conversations.where('url').equals(url).last();
    }

    if (existing) {
        console.log('[Storage] Found existing conversation:', existing.id);

        if (existing.contentHash === contentHash) {
            console.log('[Storage] Content hash matches. No changes detected. Skipping update.');
            return;
        }

        let finalMessages = messages;

        if (merge) {
            const existingMsgs = existing.messages || [];
            const newUnique = messages.filter(newMsg =>
                !existingMsgs.some(exMsg =>
                    exMsg.content === newMsg.content && exMsg.role === newMsg.role
                )
            );

            if (newUnique.length === 0) {
                console.log('[Storage] No new unique messages to merge.');
                return;
            }

            finalMessages = [...existingMsgs, ...newUnique];
            console.log('[Storage] Merging messages. New unique count:', newUnique.length);
        }

        const finalContentHash = await generateHash(JSON.stringify(finalMessages));

        const updateData: any = {
            title,
            messages: finalMessages,
            timestamp: Date.now(),
            sessionId,
            contentHash: finalContentHash
        };

        if (embedding) {
            updateData.embedding = embedding;
        }

        await getDb().conversations.update(existing.id!, updateData);
        console.log('[Storage] Updated conversation:', existing.id, 'Merge:', merge);
    } else {
        const id = await getDb().conversations.add({
            platform,
            url,
            title,
            messages,
            timestamp: Date.now(),
            embedding,
            sessionId,
            contentHash
        });
        console.log('[Storage] Created new conversation with ID:', id);
    }
}

export async function updateConversationEmbedding(id: number, embedding: number[]) {
    await getDb().conversations.update(id, { embedding });
}

export async function getRecentConversations(limit = 50) {
    return await getDb().conversations.orderBy('timestamp').reverse().limit(limit).toArray();
}

export async function getAllConversations() {
    return await getDb().conversations.orderBy('timestamp').reverse().toArray();
}

export async function deleteConversation(id: number) {
    await getDb().conversations.delete(id);
}

// --- Knowledge Base Functions ---

export async function saveDocument(title: string, filename: string, content: string, chunks: { content: string; embedding: number[] }[]) {
    return await getDb().transaction('rw', getDb().documents, getDb().chunks, async () => {
        const docId = await getDb().documents.add({
            title,
            filename,
            content,
            timestamp: Date.now(),
            chunkCount: chunks.length
        });

        const chunkObjects = chunks.map(chunk => ({
            documentId: docId,
            content: chunk.content,
            embedding: chunk.embedding
        }));

        await getDb().chunks.bulkAdd(chunkObjects as any);
        return docId;
    });
}

export async function getDocuments() {
    return await getDb().documents.orderBy('timestamp').reverse().toArray();
}

export async function deleteDocument(id: number) {
    return await getDb().transaction('rw', getDb().documents, getDb().chunks, async () => {
        await getDb().chunks.where('documentId').equals(id).delete();
        await getDb().documents.delete(id);
    });
}

// --- Unified Search ---

export interface SearchResult {
    type: 'memory' | 'knowledge';
    id: number;
    title: string; // Conversation title or Document title
    content: string; // Message snippet or Chunk content
    score: number;
    timestamp: number;
    url?: string; // Only for memories
    platform?: string; // Only for memories
}

export async function vectorSearch(queryEmbedding: number[], limit = 10, minScore = 0.6): Promise<SearchResult[]> {
    const db = getDb();

    // 1. Search Memories
    const allConvos = await db.conversations.toArray();
    const memoryResults = allConvos
        .filter(c => c.embedding)
        .map(c => ({
            type: 'memory' as const,
            id: c.id!,
            title: c.title,
            content: c.messages[c.messages.length - 1]?.content || '', // Last message as preview
            score: cosineSimilarity(queryEmbedding, c.embedding!),
            timestamp: c.timestamp,
            url: c.url,
            platform: c.platform
        }))
        .filter(c => c.score >= minScore);

    // 2. Search Knowledge Chunks
    const allChunks = await db.chunks.toArray();
    // We need to fetch document titles for chunks, but let's do it lazily or just map IDs first
    // Optimization: Load all docs to a map
    const allDocs = await db.documents.toArray();
    const docMap = new Map(allDocs.map(d => [d.id!, d]));

    const knowledgeResults = allChunks
        .map(chunk => {
            const doc = docMap.get(chunk.documentId);
            return {
                type: 'knowledge' as const,
                id: chunk.id!, // Chunk ID
                title: doc?.title || 'Unknown Document',
                content: chunk.content,
                score: cosineSimilarity(queryEmbedding, chunk.embedding),
                timestamp: doc?.timestamp || 0
            };
        })
        .filter(c => c.score >= minScore);

    // 3. Combine and Sort
    const combined = [...memoryResults, ...knowledgeResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return combined;
}
