const db = require('../models');
const Usuario = db.Usuario;

exports.getUserStats = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.count();
    const totalAlunos = await Usuario.count({ where: { admin: false } });
    const totalAdmins = await Usuario.count({ where: { admin: true } });

    return res.json({
      totalUsuarios,
      totalAlunos,
      totalAdmins
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar estatísticas de usuários" });
  }
};
