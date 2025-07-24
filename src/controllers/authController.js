// src/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const authController = {
  mostrarLogin: (req, res) => {
    res.render('login', { error: null });
  },

  processarLogin: async (req, res) => {
    const { email, senha } = req.body;

    // Verifica se o usuário existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render('login', { error: 'Usuário ou senha inválidos.' });
    }

    // Verifica se a senha está correta
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.render('login', { error: 'Usuário ou senha inválidos.' });
    }

    // Salva o usuário na sessão
    req.session.user = user;
    return res.redirect('/dashboard');
  },

  logout: (req, res) => {
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  }
};

module.exports = authController;
