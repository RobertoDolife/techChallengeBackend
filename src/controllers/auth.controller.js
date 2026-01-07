const db = require('../models');
const Usuario = db.Usuario;
const jwt = require("jsonwebtoken");
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middlewares/error.middleware');

// POST /login
exports.login = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  // 1. Validar campos obrigatórios
  console.log('📧 Email recebido:', email);
  console.log('🔑 Senha recebida:', senha);

  if (!email || !senha) {
    throw ApiError.badRequest("Email e senha são obrigatórios");
  }

  // 2. Buscar usuário pelo email
  const usuario = await Usuario.findOne({ where: { email } });
  console.log('👤 Usuário encontrado?', !!usuario, usuario);

  if (!usuario) {
    console.log('❌ Usuário não encontrado no banco');
    throw ApiError.unauthorized("Usuário ou senha inválidos");
  }

  console.log('🔐 Hash da senha no banco:', usuario.senha);

  // 3. Validar senha usando bcrypt
  console.log('🔍 Validando senha...');
  const senhaValida = await usuario.validarSenha(senha);
  console.log('✅ Senha válida?', senhaValida);

  if (!senhaValida) {
    console.log('❌ Senha inválida');
    throw ApiError.unauthorized("Usuário ou senha inválidos");
  }

  // 4. Gerar token
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, admin: usuario.admin },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 5. Retornar resposta (SEM a senha)
  return res.json({
    success: true,
    data: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      admin: usuario.admin,
      token
    }
  });
});

// POST /logout
exports.logout = asyncHandler(async (req, res) => {
  // Com JWT stateless, o logout é feito no cliente removendo o token
  // Aqui podemos registrar o logout ou adicionar o token a uma blacklist se necessário

  console.log('🚪 Logout realizado para usuário:', req.usuario?.email);

  return res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

//GET /userInfo
exports.getUserInfo = asyncHandler(async (req, res) => {
  const userId = req.usuario.id;
  const usuario = await Usuario.findOne({ where: { id: userId } });
  return res.json({
    success: true,
    data: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      admin: usuario.admin,
    }
  });

})