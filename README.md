# Biblioteca API

API REST para gerenciamento de livros, usuários e empréstimos, desenvolvida como projeto de aprendizado de Node.js, Express e PostgreSQL.

## Funcionalidades

- CRUD de livros
- Filtros de livros por título e status
- CRUD de usuários
- Validação e normalização de e-mails
- Cadastro de empréstimos
- Registro de devoluções
- Bloqueio de dois empréstimos ativos para o mesmo livro
- Identificação de empréstimos ativos, atrasados e devolvidos
- Proteção do histórico de empréstimos
- Testes automatizados

## Tecnologias

- Node.js
- Express
- PostgreSQL
- `pg`
- Supertest
- Node Test Runner
- Dotenv

## Como executar

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com os dados do seu PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=biblioteca
```

O arquivo `.env` contém dados privados e não deve ser enviado ao GitHub.

### 3. Prepare o banco de dados

Crie um banco chamado `biblioteca` no PostgreSQL.

Depois execute os arquivos da pasta `migrations` na ordem numérica:

```text
001_criar_tabela_livros.sql
002_adicionar_restricao_status.sql
003_criar_tabela_usuarios.sql
004_criar_tabela_emprestimos.sql
```

### 4. Inicie a API

```bash
npm start
```

A API ficará disponível em:

```text
http://localhost:3000
```

## Testes

O PostgreSQL precisa estar disponível e configurado no `.env`.

Execute:

```bash
npm test
```

Os testes utilizam transações e `ROLLBACK`, portanto os registros criados durante os testes não permanecem no banco.

## Rotas de livros

| Método | Rota | Descrição |
|---|---|---|
| GET | `/livros` | Lista os livros |
| GET | `/livros/:id` | Busca um livro pelo ID |
| POST | `/livros` | Cadastra um livro |
| PUT | `/livros/:id` | Atualiza um livro |
| DELETE | `/livros/:id` | Apaga um livro sem empréstimos |

Filtros disponíveis:

```http
GET /livros?status=lido
GET /livros?titulo=dom
```

Exemplo de cadastro:

```json
{
  "titulo": "Dom Casmurro",
  "autor": "Machado de Assis",
  "status": "quero ler"
}
```

Status permitidos:

```text
quero ler
lendo
lido
```

## Rotas de usuários

| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios` | Lista os usuários |
| GET | `/usuarios/:id` | Busca um usuário pelo ID |
| POST | `/usuarios` | Cadastra um usuário |
| PUT | `/usuarios/:id` | Atualiza um usuário |
| DELETE | `/usuarios/:id` | Apaga um usuário sem empréstimos |

Exemplo de cadastro:

```json
{
  "nome": "Ana Souza",
  "email": "ana@example.com"
}
```

## Rotas de empréstimos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/emprestimos` | Lista e filtra os empréstimos |
| GET | `/emprestimos/:id` | Busca um empréstimo pelo ID |
| POST | `/emprestimos` | Registra um empréstimo |
| PATCH | `/emprestimos/:id/devolucao` | Registra a devolução |
| PATCH | `/emprestimos/:id/renovacao` | Renova o prazo de devolução |

Outras rotas:

- `GET /relatorios/resumo`: retorna os totais da biblioteca.

````markdown
Filtros disponíveis:

```http
GET /emprestimos?status=ativo
GET /emprestimos?usuario_id=3
GET /emprestimos?livro_id=2
GET /emprestimos?usuario_id=3&status=atrasado
GET /emprestimos?livro_id=2&status=devolvido

Exemplo de empréstimo:

```json
{
  "livro_id": 1,
  "usuario_id": 1,
  "data_prevista_devolucao": "2026-09-01"
}
```

## Regras de negócio

- Um livro não pode possuir dois empréstimos ativos.
- A data prevista de devolução não pode estar no passado.
- Um empréstimo devolvido libera o livro para um novo empréstimo.
- Livros e usuários com histórico de empréstimos não podem ser apagados.
- O status do empréstimo é calculado como `ativo`, `atrasado` ou `devolvido`.
- E-mails de usuários não podem ser repetidos.
- A renovação deve definir uma data posterior ao prazo atual.
- Empréstimos já devolvidos não podem ser renovados.

## Estrutura do projeto

```text
src/
├── config/
├── controllers/
├── routes/
├── utils/
├── app.js
└── server.js

migrations/
test/
```

## Objetivo

Este projeto foi desenvolvido para praticar construção de APIs REST, integração com PostgreSQL, relacionamentos entre tabelas, validações, regras de negócio e testes automatizados.