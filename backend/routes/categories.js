import express from 'express';
import db from '../services/database.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des catégories',
      error: error.message,
    });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { libelle, description } = req.body;

    if (!libelle) {
      return res.status(400).json({
        status: 'error',
        message: 'Le libellé de la catégorie est requis',
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
      status: 'success',
      message: 'Catégorie créée avec succès',
      data: {
        id: result.insertId,
        libelle,
        description: description || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    if (error.message.includes('Duplicate entry')) {
      res.status(409).json({
        status: 'error',
        message: 'Cette catégorie existe déjà',
        error: 'Duplicate category',
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la création de la catégorie',
        error: error.message,
      });
    }
  }
});

export default router;

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { libelle, description } = req.body;

    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Catégorie non trouvée' });
    }

    // Check duplicate libelle if changed
    if (libelle) {
      const dup = await db.query('SELECT id FROM categories WHERE libelle = ? AND id <> ?', [libelle, id]);
      if (Array.isArray(dup) && dup.length > 0) {
        return res.status(409).json({ status: 'error', message: 'Cette catégorie existe déjà' });
      }
    }

    await db.query(
      `UPDATE categories SET libelle = COALESCE(?, libelle), description = COALESCE(?, description), updated_at = NOW() WHERE id = ?`,
      [libelle, description ?? null, id]
    );

    const [updated] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Catégorie mise à jour', data: updated });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la mise à jour de la catégorie', error: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Optionally block delete if linked terms exist
    const [{ count }] = await db.query('SELECT COUNT(*) as count FROM termes WHERE categorie_id = ?', [id]);
    if (count > 0) {
      return res.status(400).json({ status: 'error', message: 'Impossible de supprimer une catégorie utilisée par des termes.' });
    }

    const result = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ status: 'success', message: 'Catégorie supprimée', affected: result.affectedRows });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression de la catégorie', error: error.message });
  }
});
