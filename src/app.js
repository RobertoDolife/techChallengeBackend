const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const postsRoutes = require('./routes/posts.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));
app.use('/posts', postsRoutes);

module.exports = app;
