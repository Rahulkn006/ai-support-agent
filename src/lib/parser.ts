/**
 * Extracts text from a File object (PDF or TXT)
 * Uses pdfjs-dist (bundled with pdf-parse v2) directly since pdf-parse v2
 * no longer provides a simple parse function.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      // Dynamically import pdfjs-dist (ships with pdf-parse v2)
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

      // Load the PDF document from the buffer
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDocument = await loadingTask.promise;

      // Extract text from each page
      const textParts: string[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        textParts.push(pageText);
      }

      return textParts.join("\n\n");
    } catch (error) {
      console.error("Error parsing PDF:", error);
      throw new Error("Failed to parse PDF file.");
    }
  } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format. Please upload PDF or TXT files.");
  }
}
