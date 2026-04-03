// Test uploading a PDF to the local API
const fs = require('fs');

async function testUpload() {
  // Create a proper text-based PDF with recognizable content
  const pdfBuf = Buffer.from(
    'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1MiA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDEwMCA3MDAgVGQgKEhlbGxvIFdvcmxkIFRlc3QgUERGIERvY3VtZW50KSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA2MiAwMDAwMCBuIAowMDAwMDAwMTIzIDAwMDAwIG4gCjAwMDAwMDAzMDIgMDAwMDAgbiAKMDAwMDAwMDQwNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ4OQolJUVPRg==',
    'base64'
  );

  // Get a workspace ID first
  const wsRes = await fetch('http://localhost:3000/api/workspaces', {
    headers: { 'Authorization': 'Bearer mock-token' }
  });
  const wsData = await wsRes.json();
  const wsId = wsData.workspaces?.[0]?.id;
  if (!wsId) { console.log('No workspace found'); return; }
  console.log('Using workspace:', wsId);

  // Upload using FormData
  const blob = new Blob([pdfBuf], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'test-document.pdf');
  formData.append('workspaceId', wsId);

  console.log('Uploading test PDF...');
  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer mock-token' },
    body: formData,
  });

  console.log('Status:', res.status);
  const body = await res.json();
  console.log('Response:', JSON.stringify(body));
}

testUpload().catch(e => console.error('Test failed:', e));
