-- Add lunch_box_ticket_received column
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS lunch_box_ticket_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lunch_box_ticket_received_time TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_lunch_box_ticket_received ON participants(lunch_box_ticket_received);
