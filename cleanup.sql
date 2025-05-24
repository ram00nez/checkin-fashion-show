-- Delete existing admin users
DELETE FROM auth.users
WHERE email IN ('admin1@example.com', 'admin2@example.com');
