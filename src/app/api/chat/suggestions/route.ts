import { NextRequest, NextResponse } from "next/server";
import { searchRelevantChunks } from "@/lib/upstash";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // 1. Get some context chunks from the workspace
    // We search with an empty or generic query to get diverse chunks
    const chunks = await searchRelevantChunks("General overview concepts", workspaceId, 10);
    
    if (chunks.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const context = chunks.map(c => c.content).join("\n\n");

    // 2. Use LLM to generate 3 interesting questions based on the context
    const { text } = await generateText({
      model: groq.chat(process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant"),
      prompt: `Based on the following document excerpts, generate 3 short, engaging, and relevant questions that a user might want to ask. 
      Return ONLY a JSON array of strings.
      
      CONTEXT:
      ${context}
      
      FORMAT:
      ["Question 1", "Question 2", "Question 3"]`,
    });

    // Clean up the response in case the model adds markdown or text
    const cleanText = text.trim();
    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    
    let suggestions = [];
    if (firstBracket !== -1 && lastBracket !== -1) {
      try {
        suggestions = JSON.parse(cleanText.slice(firstBracket, lastBracket + 1));
      } catch (e) {
        console.error("JSON Parse Error:", e);
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Suggestions API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
