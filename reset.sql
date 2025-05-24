-- Delete all users
DELETE FROM auth.users;

-- Reset sequence if needed
SELECT pg_catalog.setval(pg_get_serial_sequence('auth.users', 'id'), 1, false);
