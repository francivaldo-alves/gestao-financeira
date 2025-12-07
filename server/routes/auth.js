const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { User } = require("../models");
const sendEmail = require('../utils/sendEmail');
const { validate, registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require("../middleware/validation");

const router = express.Router();
const auth = require("../middleware/auth");

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email'] // Exclude password
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

router.post("/register", registerValidation, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "E-mail já está em uso." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Usuário criado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    // Generate access token (15 minutes)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Generate refresh token (7 days)
    const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Save refresh token to database
    const { RefreshToken } = require("../models");
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Esqueci minha senha
router.post('/forgot-password', forgotPasswordValidation, validate, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Gerar token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash do token e expiração (1 hora)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora

    await user.save();

    // URL de reset
    // Em produção, usar variável de ambiente para o frontend URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `
      <h1>Você solicitou a redefinição de senha</h1>
      <p>Por favor, clique no link abaixo para redefinir sua senha:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Redefinição de Senha - Financ App',
        message: `Você solicitou a redefinição de senha. Acesse: ${resetUrl}`,
        html: message
      });

      res.status(200).json({ success: true, data: 'E-mail enviado' });
    } catch (err) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(500).json({ error: 'Email não pôde ser enviado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Resetar senha
router.put('/reset-password/:token', resetPasswordValidation, validate, async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Setar nova senha
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ success: true, data: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.post("/google", async (req, res) => {
  const { token } = req.body;
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, sub } = ticket.getPayload();

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user
      // Generate a random password since they are logging in with Google
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: email.split('@')[0], // Use part of email as name
        email,
        password: hashedPassword,
      });
    }

    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ error: "Falha na autenticação com Google" });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Check if token exists and is not revoked
    const { RefreshToken } = require("../models");
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        userId: decoded.id,
        isRevoked: false,
      }
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token inválido ou revogado' });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      return res.status(401).json({ error: 'Refresh token expirado' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.json({
      token: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// Logout route (revoke refresh token)
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const { RefreshToken } = require("../models");
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token: refreshToken, userId: req.user.id } }
      );
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

module.exports = router;

