/*
  # Add new participant fields

  1. New Columns
    - `alamat` (text) - Participant's address
    - `nama_sekolah` (text) - School name
    - `jenis_kelamin` (text) - Child's gender
    - `no_telepon` (text) - Phone/WhatsApp number
    - `email` (text) - Email address

  2. Changes
    - Make existing fields required where appropriate
    - Add default values for boolean fields
*/

-- Add new columns
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS alamat text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS nama_sekolah text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS jenis_kelamin text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS no_telepon text NOT NULL DEFAULT '';

-- Update existing columns
ALTER TABLE participants
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN email SET DEFAULT '';

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS participants_nama_sekolah_idx ON participants (nama_sekolah);
CREATE INDEX IF NOT EXISTS participants_jenis_kelamin_idx ON participants (jenis_kelamin);