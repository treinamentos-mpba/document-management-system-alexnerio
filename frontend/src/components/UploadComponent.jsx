import { useRef, useState } from 'react';

export default function UploadComponent({ isUploading, onUpload }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  function chooseFile(nextFile) {
    if (nextFile) {
      setFile(nextFile);
      setError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Selecione um arquivo para continuar.');
      return;
    }

    setError('');
    try {
      await onUpload(file, owner);
      setFile(null);
      setOwner('');
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    } catch (uploadError) {
      setError(uploadError.message);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`upload-dropzone${isDragging ? ' is-dragging' : ''}`}
        htmlFor="document-file"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInput}
          className="visually-hidden"
          id="document-file"
          type="file"
          onChange={(event) => chooseFile(event.target.files[0])}
        />
        <span className="upload-mark" aria-hidden="true">+</span>
        <span className="dropzone-title">
          {file ? 'Arquivo selecionado' : 'Adicionar arquivo'}
        </span>
        <span className="dropzone-description">
          {file ? file.name : 'Arraste para esta área ou escolha no dispositivo'}
        </span>
      </label>

      {file && (
        <div className="selected-file" title={file.name}>
          <span>{file.name}</span>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInput.current) {
                fileInput.current.value = '';
              }
            }}
          >
            Remover
          </button>
        </div>
      )}

      <label className="field-label" htmlFor="document-owner">
        Responsável <span>opcional</span>
      </label>
      <input
        className="text-input"
        id="document-owner"
        type="text"
        maxLength={120}
        value={owner}
        onChange={(event) => setOwner(event.target.value)}
        placeholder="Nome ou identificação"
      />

      {error && <p className="form-error" role="alert">{error}</p>}

      <button className="primary-button" type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      <p className="upload-note">Até 10 MiB por arquivo</p>
    </form>
  );
}