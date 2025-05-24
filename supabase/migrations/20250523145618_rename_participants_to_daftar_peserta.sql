-- Rename table participants to Daftar_Peserta
ALTER TABLE participants RENAME TO Daftar_Peserta;

-- Update all policies to use new table name
DROP POLICY IF EXISTS "Authenticated users can read all participants" ON Daftar_Peserta;
DROP POLICY IF EXISTS "Authenticated users can insert participants" ON Daftar_Peserta;
DROP POLICY IF EXISTS "Authenticated users can update participants" ON Daftar_Peserta;

-- Create new policies with updated table name
CREATE POLICY "Authenticated users can read all Daftar_Peserta" 
  ON Daftar_Peserta
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert Daftar_Peserta" 
  ON Daftar_Peserta
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update Daftar_Peserta" 
  ON Daftar_Peserta
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Rename index
DROP INDEX IF EXISTS participants_nama_anak_idx;
CREATE INDEX IF NOT EXISTS Daftar_Peserta_nama_anak_idx ON Daftar_Peserta (nama_anak);
