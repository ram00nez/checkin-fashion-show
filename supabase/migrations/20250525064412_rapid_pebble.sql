/*
  # Set database timezone to Asia/Jakarta

  1. Changes
    - Set timezone to 'Asia/Jakarta' for the database
    - Ensures all timestamps are stored and displayed in WIB (UTC+7)
*/

-- Set timezone to Asia/Jakarta
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

-- Refresh all connections to use new timezone
SELECT pg_reload_conf();