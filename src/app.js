const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const postsRoutes = require('./routes/posts.routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads/posts', express.static(path.join(__dirname, '..', 'public', 'uploads', 'posts')));
app.use('/posts', postsRoutes);

app.get('/', (req, res) => res.send('API do Tech Challenge está rodando!'));
module.exports = app;
