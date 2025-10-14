import db from "./database.js";

// Simple helper to ensure notifications table exists before use
async function ensureTable() {
  try {
    await db.query(
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        link VARCHAR(1024) NULL,
        meta JSON NULL,
        term_id INT NULL,
        comment_id INT NULL,
        report_id INT NULL,
        modification_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME NULL,
        INDEX idx_user_created (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
  } catch (e) {
    // If DB not connected or permission issues, just log and continue.
    console.warn("[notifications] ensureTable warning:", e?.message);
  }
}

export async function createNotification(payload) {
  await ensureTable();
  const {
    userId,
    type,
    title,
    message = null,
    link = null,
    meta = null,
    refs = {},
  } = payload || {};

  if (!userId || !type || !title) return null;
  const metaStr = meta ? JSON.stringify(meta) : null;
  const termId = refs.termId || null;
  const commentId = refs.commentId || null;
  const reportId = refs.reportId || null;
  const modificationId = refs.modificationId || null;

  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, link, meta, term_id, comment_id, report_id, modification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      type,
      title,
      message,
      link,
      metaStr,
      termId,
      commentId,
      reportId,
      modificationId,
    ]
  );
  return { id: result.insertId };
}

export async function createNotificationsBulk(notifs = []) {
  const out = [];
  for (const n of notifs) {
    try {
      const r = await createNotification(n);
      if (r) out.push(r);
    } catch (e) {
      console.warn("[notifications] failed to create notif:", e?.message);
    }
  }
  return out;
}

export async function listNotifications(userId, limit = 20) {
  await ensureTable();
  const rows = await db.query(
    `SELECT id, user_id as userId, type, title, message, link,
            meta, term_id as termId, comment_id as commentId,
            report_id as reportId, modification_id as modificationId,
            created_at as createdAt, read_at as readAt
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, Number(limit) || 20]
  );
  return rows.map((r) => ({
    ...r,
    meta: r.meta ? safeParseJSON(r.meta) : null,
  }));
}

export async function getUnreadCount(userId) {
  await ensureTable();
  const [row] = await db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL`,
    [userId]
  );
  return Number(row?.count || 0);
}

export async function markRead(userId, id) {
  await ensureTable();
  await db.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
}

export async function markAllRead(userId) {
  await ensureTable();
  await db.query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
    [userId]
  );
}

function safeParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export default {
  createNotification,
  createNotificationsBulk,
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
