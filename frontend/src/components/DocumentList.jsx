import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getFileExtension(filename) {
  const extension = filename.split('.').pop();
  return extension && extension !== filename ? extension.slice(0, 5).toUpperCase() : 'ARQ';
}

export default function DocumentList({ documents, error, isLoading, onRetry }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">ARQUIVO</p>
          <h2 id="documents-heading">Documentos</h2>
        </div>
        <span className="document-count">
          {documents.length.toString().padStart(2, '0')} itens
        </span>
      </div>

      {error ? (
        <div className="list-state list-error" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      ) : isLoading ? (
        <p className="list-state" role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <div className="list-state empty-state">
          <span className="empty-rule" aria-hidden="true" />
          <p>Nenhum documento registrado.</p>
        </div>
      ) : (
        <>
          <div className="document-row document-header" aria-hidden="true">
            <span>Nome</span>
            <span>Responsável</span>
            <span>Enviado em</span>
            <span>Tamanho</span>
            <span />
          </div>
          <ul className="document-list">
            {documents.map((document) => (
              <li className="document-row" key={document.id}>
                <div className="document-name-cell">
                  <span className="file-type" aria-hidden="true">
                    {getFileExtension(document.originalName)}
                  </span>
                  <span className="document-name" title={document.originalName}>
                    {document.originalName}
                  </span>
                </div>
                <span className="document-owner" title={document.owner || ''}>
                  {document.owner || '—'}
                </span>
                <time className="document-date" dateTime={document.uploadedAt}>
                  {formatDate(document.uploadedAt)}
                </time>
                <span className="document-size">{formatFileSize(document.size)}</span>
                <DownloadButton document={document} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}