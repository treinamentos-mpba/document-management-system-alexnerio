# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para enviar, listar e baixar documentos armazenados no filesystem local, mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por formulário multipart.
- Listagem dos metadados dos documentos recebidos pelo processo em execução.
- Download de um documento pelo identificador.
- Registro opcional de um valor informativo de proprietário (`owner`), sem autenticação ou autorização associadas.
- Armazenamento dos arquivos em `backend/storage` com Multer e `diskStorage`.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência durável dos metadados.
- Autenticação, autorização, isolamento de dados ou filtragem por proprietário.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Recuperação automática ou limpeza de arquivos órfãos após reinicialização.
- Validação do conteúdo do arquivo, antivírus ou restrição por tipo MIME/extensão.

## 3. Requisitos funcionais

| ID    | Requisito                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------ |
| RF-01 | O cliente pode enviar um arquivo usando o campo multipart `file`.                                                 |
| RF-02 | O upload pode incluir um campo textual opcional `owner`, tratado apenas como informação fornecida pelo cliente.   |
| RF-03 | O sistema atribui ao documento um identificador único e um nome interno de armazenamento que não colide com outros uploads. |
| RF-04 | O cliente pode listar os metadados dos documentos registrados no processo atual, ordenados do mais recente ao mais antigo. |
| RF-05 | O cliente pode baixar o conteúdo de um documento por seu identificador; o arquivo baixado conserva o nome original para apresentação ao cliente. |
| RF-06 | O sistema responde com erro apropriado quando o campo de arquivo está ausente, o arquivo excede o limite ou o documento não existe. |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Os arquivos são gravados somente no filesystem local, em `backend/storage` por padrão, usando Multer `diskStorage`. |
| RNF-02 | Os metadados ficam em memória. Uma reinicialização do backend os remove; os arquivos no disco podem permanecer sem metadados correspondentes. |
| RNF-03 | Porta, diretório de armazenamento e limite de upload são configuráveis por variáveis de ambiente.                  |
| RNF-04 | O limite inicial de upload é 10 MiB (10.485.760 bytes), configurável por `MAX_FILE_SIZE_BYTES`.                     |
| RNF-05 | O sistema aceita qualquer tipo de arquivo, sem declarar que o conteúdo foi inspecionado ou validado.               |
| RNF-06 | O nome original enviado pelo cliente não é usado como caminho no filesystem. O nome interno é gerado pelo servidor. |
| RNF-07 | Erros da API usam JSON com código estável e mensagem legível, sem expor caminhos locais ou detalhes internos.        |
| RNF-08 | O backend usa Node.js e Express em CommonJS; o frontend usa React e Vite em ESM; o código permanece em JavaScript.  |
| RNF-09 | Os testes de backend usam o runner nativo `node:test`.                                                              |

Valores padrão propostos: `PORT=3000`, `STORAGE_DIR=backend/storage` e `MAX_FILE_SIZE_BYTES=10485760`. `STORAGE_DIR` deve resolver para um diretório local da aplicação. Os nomes de variáveis são a configuração proposta para esta especificação.

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo                  | Visibilidade | Descrição                                                                                  |
| ------------ | --------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `id`         | string (UUID)         | Público      | Identificador único usado nas rotas de listagem e download.                                |
| `originalName` | string              | Público      | Nome original fornecido pelo cliente; usado como nome de download, nunca como caminho.      |
| `size`       | number (inteiro)      | Público      | Tamanho do arquivo em bytes.                                                               |
| `uploadedAt` | string (ISO 8601 UTC) | Público      | Data e hora em que o upload foi registrado.                                                |
| `owner`      | string ou `null`      | Público      | Valor opcional e informativo; não representa identidade autenticada nem controla acesso.   |
| `storageName` | string               | Interno      | Nome opaco e único gerado pelo servidor para localizar o arquivo no diretório configurado. |

`storageName` é mantido junto aos metadados em memória e não é retornado pela API. A associação entre `id` e `storageName` permite localizar o arquivo sem confiar em caminhos enviados pelo cliente. Não há persistência dos metadados entre reinicializações.

Representação pública de exemplo:

```json
{
  "id": "b1d5e0e2-72f6-4d58-ae7e-a20c430c5889",
  "originalName": "relatorio.pdf",
  "size": 48213,
  "uploadedAt": "2026-10-28T14:30:00.000Z",
  "owner": null
}
```

## 6. Contratos de API

As rotas do backend são relativas à raiz. No desenvolvimento, o frontend pode chamá-las com o prefixo `/api`; o proxy do Vite remove esse prefixo antes de encaminhar a requisição ao backend.

Formato comum de erro:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### POST /upload

- **Content-Type:** `multipart/form-data`.
- **Campos:** `file` obrigatório, contendo um arquivo; `owner` opcional, texto informativo.
- **Limite:** 10 MiB por arquivo por padrão, ajustável por `MAX_FILE_SIZE_BYTES`. Qualquer tipo de arquivo é aceito.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.

```json
{
  "data": {
    "id": "b1d5e0e2-72f6-4d58-ae7e-a20c430c5889",
    "originalName": "relatorio.pdf",
    "size": 48213,
    "uploadedAt": "2026-10-28T14:30:00.000Z",
    "owner": null
  }
}
```

- **Erros:** `400 Bad Request` para campo `file` ausente ou requisição multipart inválida (`FILE_REQUIRED` ou `INVALID_UPLOAD`); `413 Payload Too Large` quando o arquivo ultrapassar o limite (`FILE_TOO_LARGE`); `500 Internal Server Error` para falha inesperada de gravação (`STORAGE_ERROR`).

### GET /documents

- **Entrada:** sem parâmetros ou corpo.
- **Sucesso:** `200 OK`, `Content-Type: application/json`; a lista inclui todos os metadados mantidos em memória, sem filtragem por `owner`, ordenados por `uploadedAt` decrescente.

```json
{
  "data": [
    {
      "id": "b1d5e0e2-72f6-4d58-ae7e-a20c430c5889",
      "originalName": "relatorio.pdf",
      "size": 48213,
      "uploadedAt": "2026-10-28T14:30:00.000Z",
      "owner": null
    }
  ]
}
```

- **Lista vazia:** retorna `200 OK` com `"data": []`.
- **Erros:** `500 Internal Server Error` (`INTERNAL_ERROR`) em falha inesperada.

### GET /documents/:id/download

- **Entrada:** `id` na URL.
- **Sucesso:** `200 OK` com o conteúdo binário do arquivo; `Content-Disposition: attachment` usa `originalName` como nome de download. O tipo de conteúdo é o tipo informado/detectado no upload, ou `application/octet-stream` quando indisponível.
- **Erros:** `404 Not Found` (`DOCUMENT_NOT_FOUND`) se o identificador não estiver registrado ou se o arquivo associado não estiver disponível; `500 Internal Server Error` (`STORAGE_ERROR`) para outra falha de leitura.

## 7. Decisões arquiteturais

- O backend segue Clean Architecture simples: `routes` definem endpoints e encaminham; `controllers` validam o limite HTTP e formatam respostas; `services` concentram regras de negócio; `repositories` tratam metadados e filesystem.
- O fluxo de dependência é `routes -> controllers -> services -> repositories`. Camadas internas não dependem de Express nem de detalhes de transporte.
- A persistência de arquivos é local e usa Multer com `diskStorage`; a persistência de metadados é em memória nesta fase. Não adicionar banco de dados ou serviço externo.
- O nome físico do arquivo é gerado pelo servidor e separado do nome original. A API não revela o nome físico nem o caminho de armazenamento.
- O frontend é construído com componentes React e consome a API via `fetch`. Em desenvolvimento, o Vite encaminha `/api` ao backend local.
- A especificação não define autenticação. O campo `owner` é metadado informativo e não pode ser tratado como prova de identidade ou autorização.
- Como os metadados não são duráveis, após reiniciar o processo os arquivos existentes podem não estar listados ou disponíveis por ID. A reconciliação desses arquivos não faz parte desta versão.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura do produto; não fazem parte da criação desta especificação.

1. Implementar os contratos da API e as regras de upload, listagem e download nas camadas definidas.
2. Implementar armazenamento de arquivos local com Multer `diskStorage`, configurações por ambiente e metadados em memória.
3. Cobrir os casos de sucesso, validação, limites, documentos inexistentes e falhas de filesystem com testes `node:test`.
4. Construir a interface React para upload, listagem e download e integrá-la à API pelo proxy de desenvolvimento.
5. Validar o fluxo ponta a ponta e documentar as limitações de reinicialização e arquivos órfãos.