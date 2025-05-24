/*
  # Setup admin authentication and policies

  1. Changes
    - Add RLS policies for authenticated users
    - Enable RLS on participants table
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Read all participants
      - Insert new participants
      - Update existing participants
*/

-- Enable Row Level Security if not already enabled
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Create policy for reading participants if it doesn't exist
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

  -- Create policy for inserting participants if it doesn't exist
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

  -- Create policy for updating participants if it doesn't exist
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