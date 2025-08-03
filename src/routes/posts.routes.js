const express = require('express');
const router = express.Router();
const PostsController = require('../controllers/posts.controller');
const upload = require('../config/multer.config');

router.get('/', PostsController.getAll);
router.get('/search', PostsController.search);
router.get('/:id', PostsController.getById);
router.post('/', upload.single('image'), PostsController.create);
router.put('/:id',upload.single('image'), PostsController.update);
router.delete('/:id', PostsController.remove);

module.exports = router;
