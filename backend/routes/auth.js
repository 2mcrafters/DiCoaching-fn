import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../services/database.js';

const router = express.Router();

// Middleware pour vérifier le token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token d\'accès requis'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        message: 'Token invalide'
      });
    }
    req.user = user;
    next();
  });
};

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email et mot de passe requis'
      });
    }

    // Chercher l'utilisateur dans la base de données
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Retourner les données de l'utilisateur (sans le mot de passe) et le token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        user: userWithoutPassword,
        token
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstname, lastname, role = 'user' } = req.body;

    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({
        status: 'error',
        message: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUsers = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur
    const result = await db.query(`
      INSERT INTO users (email, password, firstname, lastname, role, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [email, hashedPassword, firstname, lastname, role]);

    // Créer le token JWT pour l'utilisateur nouvellement créé
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        role,
        firstname,
        lastname
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: result.insertId,
          email,
          firstname,
          lastname,
          role
        },
        token
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour vérifier le token et obtenir les infos de l'utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, firstname, lastname, role, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: users[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route de déconnexion (côté client, on supprime juste le token)
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Déconnexion réussie',
    timestamp: new Date().toISOString()
  });
});

export default router;