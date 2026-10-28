import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadDocuments() {
    setIsLoading(true);
    setLoadError('');
    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(file, owner) {
    setIsUploading(true);
    setNotice('');
    try {
      const uploadedDocument = await uploadDocument(file, owner);
      setDocuments((currentDocuments) =>
        [uploadedDocument, ...currentDocuments].sort(
          (left, right) => right.uploadedAt.localeCompare(left.uploadedAt),
        ),
      );
      setLoadError('');
      setNotice('Documento adicionado ao arquivo.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="topline">
            <a className="brand-lockup" href="/" aria-label="DMS, início">
              <span className="brand-mark" aria-hidden="true">D</span>
              <span className="brand-name">Arquivo local</span>
            </a>
            <span className="local-status">
              <span className="status-dot" aria-hidden="true" />
              DMS / Biblioteca
            </span>
          </div>
          <div className="header-content">
            <div className="header-title-block">
              <p>Gestão de documentos</p>
              <h1>Documentos</h1>
            </div>
            <div className="header-total" aria-live="polite">
              <strong>{documents.length.toString().padStart(2, '0')}</strong>
              <span>no arquivo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="upload-section" aria-labelledby="upload-heading">
          <h2 id="upload-heading">Adicionar documento</h2>
          <UploadComponent isUploading={isUploading} onUpload={handleUpload} />
          {notice && <p className="upload-note" role="status">{notice}</p>}
        </section>

        <DocumentList
          documents={documents}
          error={loadError}
          isLoading={isLoading}
          onRetry={loadDocuments}
        />
      </main>

      <footer className="site-footer">
        <p>Armazenamento local</p>
        <p>Metadados disponíveis durante a sessão do servidor</p>
      </footer>
    </div>
  );
}
