-- Rename table Daftar_Peserta back to participants
ALTER TABLE Daftar_Peserta RENAME TO participants;

-- Update all policies to use original table name
DROP POLICY IF EXISTS "Authenticated users can read all Daftar_Peserta" ON participants;
DROP POLICY IF EXISTS "Authenticated users can insert Daftar_Peserta" ON participants;
DROP POLICY IF EXISTS "Authenticated users can update Daftar_Peserta" ON participants;

-- Create policies with original table name
CREATE POLICY "Authenticated users can read all participants" 
  ON participants
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert participants" 
  ON participants
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants" 
  ON participants
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Rename index
DROP INDEX IF EXISTS Daftar_Peserta_nama_anak_idx;
CREATE INDEX IF NOT EXISTS participants_nama_anak_idx ON participants (nama_anak);
