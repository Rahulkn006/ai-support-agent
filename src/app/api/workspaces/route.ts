import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

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

    const workspacesSnapshot = await adminDb
      .collection("workspaces")
      .where("userId", "==", userData.uid)
      .get();

    const workspaces = workspacesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ workspaces });
  } catch (error: any) {
    console.error("Fetch workspaces error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch workspaces" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const userData = user || { uid: "test-user" };

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await adminDb.collection("workspaces").add({
      userId: userData.uid,
      name,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      workspace: { id: docRef.id, userId: userData.uid, name } 
    });
  } catch (error: any) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ error: error.message || "Failed to create workspace" }, { status: 500 });
  }
}
