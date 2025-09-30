import mysql from 'mysql2/promise';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dict',
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+00:00'
      };

      this.pool = mysql.createPool(dbConfig);
      
      // Test de connexion
      const connection = await this.pool.getConnection();
      console.log('✅ Connexion à la base de données MySQL réussie');
      connection.release();
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
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
    if (!this.isConnected) {
      throw new Error('Base de données non connectée');
    }

    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution de la requête:', error.message);
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
    const sql = `
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

// Instance singleton
const db = new DatabaseService();

export default db;