const API_PREFIX = '/api';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o backend está ativo.');
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch {
      // Mantém a mensagem padrão quando a resposta de erro não contém JSON.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  if (owner.trim()) {
    formData.append('owner', owner.trim());
  }

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json();
  return payload.data;
}

function getDownloadName(contentDisposition, fallbackName) {
  const encodedName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return fallbackName;
    }
  }

  const plainName = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plainName || fallbackName;
}

export async function downloadDocument(id, originalName) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return {
    blob: await response.blob(),
    filename: getDownloadName(
      response.headers.get('content-disposition') || '',
      originalName,
    ),
  };
}