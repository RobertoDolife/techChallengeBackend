const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const postsRoutes = require('./routes/posts.routes');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middlewares/error.middleware');

// Configuração de origens permitidas
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://localhost:8081'];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads/posts', express.static(path.join(__dirname, '..', 'public', 'uploads', 'posts')));

app.use('/posts', postsRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => res.send('API do Tech Challenge está rodando!'));

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

module.exports = app;
