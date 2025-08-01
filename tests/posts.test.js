require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  // Cria um usuário para associar posts
  await db.Usuario.create({
    nome: 'Usuário Teste',
    email: 'teste@teste.com',
    senha: '123456',
  });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('📄 Posts API', () => {
  let postId;

  test('GET /posts deve retornar array vazio inicialmente', async () => {
    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('POST /posts deve criar um novo post com dados válidos', async () => {
    const res = await request(app).post('/posts').send({
      titulo: 'Post de Teste',
      conteudo: 'Conteúdo do post',
      usuario_id: 1,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.titulo).toBe('Post de Teste');
    postId = res.body.id;
  });

  test('POST /posts deve retornar erro se faltar título', async () => {
    const res = await request(app).post('/posts').send({
      conteudo: 'Sem título',
      usuario_id: 1,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('GET /posts/:id deve retornar o post criado', async () => {
    const res = await request(app).get(`/posts/${postId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(postId);
    expect(res.body.titulo).toBe('Post de Teste');
  });

  test('GET /posts/:id deve retornar 404 para post inexistente', async () => {
    const res = await request(app).get('/posts/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });

  test('PUT /posts/:id deve atualizar post existente', async () => {
    const res = await request(app).put(`/posts/${postId}`).send({
      titulo: 'Post Atualizado',
      conteudo: 'Conteúdo atualizado',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.titulo).toBe('Post Atualizado');
  });

  test('PUT /posts/:id deve retornar 404 para post inexistente', async () => {
    const res = await request(app).put('/posts/9999').send({
      titulo: 'Não existe',
      conteudo: 'Não existe',
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });

  test('GET /posts/search?q=Teste deve retornar posts encontrados', async () => {
    const res = await request(app).get('/posts/search?q=Atualizado');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /posts/search sem query deve retornar erro 400', async () => {
    const res = await request(app).get('/posts/search');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('DELETE /posts/:id deve deletar post existente', async () => {
    const res = await request(app).delete(`/posts/${postId}`);
    expect(res.statusCode).toBe(204);
  });

  test('DELETE /posts/:id deve retornar 404 para post inexistente', async () => {
    const res = await request(app).delete(`/posts/${postId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });
});
