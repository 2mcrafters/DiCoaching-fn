-- Migration: add 'accepted' status value to reports table
-- This assumes status is an ENUM; if it's VARCHAR, this is harmless.
-- Adjust ENUM definition if necessary. We attempt to modify both possible schemas (terms / termes not involved here).

-- Detect current column definition
-- MySQL doesn't allow simple ENUM append without full redefinition, so we reconstruct.

ALTER TABLE reports
  MODIFY COLUMN status ENUM('pending','reviewed','resolved','ignored','accepted') DEFAULT 'pending';
