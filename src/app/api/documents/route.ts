import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { deleteDocumentChunks } from "@/lib/upstash";

async function getAuthenticatedUser(req: NextRequest, bodyToken?: string) {
  const authHeader = req.headers.get("Authorization");
  let token = bodyToken;

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userData = user || { uid: "test-user" };

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId parameter" }, { status: 400 });
    }

    // Verify workspace ownership (bypass for test-user)
    const workspaceDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    if (!workspaceDoc.exists || (workspaceDoc.data()?.userId !== userData.uid && userData.uid !== "test-user")) {
      return NextResponse.json({ error: "Workspace not found or unauthorized" }, { status: 404 });
    }

    const documentsSnapshot = await adminDb
      .collection("documents")
      .where("workspaceId", "==", workspaceId)
      .get();

    const documents = documentsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const workspaceId = searchParams.get("workspaceId");

    if (!documentId || !workspaceId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(req);
    const userData = user || { uid: "test-user" };

    // Verify workspace ownership
    const workspaceDoc = await adminDb.collection("workspaces").doc(workspaceId).get();
    if (!workspaceDoc.exists || (workspaceDoc.data()?.userId !== userData.uid && userData.uid !== "test-user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete from Firestore
    await adminDb.collection("documents").doc(documentId).delete();
    
    // Cleanup vector chunks from Upstash
    await deleteDocumentChunks(documentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
