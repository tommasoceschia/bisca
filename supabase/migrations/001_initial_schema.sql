-- Schema iniziale per Bisca
-- Esegui con: supabase db push

-- Tabella stanze
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id VARCHAR(255) NOT NULL,
    max_players INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella giocatori in stanza
CREATE TABLE room_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    seat_index INTEGER NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    connected BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, player_id),
    UNIQUE(room_id, seat_index)
);

-- Tabella stato partita (JSON blob per semplicità)
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_game_states_room ON game_states(room_id);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_states_updated_at
    BEFORE UPDATE ON game_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime per le tabelle necessarie
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;

-- Row Level Security (opzionale, abilitare se necessario)
-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
