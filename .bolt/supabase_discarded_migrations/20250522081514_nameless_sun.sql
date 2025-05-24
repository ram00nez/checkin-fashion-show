/*
  # Create participants table

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `nama_anak` (text)
      - `nama_orang_tua` (text)
      - `email` (text)
      - `no_nametag` (text)
      - `check_in` (boolean)
      - `check_in_time` (timestamptz)
      - `snack_box_received` (boolean)
      - `snack_box_time` (timestamptz)
      - `lunch_box_ticket_received` (boolean)
      - `lunch_box_ticket_received_time` (timestamptz)
      - `representative_name` (text)
      - `representative_phone` (text)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `participants` table
    - Add policies for authenticated users to:
      - Read all participants
      - Insert new participants
      - Update existing participants
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

-- Create index for faster name searches
CREATE INDEX IF NOT EXISTS participants_nama_anak_idx ON participants (nama_anak);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies
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