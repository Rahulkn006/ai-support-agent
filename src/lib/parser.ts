import { extractText } from "unpdf";

/**
 * Extracts text from a File object (PDF or TXT).
 * Strategy:
 *  1. For text-based PDFs: use `unpdf` (pdfjs-based, serverless safe)
 *  2. If text is empty (scanned/image PDF): fall back to Groq Vision OCR
 *  3. For TXT files: read buffer directly
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    // --- Engine 1: unpdf (handles text-based PDFs perfectly on Vercel) ---
    let extractedText = "";
    try {
      const uint8Array = new Uint8Array(buffer);
      const { text } = await extractText(uint8Array, { mergePages: true });
      extractedText = (Array.isArray(text) ? text.join("\n\n") : text || "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      console.log(`unpdf extracted ${extractedText.length} characters.`);
    } catch (err) {
      console.error("unpdf failed:", err);
    }

    // --- Engine 2: Groq Vision OCR (fallback for scanned/image PDFs) ---
    if (extractedText.length < 100) {
      console.log("Text too short, trying Groq Vision OCR fallback...");
      try {
        const base64 = buffer.toString("base64");
        const dataUrl = `data:application/pdf;base64,${base64}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "This is a scanned PDF document. Please transcribe ALL the text content from this document exactly as it appears. Include all questions, answers, numbers, headings, and content. Output only the transcribed text, nothing else.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ],
            max_tokens: 8000,
            temperature: 0,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const ocrText = result.choices?.[0]?.message?.content || "";
          if (ocrText.length > 50) {
            console.log(`Groq Vision OCR extracted ${ocrText.length} characters.`);
            extractedText = ocrText;
          }
        } else {
          const errBody = await response.text();
          console.error("Groq Vision OCR error response:", errBody);
        }
      } catch (ocrErr) {
        console.error("Groq Vision OCR failed:", ocrErr);
      }
    }

    if (extractedText.length < 20) {
      throw new Error(
        "Could not extract text from this PDF. It may be password-protected or corrupted."
      );
    }

    return extractedText;
  } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format. Please upload PDF or TXT files.");
  }
}
