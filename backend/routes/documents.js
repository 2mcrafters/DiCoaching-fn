import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../services/database.js';
import { documentUpload, getFileUrl } from "../services/uploadService.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/documents/user/:userId - Récupérer les documents d'un utilisateur
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await db.query(
      `
      SELECT id, filename, original_filename, file_size, mime_type, purpose, 
             status, uploaded_at, reviewed_at, review_comment
      FROM user_documents 
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `,
      [userId]
    );

    // Attach accessible URL and download URL for each document
    const docsWithUrls = (documents || []).map((d) => {
      const filename = d.filename || d.original_filename || null;
      return {
        ...d,
        url: filename ? getFileUrl(filename, "documents") : null,
        downloadUrl: d.id ? `/api/documents/download/${d.id}` : null,
      };
    });

    res.json({
      status: "success",
      data: docsWithUrls,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de l'exécution de la requête:", error.message);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des documents",
      error: error.message,
    });
  }
});

// POST /api/documents/upload/:userId - Upload de documents pour un utilisateur
router.post(
  "/upload/:userId",
  documentUpload.array("documents", 10),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { purpose = "other" } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Aucun fichier uploadé",
        });
      }

      const uploadedDocuments = [];

      for (const file of req.files) {
        const result = await db.query(
          `
        INSERT INTO user_documents (
          user_id, filename, original_filename, file_path, 
          file_size, mime_type, purpose, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
          [
            userId,
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            purpose,
          ]
        );

        uploadedDocuments.push({
          id: result.insertId,
          filename: file.filename,
          original_filename: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          purpose,
          status: "pending",
          url: getFileUrl(file.filename, "documents"),
          downloadUrl: `/api/documents/download/${result.insertId}`,
        });
      }

      res.json({
        status: "success",
        message: `${uploadedDocuments.length} document(s) uploadé(s) avec succès`,
        data: uploadedDocuments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log("❌ Erreur lors de l'upload:", error.message);
      res.status(500).json({
        status: "error",
        message: "Erreur lors de l'upload des documents",
        error: error.message,
      });
    }
  }
);

// PUT /api/documents/:id/review - Approuver/rejeter un document (admin seulement)
router.put('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_comment, reviewer_id } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Statut invalide. Utilisez "approved" ou "rejected"',
      });
    }

    await db.query(`
      UPDATE user_documents 
      SET status = ?, review_comment = ?, reviewer_id = ?, reviewed_at = NOW()
      WHERE id = ?
    `, [status, review_comment, reviewer_id, id]);

    const updatedDocument = await db.query(`
      SELECT id, filename, original_filename, purpose, status, 
             reviewed_at, review_comment
      FROM user_documents 
      WHERE id = ?
    `, [id]);

    res.json({
      status: 'success',
      message: `Document ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`,
      data: updatedDocument[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de la révision:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la révision du document',
      error: error.message,
    });
  }
});

// DELETE /api/documents/:id - Supprimer un document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les infos du document pour supprimer le fichier
    const documents = await db.query(`
      SELECT file_path, filename 
      FROM user_documents 
      WHERE id = ?
    `, [id]);

    if (documents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Document non trouvé',
      });
    }

    const document = documents[0];

    // Supprimer le fichier physique
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Supprimer l'entrée de la base de données
    await db.query('DELETE FROM user_documents WHERE id = ?', [id]);

    res.json({
      status: 'success',
      message: 'Document supprimé avec succès',
      data: { id, filename: document.filename },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("❌ Erreur lors de la suppression:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression du document',
      error: error.message,
    });
  }
});

// GET /api/documents/download/:id - Télécharger un document
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const documents = await db.query(`
      SELECT file_path, original_filename, mime_type
      FROM user_documents 
      WHERE id = ?
    `, [id]);

    if (documents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Document non trouvé',
      });
    }

    const document = documents[0];

    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        status: 'error',
        message: 'Fichier non trouvé sur le serveur',
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
    res.setHeader('Content-Type', document.mime_type);
    res.sendFile(path.resolve(document.file_path));

  } catch (error) {
    console.log("❌ Erreur lors du téléchargement:", error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du téléchargement du document',
      error: error.message,
    });
  }
});

export default router;
