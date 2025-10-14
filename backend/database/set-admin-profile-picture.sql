-- Set profile picture for admin user Mohamed Rachid Belhadj
-- This script sets a gender-based avatar URL for the admin user

USE dicoaching;

-- Step 1: Check current admin profile
SELECT 
  id,
  email,
  firstname,
  lastname,
  sex,
  profile_picture,
  profile_picture_url
FROM users 
WHERE email = 'admin@dictionnaire.fr';

-- Step 2: Update admin profile with gender and avatar URL
-- Note: Replace the URL with the admin's actual user ID after checking above
UPDATE users 
SET 
  sex = 'homme',
  profile_picture_url = CONCAT('https://avatar.iran.liara.run/public/boy?username=user', id)
WHERE email = 'admin@dictionnaire.fr';

-- Step 3: Verify the update
SELECT 
  id,
  email,
  firstname,
  lastname,
  sex,
  profile_picture_url,
  'Avatar will display on Dashboard, Navbar, Author Cards, Comments' as status
FROM users 
WHERE email = 'admin@dictionnaire.fr';

-- Optional: If you want to set a custom uploaded photo instead
-- UPDATE users 
-- SET 
--   profile_picture = 'admin-photo.jpg',
--   profile_picture_url = NULL
-- WHERE email = 'admin@dictionnaire.fr';

COMMIT;
