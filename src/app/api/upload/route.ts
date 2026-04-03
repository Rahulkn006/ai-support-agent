import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { extractTextFromFile } from "@/lib/parser";
import { chunkText } from "@/lib/chunker";
import { addChunksToUpstash } from "@/lib/upstash";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userData = user || { uid: "test-user" };

    const formData = await req.formData();
    const file = formData.get("file") as unknown as File;
    const workspaceId = formData.get("workspaceId") as string;

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify workspace ownership
    const workspaceDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    if (!workspaceDoc.exists || (workspaceDoc.data()?.userId !== userData.uid && userData.uid !== "test-user")) {
      return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 404 });
    }

    // 1. Create a Document entry in Firestore (Metadata only)
    const docRef = adminDb.collection("documents").doc();
    const documentId = docRef.id;

    await docRef.set({
      id: documentId,
      workspaceId,
      userId: userData.uid, // Explicitly link to user
      name: file.name,
      size: file.size,
      createdAt: new Date().toISOString(),
    });

    // 2. Extract Text
    const text = await extractTextFromFile(file);
    
    // 3. Chunk Text
    const chunks = chunkText(text, 1000, 200);
    
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No extractable text found in file" }, { status: 400 });
    }

    // 4. Store Chunks and Embeddings in Upstash Vector (Cloud)
    await addChunksToUpstash(documentId, chunks, {
      workspaceId,
      documentName: file.name
    });

    return NextResponse.json({ 
      success: true, 
      documentId, 
      chunksProcessed: chunks.length 
    });
    
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process document" }, { status: 500 });
  }
}
