import mysql from 'mysql2/promise';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const host = process.env.DB_HOST || 'localhost';
      const user = process.env.DB_USER || 'root';
      const password = process.env.DB_PASSWORD || '';
      const database = process.env.DB_NAME || 'dict';

      // Try the configured port first, then common defaults 3306 and 3307
      const configuredPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : null;
      const portsToTry = [];
      if (configuredPort) portsToTry.push(configuredPort);
      [3306, 3307].forEach(p => { if (!portsToTry.includes(p)) portsToTry.push(p); });

      let lastError = null;
      for (const port of portsToTry) {
        try {
          const dbConfig = {
            host,
            user,
            password,
            database,
            port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: "utf8mb4",
            timezone: "+00:00",
          };

          this.pool = mysql.createPool(dbConfig);
          // Test de connexion
          const connection = await this.pool.getConnection();
          console.log(
            `✅ Connexion à la base de données MySQL réussie (port ${port})`
          );
          connection.release();
          this.isConnected = true;
          // Update env so other modules/logs reflect successful port
          process.env.DB_PORT = String(port);
          return true;
        } catch (err) {
          lastError = err;
          console.error(
            `⚠️ Tentative de connexion sur le port ${port} a échoué:`,
            err.message
          );
          try {
            if (this.pool) await this.pool.end();
          } catch (e) {}
          this.pool = null;
        }
      }

      console.error(
        "❌ Erreur de connexion à la base de données après avoir essayé plusieurs ports:",
        lastError && lastError.message
      );
      this.isConnected = false;
      return false;
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la tentative de connexion à la base de données:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Connexion à la base de données fermée');
    }
  }

  async query(sql, params = []) {
    // Auto-connect if needed (helps when server starts before DB or port was corrected at runtime)
    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) {
        throw new Error('Base de données non connectée');
      }
    }

    try {
      // Ensure params is always an array
      const queryParams = Array.isArray(params) ? params : [];
      // Use query instead of execute for compatibility
      const [results] = await this.pool.query(sql, queryParams);
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de la requête:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async getConnection() {
    if (!this.isConnected) {
      throw new Error('Base de données non connectée');
    }
    return await this.pool.getConnection();
  }

  // Méthodes utilitaires pour les opérations courantes
  async findById(table, id) {
    const sql = `SELECT * FROM ${table} WHERE id = ? LIMIT 1`;
    const results = await this.query(sql, [id]);
    return results[0] || null;
  }

  async findAll(table, conditions = {}, limit = null) {
    let sql = `SELECT * FROM ${table}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    return await this.query(sql, params);
  }

  async create(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      id: result.insertId,
      affectedRows: result.affectedRows
    };
  }

  async update(table, id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);
    
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  }

  async delete(table, id) {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.query(sql, [id]);
    
    return {
      affectedRows: result.affectedRows
    };
  }

  // Méthodes spécifiques au dictionnaire
  async searchTerms(searchTerm, limit = 20) {
    const sql = `
      SELECT t.*, u.firstname, u.lastname, u.role
      FROM terms t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.status = 'approved' 
        AND (t.term LIKE ? OR t.definition LIKE ? OR t.examples LIKE ?)
      ORDER BY t.term ASC
      LIMIT ?
    `;
    const searchPattern = `%${searchTerm}%`;
    return await this.query(sql, [searchPattern, searchPattern, searchPattern, limit]);
  }

  async getTermsByCategory(category, limit = 20) {
    const sql = `
      SELECT t.*, u.firstname, u.lastname, u.role
      FROM terms t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.status = 'approved' AND t.category = ?
      ORDER BY t.term ASC
      LIMIT ?
    `;
    return await this.query(sql, [category, limit]);
  }

  async getUserStats(userId) {
    let sql = `
      SELECT 
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_terms,
        COUNT(CASE WHEN status = 'review' THEN 1 END) as review_terms,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_terms,
        COUNT(*) as total_terms
      FROM termes 
      WHERE author_id = ?
    `;

    try {
      const results = await this.query(sql, [userId]);
      return results[0] || {};
    } catch (error) {
      // Fallback to English schema
      sql = `
        SELECT 
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_terms,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_terms,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_terms,
          COUNT(*) as total_terms
        FROM terms 
        WHERE author_id = ?
      `;
      const results = await this.query(sql, [userId]);
      return results[0] || {};
    }
  }
}

// Instance singleton
const db = new DatabaseService();

export default db;