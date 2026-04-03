import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { searchRelevantChunks } from "@/lib/upstash";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages: bodyMessages, workspaceId, supportMode } = body;

    console.log("Incoming body:", { workspaceId, supportMode, messageCount: bodyMessages?.length });

    const messages = Array.isArray(bodyMessages)
      ? bodyMessages
      : [{ role: "user", content: body.message || "Hello" }];

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let context = "";

    if (workspaceId && lastUserMessage) {
      console.log(`Searching for context in workspace: ${workspaceId}`);
      
      let searchQuery = lastUserMessage;
      
      if (messages.length > 2) {
        try {
          const recentMessages = messages.slice(-5).map((m: any) => ({
            role: m.role || "user",
            content: typeof m.content === "string" ? m.content : m.content?.text || ""
          }));
          
          const standaloneReq = await generateText({
            model: groq.chat(process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant"),
            system: "Given the conversation history and the latest user question, rewrite the latest question into a self-contained, standalone query that can be used to search a document database. Return ONLY the standalone question without any other conversational text or quotes.",
            prompt: `Conversation:\n${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}`,
            temperature: 0,
          });
          
          if (standaloneReq.text) {
            searchQuery = standaloneReq.text.trim();
            console.log("Rewritten query:", searchQuery);
          }
        } catch (e) {
          console.error("Query reformulation error:", e);
        }
      }

      const chunks = await searchRelevantChunks(searchQuery, workspaceId, 10);
      context = chunks.map(c => c.content).join("\n\n---\n\n");
      console.log(`Found ${chunks.length} relevant chunks`);
    }

    const formattedMessages = messages
      .map((msg: any) => ({
        role: msg.role || "user",
        content:
          typeof msg.content === "string"
            ? msg.content
            : msg.content?.text || "",
      }))
      .filter((msg: any) => msg.content && msg.content.trim() !== "");

    const systemPrompt = supportMode
      ? `You are a professional customer support agent for DocuMind AI. 
         Your goal is to assist users based STRICTLY on the provided document context below.
         If the answer is not in the context, politely inform the user that you don't have that information.
         Maintain a helpful, professional, and concise tone.
         
         CONTEXT FROM DOCUMENTS:
         ${context || "No relevant document context found."}`
      : `You are DocuMind AI, a helpful assistant. 
         Use the following document context to enrich your answers if relevant.
         If the context isn't helpful, you can use your general knowledge but prioritize the documents.
         
         CONTEXT FROM DOCUMENTS:
         ${context || "No relevant document context found."}`;

    console.log("System Prompt length:", systemPrompt.length);

    const result = await streamText({
      model: groq.chat(process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: formattedMessages,
    });

    if (!result) {
      throw new Error("No response from model");
    }

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("API ERROR:", error);

    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500 }
    );
  }
}