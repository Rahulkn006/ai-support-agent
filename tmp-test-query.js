const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccountClientEmail = "firebase-adminsdk-fbsvc@ai-chat-rag-8d799.iam.gserviceaccount.com";
  const rawKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDG5tLfjONunXOk\nKdCmhHX/MdoqfU4cWb2/sOdygHoNvExXU7itydhBwh9eTmM2tXX86WtBggZTdgVv\nySQ2YXcYHbtNF8oN/VY2VwHJ85JkcDSGX3QBIaNUnVxM1/82V9vCQCORXguQHiFE\nXmIOI0ZiWfHRABbNdLww1xAsBpiaO/4zRQlcz4gqgmcviYWqouSYNwk5qlfY0mlr\nwb+CCpTYVSjwrWwWroZ0TIkcVCfuszqyNH4YUUXGRtSblbGdAH8RZ9wiresfDiMl\n/EnfYj+Gyk9cGS3SlZXWHk6lOPvp6e7Z14bKyB+ipmdbi9XD/FsSsvDB1ITx5lGF\nIguCZWf1AgMBAAECggEALjN5shGw1oXeUbigzb0hB4kV6x62ISG7UKaP7Gnpb/1Y\nIkTBNiUXhZbI4IgGxbN616eEkW/ZdlOIycGIFtWm60QkuLCY74z0FKU7NiTM0WW6\n3aeYc5bTsJjo0rSthHr+Ae4SFPcqamyFP7NIxY3uEHRiFjEWGt1NxW5/RCq4EcMK\n3qf2pal8tajmnhF1Of1dtMsy2TryGR/lfTGYDrBrjp2nZFO6Blt2Z6cnpe5GyTdv\nnDE8C+Lchh+ytuyzOzmxJ2G5KY5vJf05nhYNqze31f0FDNuXNOpM4JpkUEdlJiNF\nI73wxULc+J1TnZdPyIfXuO0990Ezr/yMdR9vv5n/lQKBgQDkykAhw5KZcmvEdl2p\nNPB2MBPhJoPdtEYIOirSZZ4duayULk1KHD6B+f2HE86LjjZIFmgBFxlaYxKQP8jZ\TsJFPYnaEweTfrz5cINka4CoNNAG5sLRKeUcOnXaYANEv+OsiUF+PCoZ8OTXCijw\nPKjIWqLF9aElsOsFUMXMqpX1lwKBgQDejpcjIsd6jBGnOw/bQhw/LtPn2EMGupYw\ntbMoO8/3IKf5vl8EVD9FHnrx3vxs4NzbI4dVjQRRrvnuyPM8GNFdguWmhfqDvvv+\nP9hiqjnk/Ae4CfgR4jGdF8KsOZPdYSR1BE3qO7ehTsSrw5s1lB0IThF/XDuHdZSG\nCuRpgZh4UwKBgGHu5RbO1XDTlqfJFvx4Cbo9iDTnPKjpItUguPXIw67rrKDdVP41\nKtiOPuTUKKR6ImgnFyvoTFTxdZ/DfeDvIp9q4Rg07xhGtvN7IvMYRUE7IhTiMGBC\nM60qpQnt8Vg7X2SaeCtl64uhHwOheLak8IaarXRZWTp+CYwD8DdUic5PAoGAd0cM\nkXQuXOt8+peY4/YGlYZPY85v/cc6f1iicEm+J8CExkDVQ8izMCQp2D+eIexR8dCU\n07EEQ5L3uJZSZj8W1ns1AY6EuN8+xwEIw7hf1u2MZYJSRaNo27zERPGG4fsSQvTP\nnV3sCLPii/wFzy1WcgEFN7EC5pKJy11DFZizUqkCgYEAhpVinT6jjdYyttvCVF+S\nSiRM6W9i3CxTJXK3NGDbOyeYBtzvjsrcf9ac7SXfy/cCFggfM/ZGSLYfBqh6BGBa\ndcjZctPj0PUl3jCFGVn8KyxR43uwL3WbesZZeh8rPCC5wghBFtJTS8b2L/LIrxhT\nchoaRum1Qr5g4ckD48+MuyU=\n-----END PRIVATE KEY-----";
  const serviceAccountPrivateKey = rawKey.replace(/\\n/g, '\n');
  const projectId = "ai-chat-rag-8d799";

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail: serviceAccountClientEmail,
      privateKey: serviceAccountPrivateKey,
    }),
  });
}

const db = admin.firestore();

async function testFetch() {
  console.log("Starting test fetch...");
  try {
    const userId = "test-user-id";
    const workspacesSnapshot = await db
      .collection("workspaces")
      .where("userId", "==", userId)
      .get();
    console.log("Fetch successful, count:", workspacesSnapshot.docs.length);
  } catch (error) {
    console.error("Fetch failed:", error.message);
  }
}

testFetch();
