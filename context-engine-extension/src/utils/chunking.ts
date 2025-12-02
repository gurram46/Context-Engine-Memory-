/**
 * Splits text into chunks of a specified size with overlap.
 * This is a simple character-based chunker. For better results, a token-based chunker could be used in the future.
 * 
 * @param text The full text content to chunk.
 * @param chunkSize The target size of each chunk in characters (default: 1000).
 * @param overlap The number of characters to overlap between chunks (default: 200).
 * @returns An array of text chunks.
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (!text) return [];
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // If we are not at the end of the text, try to find a sentence break or space to cut cleanly
        if (endIndex < text.length) {
            // Look for the last period, newline, or space within the last 10% of the chunk
            const lookback = Math.floor(chunkSize * 0.1);
            const slice = text.slice(endIndex - lookback, endIndex);

            const lastPeriod = slice.lastIndexOf('.');
            const lastNewline = slice.lastIndexOf('\n');
            const lastSpace = slice.lastIndexOf(' ');

            if (lastPeriod !== -1) {
                endIndex = endIndex - lookback + lastPeriod + 1;
            } else if (lastNewline !== -1) {
                endIndex = endIndex - lookback + lastNewline + 1;
            } else if (lastSpace !== -1) {
                endIndex = endIndex - lookback + lastSpace + 1;
            }
        }

        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        // Move the start index forward, subtracting the overlap
        startIndex = endIndex - overlap;

        // Prevent infinite loops if overlap is too big or logic fails
        if (startIndex >= endIndex) {
            startIndex = endIndex;
        }
    }

    return chunks;
}
