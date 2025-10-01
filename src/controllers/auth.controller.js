const db = require('../models');
const Usuario = db.Usuario;
const jwt = require("jsonwebtoken");

// const bcrypt = require("bcrypt"); // pra quando estivermos usando senha com hash no banco
// const jwt = require("jsonwebtoken");
// const { Usuario } = require("../models/usuario.model");

// POST /login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Buscar usuário pelo email
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // 2. Validar senha
    // pra quando estivermos usando senha com hash no banco
    // const senhaValida = await bcrypt.compare(senha, usuario.senha);
    // if (!senhaValida) {
    //   return res.status(401).json({ error: "Usuário ou senha inválidos" });
    // }
    if (senha !== usuario.senha) {
        return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // 3. Gerar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, admin: usuario.admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Retornar resposta
    return res.json({
      id: usuario.id,
      email: usuario.email,
      admin: usuario.admin,
      token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};
