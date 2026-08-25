# Biblioteca

Este é um projeto que estou desenvolvendo para praticar Node.js, Express e PostgreSQL. Ele começou como uma API de livros e, durante o aprendizado, ganhou cadastro de usuários, controle de empréstimos, testes automatizados e uma interface web.

## O que já funciona

- Cadastro, edição, listagem e exclusão de livros
- Cadastro, edição, listagem e exclusão de usuários
- Registro, renovação e devolução de empréstimos
- Filtros de livros e empréstimos
- Identificação de empréstimos ativos, atrasados e devolvidos
- Controle da disponibilidade dos livros
- Validações de dados e regras de negócio
- Resumo com os números da biblioteca
- Interface web para utilizar as principais funcionalidades
- Testes automatizados da API

## O que pratiquei neste projeto

- Criação de uma API REST com Express
- Conexão do Node.js com PostgreSQL
- Relacionamentos entre tabelas
- Consultas SQL com filtros e junções
- Organização do backend em rotas e controllers
- Validação dos dados recebidos pela API
- Testes com Node Test Runner e Supertest
- Consumo da API no frontend com `fetch`
- Manipulação do DOM com JavaScript

## Tecnologias

- Node.js
- Express
- PostgreSQL
- HTML, CSS e JavaScript
- `pg`
- `dotenv`
- Supertest
- Node Test Runner

## Como executar

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o banco

Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Depois, preencha o `.env` com os dados do seu PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=biblioteca
```

O `.env` não deve ser enviado para o GitHub porque pode conter dados privados.

### 3. Crie as tabelas

Crie no PostgreSQL um banco chamado `biblioteca`. Depois, execute os arquivos da pasta `migrations` na ordem:

```text
001_criar_tabela_livros.sql
002_adicionar_restricao_status.sql
003_criar_tabela_usuarios.sql
004_criar_tabela_emprestimos.sql
```

### 4. Inicie o projeto

```bash
npm start
```

A interface ficará disponível em `http://localhost:3000`.

## Testes

Com o PostgreSQL configurado e disponível, execute:

```bash
npm test
```

Os dados criados pelos testes são desfeitos com `ROLLBACK`. As sequências dos IDs do PostgreSQL, porém, continuam avançando, mesmo quando a transação é desfeita.

## Principais rotas

### Livros

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/livros` | Listar livros |
| GET | `/livros/:id` | Buscar um livro |
| POST | `/livros` | Cadastrar um livro |
| PUT | `/livros/:id` | Atualizar um livro |
| DELETE | `/livros/:id` | Excluir um livro |

Os status de leitura permitidos são `quero ler`, `lendo` e `lido`.

### Usuários

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/usuarios` | Listar usuários |
| GET | `/usuarios/:id` | Buscar um usuário |
| POST | `/usuarios` | Cadastrar um usuário |
| PUT | `/usuarios/:id` | Atualizar um usuário |
| DELETE | `/usuarios/:id` | Excluir um usuário |

### Empréstimos

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/emprestimos` | Listar e filtrar empréstimos |
| GET | `/emprestimos/:id` | Buscar um empréstimo |
| POST | `/emprestimos` | Registrar um empréstimo |
| PATCH | `/emprestimos/:id/devolucao` | Registrar uma devolução |
| PATCH | `/emprestimos/:id/renovacao` | Renovar o prazo |

A rota `GET /relatorios/resumo` retorna os totais utilizados na página inicial.

## Algumas regras do sistema

- Um livro não pode ter dois empréstimos ativos ao mesmo tempo.
- A data prevista de devolução não pode estar no passado.
- Um livro volta a ficar disponível depois da devolução.
- Livros e usuários com histórico de empréstimos não podem ser excluídos.
- Um empréstimo devolvido não pode ser renovado.
- A nova data de uma renovação precisa ser posterior ao prazo atual.
- Não é permitido cadastrar o mesmo e-mail para dois usuários.

## Estrutura

```text
migrations/  scripts utilizados para criar e alterar as tabelas
public/      arquivos da interface web
src/         código da API
test/        testes automatizados
```

Este projeto continua em desenvolvimento enquanto avanço nos estudos de backend e frontend.
