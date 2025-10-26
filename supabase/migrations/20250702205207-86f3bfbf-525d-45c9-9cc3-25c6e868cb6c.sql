
-- Create storage bucket for tournament banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('tournament-banners', 'tournament-banners', true);

-- Create storage bucket for player avatars  
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-avatars', 'player-avatars', true);

-- Create storage bucket for match thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-thumbnails', 'match-thumbnails', true);

-- Create policies for tournament banners bucket
CREATE POLICY "Public Access for tournament banners" ON storage.objects
FOR SELECT USING (bucket_id = 'tournament-banners');

CREATE POLICY "Authenticated users can upload tournament banners" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'tournament-banners');

CREATE POLICY "Authenticated users can update tournament banners" ON storage.objects
FOR UPDATE USING (bucket_id = 'tournament-banners');

CREATE POLICY "Authenticated users can delete tournament banners" ON storage.objects
FOR DELETE USING (bucket_id = 'tournament-banners');

-- Create policies for player avatars bucket
CREATE POLICY "Public Access for player avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'player-avatars');

CREATE POLICY "Authenticated users can upload player avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'player-avatars');

CREATE POLICY "Authenticated users can update player avatars" ON storage.objects  
FOR UPDATE USING (bucket_id = 'player-avatars');

CREATE POLICY "Authenticated users can delete player avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'player-avatars');

-- Create policies for match thumbnails bucket
CREATE POLICY "Public Access for match thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'match-thumbnails');

CREATE POLICY "Authenticated users can upload match thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'match-thumbnails');

CREATE POLICY "Authenticated users can update match thumbnails" ON storage.objects
FOR UPDATE USING (bucket_id = 'match-thumbnails');

CREATE POLICY "Authenticated users can delete match thumbnails" ON storage.objects
FOR DELETE USING (bucket_id = 'match-thumbnails');

-- Add thumbnail column to matches table
ALTER TABLE matches ADD COLUMN thumbnail TEXT;
