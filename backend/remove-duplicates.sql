-- SQL Script to Remove Duplicate Terms
-- This keeps the OLDEST entry (lowest ID) for each duplicate term

-- STEP 1: First, let's see what will be deleted (PREVIEW ONLY)
-- Run this first to verify before deleting
SELECT 
    t1.id as keep_id,
    t2.id as delete_id,
    t1.terme,
    t1.createdAt as keep_date,
    t2.createdAt as delete_date
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme 
    AND t1.id < t2.id
ORDER BY t1.terme;

-- STEP 2: Delete duplicates, keeping the one with the lowest ID (oldest)
-- IMPORTANT: Make a backup before running this!

DELETE t2 
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme 
    AND t1.id < t2.id;

-- STEP 3: Verify the duplicates are gone
SELECT terme, COUNT(*) as count 
FROM termes 
GROUP BY terme 
HAVING count > 1;

-- STEP 4: Add a UNIQUE constraint to prevent future duplicates (OPTIONAL)
-- ALTER TABLE termes ADD UNIQUE KEY unique_terme (terme);
