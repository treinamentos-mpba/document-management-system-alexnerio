const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { after, before, test } = require('node:test');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-backend-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '32';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

// Confirma que o app Express pode ser importado sem iniciar um listener.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista metadados e baixa o documento', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['document body'], { type: 'text/plain' }), 'report.txt');
  formData.append('owner', 'user-1');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);

  const { data: uploadedDocument } = await uploadResponse.json();
  assert.equal(uploadedDocument.originalName, 'report.txt');
  assert.equal(uploadedDocument.size, 13);
  assert.equal(uploadedDocument.owner, 'user-1');
  assert.ok(uploadedDocument.id);
  assert.ok(uploadedDocument.uploadedAt);
  assert.equal('storageName' in uploadedDocument, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  const { data: documents } = await listResponse.json();
  assert.deepEqual(documents, [uploadedDocument]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploadedDocument.id}/download`,
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'text/plain');
  assert.match(downloadResponse.headers.get('content-disposition'), /report\.txt/);
  assert.equal(await downloadResponse.text(), 'document body');
});

test('retorna erro quando o arquivo está ausente ou excede o limite', async () => {
  const missingFileForm = new FormData();
  missingFileForm.append('owner', 'user-1');
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: missingFileForm,
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: oversizedForm,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});

test('retorna 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/unknown/download`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
