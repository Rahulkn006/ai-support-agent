/**
 * Splits a large text string into smaller chunks suitable for embedding.
 * Uses a simple token/character count strategy with overlap.
 */
export function chunkText(text: string, chunkSize: number = 2000, overlap: number = 400): string[] {
  // Basic cleaning
  const normalizedText = text.replace(/\n{3,}/g, "\n\n").trim();
  
  if (!normalizedText) return [];

  const chunks: string[] = [];
  let i = 0;
  
  while (i < normalizedText.length) {
    // Determine the end of the chunk
    let end = i + chunkSize;
    
    // If we're not at the very end of the text, try to find a natural break point
    if (end < normalizedText.length) {
      // Look for the last newline or period within the chunk to avoid splitting words/sentences
      const lastNewline = normalizedText.lastIndexOf("\n", end);
      const lastPeriod = normalizedText.lastIndexOf(". ", end);
      
      // If we found a break point in the latter half of the chunk, use it
      const breakPoint = Math.max(lastNewline, lastPeriod);
      if (breakPoint > i + chunkSize / 2) {
        end = breakPoint + 1; // Include the newline/period
      }
    }
    
    chunks.push(normalizedText.slice(i, end).trim());
    
    // Move forward by chunkSize - overlap
    i = end - overlap;
    
    // Safety check to prevent infinite loops if overlap is misconfigured
    if (i <= 0 || (end - overlap) <= i - chunkSize) {
       i += Math.floor(chunkSize / 2); // Force move forward
    }
  }

  return chunks.filter(c => c.length > 50); // Filter out tiny chunks
}
