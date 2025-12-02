import { getAppConfig } from '../utils/config';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'models/text-embedding-004';

export async function generateEmbedding(text: string): Promise<number[] | null> {
    const config = await getAppConfig();
    const apiKey = config.geminiApiKey;

    if (!apiKey) {
        console.warn('[Context Engine] No Gemini API key found.');
        return null;
    }

    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: {
                        parts: [{ text: text }]
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Context Engine] Gemini API Error:', errorData);
            throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (data.embedding && data.embedding.values) {
            return data.embedding.values;
        } else {
            console.error('[Context Engine] Unexpected Gemini response format:', data);
            return null;
        }

    } catch (error) {
        console.error('[Context Engine] Failed to generate embedding:', error);
        return null;
    }
}

export async function batchGenerateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    const config = await getAppConfig();
    const apiKey = config.geminiApiKey;

    if (!apiKey) {
        console.warn('[Context Engine] No Gemini API key found.');
        return texts.map(() => null);
    }

    // Gemini batch limit is likely around 100 requests per batch, but let's be safe with 20
    // We will implement a simple chunking here if needed, but for now assuming caller handles reasonable sizes
    // Actually, let's implement the batch call structure
    // Endpoint: models/text-embedding-004:batchEmbedContents

    try {
        const requests = texts.map(text => ({
            model: `models/${EMBEDDING_MODEL.split('/')[1]}`, // e.g. models/text-embedding-004
            content: {
                parts: [{ text: text }]
            }
        }));

        const response = await fetch(
            `${GEMINI_API_BASE}/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requests }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Context Engine] Gemini Batch API Error:', errorData);
            throw new Error(`Gemini Batch API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (data.embeddings) {
            return data.embeddings.map((e: any) => e.values || null);
        } else {
            console.error('[Context Engine] Unexpected Gemini batch response:', data);
            return texts.map(() => null);
        }

    } catch (error) {
        console.error('[Context Engine] Failed to generate batch embeddings:', error);
        return texts.map(() => null);
    }
}

// Helper to calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
