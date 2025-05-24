/*
  # Create participants table with policies

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `nama_anak` (text, not null)
      - `nama_orang_tua` (text, not null)
      - `email` (text)
      - `no_nametag` (text, not null)
      - `check_in` (boolean, default false)
      - `check_in_time` (timestamptz)
      - `snack_box_received` (boolean, default false)
      - `snack_box_time` (timestamptz)
      - `lunch_box_ticket_received` (boolean, default false)
      - `lunch_box_ticket_received_time` (timestamptz)
      - `representative_name` (text)
      - `representative_phone` (text)
      - `updated_at` (timestamptz, default now())
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `participants` table
    - Add policies for authenticated users to read, insert, and update participants
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

-- Create policies with IF NOT EXISTS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' 
    AND policyname = 'Authenticated users can read all participants'
  ) THEN
    CREATE POLICY "Authenticated users can read all participants"
      ON participants
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' 
    AND policyname = 'Authenticated users can insert participants'
  ) THEN
    CREATE POLICY "Authenticated users can insert participants"
      ON participants
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'participants' 
    AND policyname = 'Authenticated users can update participants'
  ) THEN
    CREATE POLICY "Authenticated users can update participants"
      ON participants
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
END $$;