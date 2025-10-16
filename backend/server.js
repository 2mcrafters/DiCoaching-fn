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
import rootRoutes from "./routes/root.js";
import diagnosticsRoutes from "./routes/diagnostics.js";
import termsRoutes from "./routes/terms.js";
import categoriesRoutes from "./routes/categories.js";
import statsRoutes from "./routes/stats.js";
import usersRoutes from "./routes/users.js";
import documentsRoutes from "./routes/documents.js";
import reportsRoutes from "./routes/reports.js";
import modificationsRoutes from "./routes/modifications.js";
import commentsRoutes from "./routes/comments.js";
import likesRoutes from "./routes/likes.js";
import decisionsRoutes from "./routes/decisions.js";
import dashboardRoutes from "./routes/dashboard.js";
import ensureResearcherTables from "./database/ensure-researcher-tables.js";

// Charger les variables d'environnement du backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;
const normalizeOrigin = (value, fallback) => {
  const base = value || fallback;
  return base ? base.replace(/\/+$/, "") : undefined;
};
const FRONTEND_URL = normalizeOrigin(
  process.env.FRONTEND_URL,
  "http://localhost:3000"
);
// Support both localhost and 127.0.0.1 to avoid CORS/CSP mismatches
const FRONTEND_ALIAS = FRONTEND_URL?.includes("localhost")
  ? FRONTEND_URL.replace("localhost", "127.0.0.1")
  : FRONTEND_URL?.includes("127.0.0.1")
  ? FRONTEND_URL.replace("127.0.0.1", "localhost")
  : null;
const allowedOrigins = [FRONTEND_URL, FRONTEND_ALIAS].filter(Boolean);
const BACKEND_PUBLIC_URL = normalizeOrigin(
  process.env.BACKEND_PUBLIC_URL,
  `http://localhost:${PORT}`
);

// Middleware de sécurité et utilitaires
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          ...allowedOrigins,
          BACKEND_PUBLIC_URL,
        ].filter(Boolean),
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", ...allowedOrigins, BACKEND_PUBLIC_URL].filter(Boolean),
        formAction: ["'self'", ...allowedOrigins, BACKEND_PUBLIC_URL].filter(Boolean),
        frameAncestors: ["'self'"],
      },
    },
  })
);
app.use(compression());
app.use(morgan("combined"));

// Configuration CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin or tools without an Origin (like curl/postman)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Middleware pour parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les fichiers statiques (uploads)
app.use(
  "/uploads",
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
  express.static(path.join(__dirname, "uploads"))
);

// Configuration de la base de données depuis les variables d'environnement
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dictionnaire_ch",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Test de connexion à la base de données
async function testDBConnection() {
  try {
    const connection = await db.connect();
    return connection;
  } catch (error) {
    console.error(
      "❌ Erreur de connexion à la base de données:",
      error.message
    );
    return false;
  }
}

// Routes de base et santé
app.use("/", rootRoutes);
// Route de test DB et diagnostics
app.use("/api", diagnosticsRoutes);

// Routes d'authentification
app.use("/api/auth", authRoutes);

// Routes API
app.use("/api/terms", termsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/modifications", modificationsRoutes);
app.use("/api", commentsRoutes);
app.use("/api", likesRoutes);
app.use("/api", decisionsRoutes);
app.use("/api", dashboardRoutes);

// Route pour créer une nouvelle catégorie (POST)
app.post("/api/categories", async (req, res) => {
  try {
    const { libelle, description } = req.body;

    if (!libelle) {
      return res.status(400).json({
        status: "error",
        message: "Le libellé de la catégorie est requis",
      });
    }

    const result = await db.query(
      `
      INSERT INTO categories (libelle, description) 
      VALUES (?, ?)
    `,
      [libelle, description || null]
    );

    res.status(201).json({
      status: "success",
      message: "Catégorie créée avec succès",
      data: {
        id: result.insertId,
        libelle,
        description: description || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    if (error.message.includes("Duplicate entry")) {
      res.status(409).json({
        status: "error",
        message: "Cette catégorie existe déjà",
        error: "Duplicate category",
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Erreur lors de la création de la catégorie",
        error: error.message,
      });
    }
  }
});

// Enhanced global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Handle large payloads or multer limits
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      status: "error",
      message: "Fichier ou requête trop volumineux (max 10MB)",
      error: process.env.NODE_ENV === "production" ? {} : err.message,
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Handle not found errors
  if (err.status === 404) {
    return res.status(404).json({
      status: 'error',
      message: 'Resource not found'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Démarrage du serveur
async function startServer() {
  try {
    const connected = await testDBConnection();

    if (!connected) {
      console.warn(
        "\u26A0\uFE0F Impossible de se connecter \u00e0 la base de donn\u00e9es au démarrage. Le serveur démarrera quand même."
      );
      console.warn(
        '\ud83d\udca1 Ex\u00e9cutez "npm run db:init" ou assurez-vous que MySQL est en cours d\'exécution et configuré correctement'
      );

      app.listen(PORT, () => {
        console.log(
          `\ud83d\ude80 Serveur backend démarré sur le port ${PORT} (DB non connectée)`
        );
        console.log(`\ud83d\udccd URL: http://localhost:${PORT}`);
        console.log(
          `\ud83c\udf0d Environnement: ${process.env.NODE_ENV || "development"}`
        );
        console.log(
          `\ud83d\udd17 Test DB: http://localhost:${PORT}/api/test-db`
        );
      });

      // Background reconnect attempts
      let attempts = 0;
      const maxAttempts = 12; // try for about 1 minute
      const reconnect = async () => {
        attempts += 1;
        console.log(
          `\u23F3 Tentative de reconnexion à la base (essai ${attempts}/${maxAttempts})...`
        );
        const ok = await db.connect();
        if (ok) {
          console.log("\u2705 Reconnexion à la base de données réussie");
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(reconnect, 5000);
        } else {
          console.error(
            "\u274C Échec de la reconnexion après plusieurs tentatives. Vérifiez que MySQL fonctionne et que les variables d'environnement sont correctes."
          );
        }
      };
      reconnect();

      return;
    }

    // Ensure researcher tables exist after successful connection
    try {
      await ensureResearcherTables();
      console.log("✅ Researcher tables initialized successfully");
    } catch (tableError) {
      console.warn(
        "⚠️ Warning: Could not initialize researcher tables:",
        tableError.message
      );
    }

    app.listen(PORT, () => {
      console.log(`\ud83d\ude80 Serveur backend démarré sur le port ${PORT}`);
      console.log(`\ud83d\udccd URL: http://localhost:${PORT}`);
      console.log(
        `\ud83c\udf0d Environnement: ${process.env.NODE_ENV || "development"}`
      );
      console.log(`\ud83d\udd17 Test DB: http://localhost:${PORT}/api/test-db`);
    });
  } catch (error) {
    console.error("\u274c Erreur lors du démarrage du serveur:", error);
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
