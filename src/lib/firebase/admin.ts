import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccountClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Replace literal "\n" strings from the env file with actual newline characters
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1);
    }
    const serviceAccountPrivateKey = rawKey.replace(/\\n/g, '\n');
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!serviceAccountClientEmail || !serviceAccountPrivateKey || !projectId) {
      console.warn("Firebase Admin SDK credentials are missing. Backend operations requiring Firebase will fail.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: serviceAccountClientEmail,
        privateKey: serviceAccountPrivateKey,
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
