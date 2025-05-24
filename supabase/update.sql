-- Create roles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'roles'
    ) THEN
        CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(20) NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        INSERT INTO roles (name) VALUES ('admin'), ('user');
    END IF;
END $$;

-- Create users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role_id INTEGER REFERENCES roles(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, role_id)
        );
    END IF;
END $$;

-- Create participants table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'participants'
    ) THEN
        CREATE TABLE participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nama_anak VARCHAR(255) NOT NULL,
            nama_orang_tua VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            jenis_kelamin VARCHAR(10) NOT NULL,
            nama_sekolah VARCHAR(255) NOT NULL,
            alamat TEXT NOT NULL,
            check_in BOOLEAN DEFAULT FALSE,
            check_in_time TIMESTAMP WITH TIME ZONE,
            snack_box_received BOOLEAN DEFAULT FALSE,
            snack_box_time TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT valid_gender CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
            CONSTRAINT valid_status CHECK (status IN ('pending', 'checked_in', 'checked_out'))
        );
    END IF;
END $$;

-- Create policies for participants table
DO $$
BEGIN
    -- Drop existing policies first
    DROP POLICY IF EXISTS "Admins can update check-in status" ON participants;
    DROP POLICY IF EXISTS "Anyone can view participants" ON participants;
    
    -- Create new policies
    CREATE POLICY "Admins can update check-in status" ON participants
        FOR UPDATE USING (
            auth.role() = 'admin'
        )
        WITH CHECK (
            auth.role() = 'admin'
        );
    
    CREATE POLICY "Anyone can view participants" ON participants
        FOR SELECT USING (
            true
        );
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
