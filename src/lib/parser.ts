import pdfParse from "pdf-parse";

/**
 * Extracts text from a File object (PDF or TXT)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const data = await pdfParse(buffer);
      if (!data || !data.text) {
        throw new Error("Parsed PDF text was empty.");
      }
      // Basic cleanup of extracted PDF text to remove excessive empty lines
      return data.text.replace(/\n{3,}/g, "\n\n").trim();
    } catch (error: any) {
      console.error("Error parsing PDF with pdf-parse:", error);
      throw new Error(`PDF Parse Error: ${error.message || error}`);
    }
  } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format. Please upload PDF or TXT files.");
  }
}
