-- Run this in your Supabase SQL Editor

-- Rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Rooms: anyone logged in can read and create
CREATE POLICY "Authenticated users can read rooms"
  ON rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Messages: anyone logged in can read and send
CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Seed a default room
INSERT INTO rooms (name, created_by) 
VALUES ('general', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;