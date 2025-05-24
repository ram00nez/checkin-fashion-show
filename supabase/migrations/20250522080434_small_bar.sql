/*
  # Create participants table

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `nama_anak` (text, name of the child)
      - `nama_orang_tua` (text, name of the parent)
      - `email` (text)
      - `no_nametag` (text, nametag number)
      - `check_in` (boolean, default false)
      - `check_in_time` (timestamp)
      - `snack_box_received` (boolean, default false)
      - `snack_box_time` (timestamp)
      - `lunch_box_ticket_received` (boolean, default false)
      - `lunch_box_ticket_received_time` (timestamp)
      - `representative_name` (text, nullable)
      - `representative_phone` (text, nullable)
      - `updated_at` (timestamp, default now())
      - `created_at` (timestamp, default now())
  
  2. Security
    - Enable RLS on `participants` table
    - Add policies for authenticated users to manage participant data
*/

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_anak text NOT NULL,
  nama_orang_tua text NOT NULL,
  email text,
  no_nametag text NOT NULL,
  check_in boolean DEFAULT false,
  check_in_time timestamptz,
  snack_box_received boolean DEFAULT false,
  snack_box_time timestamptz,
  lunch_box_ticket_received boolean DEFAULT false,
  lunch_box_ticket_received_time timestamptz,
  representative_name text,
  representative_phone text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster search by child name
CREATE INDEX IF NOT EXISTS participants_nama_anak_idx ON participants (nama_anak);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all participants
CREATE POLICY "Authenticated users can read all participants" 
  ON participants
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create policy for authenticated users to insert participants
CREATE POLICY "Authenticated users can insert participants" 
  ON participants
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create policy for authenticated users to update participants
CREATE POLICY "Authenticated users can update participants" 
  ON participants
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Example data for testing
INSERT INTO participants (nama_anak, nama_orang_tua, email, no_nametag)
VALUES 
  ('Ahmad Fadli', 'Bambang Sutrisno', 'bambang@example.com', 'A001'),
  ('Siti Nurhaliza', 'Dewi Kartika', 'dewi@example.com', 'A002'),
  ('Budi Santoso', 'Agus Hermawan', 'agus@example.com', 'A003'),
  ('Rina Marlina', 'Susi Susanti', 'susi@example.com', 'A004'),
  ('Dimas Permadi', 'Hendra Wijaya', 'hendra@example.com', 'A005');