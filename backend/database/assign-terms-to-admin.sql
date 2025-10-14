-- Update all existing terms to be owned by admin user
-- This ensures Mohamed Rachid Belhadj (admin@dictionnaire.fr) is the author of all terms

USE dicoaching;

-- Step 1: Get the admin user ID
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@dictionnaire.fr' LIMIT 1);

-- Display the admin ID for verification
SELECT @admin_id AS admin_user_id;

-- Step 2: Check current term ownership
SELECT 
    COUNT(*) AS total_terms,
    COUNT(CASE WHEN author_id = @admin_id THEN 1 END) AS admin_owned_terms,
    COUNT(CASE WHEN author_id != @admin_id THEN 1 END) AS other_owned_terms,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) AS unowned_terms
FROM terms;

-- Step 3: Update all terms to be owned by admin
UPDATE terms 
SET author_id = @admin_id 
WHERE author_id != @admin_id OR author_id IS NULL;

-- Step 4: Verify the update
SELECT 
    COUNT(*) AS total_terms,
    COUNT(CASE WHEN author_id = @admin_id THEN 1 END) AS admin_owned_terms
FROM terms;

-- Step 5: Show sample of updated terms
SELECT 
    id,
    term,
    status,
    author_id,
    created_at
FROM terms 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Update user profile if needed
UPDATE users 
SET 
    firstname = 'Mohamed Rachid',
    lastname = 'Belhadj',
    role = 'admin',
    status = 'active',
    email_verified = TRUE
WHERE email = 'admin@dictionnaire.fr';

-- Step 7: Verify admin user details
SELECT 
    id,
    email,
    firstname,
    lastname,
    role,
    status,
    email_verified,
    created_at
FROM users 
WHERE email = 'admin@dictionnaire.fr';

COMMIT;

-- Summary
SELECT 
    CONCAT('✅ All ', COUNT(*), ' terms are now owned by ', 
           u.firstname, ' ', u.lastname, ' (', u.email, ')') AS summary
FROM terms t
CROSS JOIN users u 
WHERE u.email = 'admin@dictionnaire.fr' AND t.author_id = u.id;
