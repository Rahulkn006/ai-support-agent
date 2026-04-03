/**
 * Extracts text from a File object (PDF or TXT).
 * Strategy:
 *  1. Engine 1: unpdf (pdfjs-based, designed for serverless)
 *  2. Engine 2: pdf-parse v1 (classic Node.js fallback)
 *  3. For TXT files: read buffer directly
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    let extractedText = "";

    // --- Engine 1: unpdf ---
    try {
      const { extractText } = await import("unpdf");
      const uint8Array = new Uint8Array(buffer);
      const result = await extractText(uint8Array, { mergePages: true });
      const text = result.text;
      extractedText = (Array.isArray(text) ? text.join("\n\n") : text || "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      console.log(`[Engine 1 - unpdf] Extracted ${extractedText.length} chars`);
    } catch (err: any) {
      console.error("[Engine 1 - unpdf] Failed:", err.message || err);
    }

    // --- Engine 2: pdf-parse (fallback) ---
    if (extractedText.length < 50) {
      try {
        // Dynamic import to avoid pdf-parse's test-mode initialization issue
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        const fallbackText = (data.text || "").replace(/\n{3,}/g, "\n\n").trim();
        console.log(`[Engine 2 - pdf-parse] Extracted ${fallbackText.length} chars`);
        if (fallbackText.length > extractedText.length) {
          extractedText = fallbackText;
        }
      } catch (err: any) {
        console.error("[Engine 2 - pdf-parse] Failed:", err.message || err);
      }
    }

    if (extractedText.length < 20) {
      throw new Error(
        "This PDF appears to be a scanned image or is empty. Please upload a text-based PDF, or convert your scanned document to a text PDF using a free online OCR tool first."
      );
    }

    return extractedText;
  } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format. Please upload PDF or TXT files.");
  }
}
