-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('admin'), ('user');

-- Create users table with role reference
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, role_id)
);

-- Create participants table
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

-- Create policies for participants table
-- Only admins can modify check-in status
CREATE POLICY "Admins can update check-in status" ON participants
    FOR UPDATE USING (
        auth.role() = 'admin'
    )
    WITH CHECK (
        auth.role() = 'admin'
    );

-- Everyone can read participants
CREATE POLICY "Anyone can view participants" ON participants
    FOR SELECT USING (
        true
    );

-- Create a function to update timestamps
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
