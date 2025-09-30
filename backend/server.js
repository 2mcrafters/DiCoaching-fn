import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import db from './services/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes, { authenticateToken } from './routes/auth.js';

// Charger les variables d'environnement du backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité et utilitaires
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration de la base de données depuis les variables d'environnement
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootroot@',
  database: process.env.DB_NAME || 'dict',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Test de connexion à la base de données
async function testDBConnection() {
  try {
    const connection = await db.connect();
    return connection;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    return false;
  }
}

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Dictionnaire Backend', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route de test pour la base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    const terms = await db.query('SELECT COUNT(*) as count FROM termes');
    
    res.json({
      status: 'success',
      database: 'connected',
      stats: {
        users: users[0].count,
        terms: terms[0].count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur de base de données',
      error: error.message
    });
  }
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes API pour les termes depuis la vraie base de données
app.get('/api/terms', async (req, res) => {
  try {
    const { search, category, limit = 20 } = req.query;
    let query = `
      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role
      FROM termes t
      LEFT JOIN categories c ON t.categorie_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filtrage par recherche
    if (search) {
      query += ` AND (t.terme LIKE ? OR t.definition LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Filtrage par catégorie (par ID ou par nom)
    if (category) {
      if (isNaN(category)) {
        // Si c'est un nom de catégorie
        query += ` AND c.libelle = ?`;
        params.push(category);
      } else {
        // Si c'est un ID de catégorie
        query += ` AND t.categorie_id = ?`;
        params.push(parseInt(category));
      }
    }

    query += ` ORDER BY t.terme ASC LIMIT ?`;
    params.push(parseInt(limit));

    const terms = await db.query(query, params);

    res.json({
      status: 'success',
      data: terms,
      total: terms.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des termes',
      error: error.message
    });
  }
});

// Route pour obtenir un terme spécifique
app.get('/api/terms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const terms = await db.query(`
      SELECT t.*, c.libelle as categorie_libelle, u.firstname, u.lastname, u.role
      FROM termes t
      LEFT JOIN categories c ON t.categorie_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `, [id]);

    if (terms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Terme non trouvé'
      });
    }

    res.json({
      status: 'success',
      data: terms[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du terme',
      error: error.message
    });
  }
});

// Route pour les catégories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT c.*, COUNT(t.id) as termes_count
      FROM categories c
      LEFT JOIN termes t ON c.id = t.categorie_id
      GROUP BY c.id, c.libelle, c.description, c.created_at, c.updated_at
      ORDER BY c.libelle ASC
    `);

    res.json({
      status: 'success',
      data: categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
});

// Route pour les statistiques
app.get('/api/stats', async (req, res) => {
  try {
    const [userStats] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [termStats] = await db.query('SELECT COUNT(*) as totalTerms FROM termes');
    const [categoryStats] = await db.query('SELECT COUNT(*) as totalCategories FROM categories');

    const stats = {
      totalUsers: userStats.totalUsers,
      totalTerms: termStats.totalTerms,
      totalCategories: categoryStats.totalCategories
    };

    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

// Route pour créer un nouveau terme (POST)
app.post('/api/terms', async (req, res) => {
  try {
    const { terme, definition, categorie_id, exemple, remarque, source, author_id } = req.body;

    if (!terme || !definition) {
      return res.status(400).json({
        status: 'error',
        message: 'Le terme et la définition sont requis'
      });
    }

    const result = await db.query(`
      INSERT INTO termes (terme, definition, categorie_id, exemple, remarque, source, author_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      terme, 
      definition, 
      categorie_id || 1, // Défaut: Coaching (id=1)
      exemple || null, 
      remarque || null, 
      source || null,
      author_id || 1 // Défaut: admin user (id=1)
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Terme créé avec succès',
      data: {
        id: result.insertId,
        terme,
        definition,
        categorie_id: categorie_id || 1,
        exemple: exemple || null,
        remarque: remarque || null,
        source: source || null,
        author_id: author_id || 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du terme',
      error: error.message
    });
  }
});

// Route pour créer une nouvelle catégorie (POST)
app.post('/api/categories', async (req, res) => {
  try {
    const { libelle, description } = req.body;

    if (!libelle) {
      return res.status(400).json({
        status: 'error',
        message: 'Le libellé de la catégorie est requis'
      });
    }

    const result = await db.query(`
      INSERT INTO categories (libelle, description) 
      VALUES (?, ?)
    `, [libelle, description || null]);

    res.status(201).json({
      status: 'success',
      message: 'Catégorie créée avec succès',
      data: {
        id: result.insertId,
        libelle,
        description: description || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('❌ Erreur lors de l\'exécution de la requête:', error.message);
    if (error.message.includes('Duplicate entry')) {
      res.status(409).json({
        status: 'error',
        message: 'Cette catégorie existe déjà',
        error: 'Duplicate category'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la création de la catégorie',
        error: error.message
      });
    }
  }
});

// Routes API
// TODO: Ajouter les routes pour les différentes fonctionnalités
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrage du serveur
async function startServer() {
  try {
    const connected = await testDBConnection();
    
    if (!connected) {
      console.log('❌ Impossible de se connecter à la base de données');
      console.log('💡 Exécutez "npm run db:setup" pour configurer la base de données');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Test DB: http://localhost:${PORT}/api/test-db`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  console.log('🔄 Arrêt du serveur...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Arrêt du serveur...');
  await db.disconnect();
  process.exit(0);
});

// Export du service de base de données pour l'utiliser dans d'autres modules
export { db };