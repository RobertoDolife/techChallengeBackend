# 🧠 Tech Challenge - Plataforma de Blogging Dinâmico

Projeto desenvolvido como parte do Tech Challenge da FIAP, integrando conhecimentos adquiridos durante a fase 2.

## 📚 Descrição

Esta aplicação tem como objetivo fornecer uma plataforma centralizada e tecnológica onde professores da rede pública possam criar, editar e compartilhar conteúdos educacionais em formato de blog com seus alunos, promovendo inclusão digital e acesso ao conhecimento.

A aplicação foi refatorada para Node.js visando maior escalabilidade e flexibilidade para uso nacional.

---

## ✅ Funcionalidades Implementadas

- 📄 Listar todas as postagens (alunos e professores)
- 🔍 Buscar posts por palavras-chave no título ou conteúdo
- 📝 Criar nova postagem (professores)
- ✏️ Editar postagem existente
- 🗑️ Excluir postagem
- 🖼️ Upload de imagem para o post
- 🔐 Validação de campos obrigatórios (como título e autor)

---

## 🔧 Tecnologias Utilizadas

| Stack | Descrição |
|-------|-----------|
| **Node.js** | Plataforma do back-end principal |
| **Express.js** | Framework web para rotas e middleware |
| **MySQL** | Banco de dados relacional para persistência |
| **Sequelize** | ORM para manipulação do banco de dados |
| **Docker** | Containerização da aplicação e banco |
| **Jest** + **Supertest** | Testes unitários e de integração |
| **GitHub Actions** | Pipeline de CI/CD com testes e coverage |
| **Zod** | Validação segura de variáveis de ambiente |

---

## 📁 Estrutura de Pastas

├── src/
│ ├── app.js # Configuração do Express
│ ├── server.js # Inicialização do servidor
│ ├── routes/ # Rotas da API
│ ├── controllers/ # Lógica dos endpoints
│ ├── models/ # Sequelize models
│ ├── config/ # Multer e sequelize config
│ ├── common/env.js # Validação de variáveis .env
├── migrations/ # Migrations com Sequelize CLI
├── tests/ # Testes com Jest e Supertest
├── docker-compose.yml
├── Dockerfile
├── .env
├── README.md

---

## 🚀 Como Executar o Projeto

### 🧪 Requisitos
- Docker e Docker Compose instalados
- Node.js (caso queira rodar localmente sem Docker)

### 🔄 Rodando com Docker

```bash
# Subir containers (app + MySQL)
docker-compose up --build
A aplicação estará disponível em: http://localhost:3000/

📦 Instalar dependências (modo local)
npm install

▶️ Rodar servidor localmente
npm start

Certifique-se de que seu banco MySQL esteja rodando e que o .env esteja configurado corretamente.

✅ Variáveis de Ambiente .env
env
DATABASE_USERNAME=user
DATABASE_PASSWORD=password
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
PORT=3000
🧪 Testes Automatizados
▶️ Executar testes + cobertura
bash

npm test
🧾 Cobertura mínima exigida:
✅ O projeto garante no mínimo 20% de cobertura de código em testes, incluindo as funções de:

Criação de post

Edição de post

Exclusão de post

⚙️ CI/CD com GitHub Actions
O repositório possui um workflow automatizado que executa:

Instalação de dependências

Migrations com Sequelize

Testes automatizados com Jest

Validação de cobertura mínima (≥ 20%)

Arquivo: .github/workflows/ci-cd.yml

📌 Endpoints da API
Método	Rota	Descrição
GET	/posts	Lista todos os posts
GET	/posts/:id	Retorna um post pelo ID
POST	/posts	Cria um novo post (com upload de imagem)
PUT	/posts/:id	Atualiza título, conteúdo e imagem
DELETE	/posts/:id	Exclui um post
GET	/posts/search?q=palavra	Busca por título ou conteúdo
