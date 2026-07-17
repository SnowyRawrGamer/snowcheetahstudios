
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings write" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories write" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.devlogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  main_image_url text,
  content text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devlogs TO anon, authenticated;
GRANT ALL ON public.devlogs TO service_role;
ALTER TABLE public.devlogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devlogs public read" ON public.devlogs FOR SELECT USING (is_public = true);
CREATE POLICY "devlogs admin read" ON public.devlogs FOR SELECT USING (true);
CREATE POLICY "devlogs write" ON public.devlogs FOR INSERT WITH CHECK (true);
CREATE POLICY "devlogs update" ON public.devlogs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "devlogs delete" ON public.devlogs FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.devlogs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', 'Snow Cheetah Studios'),
  ('hero_subtitle', 'Crafting playful Roblox worlds from a snowy peak.'),
  ('featured_game_title', 'Escape Tsunami For Pets'),
  ('featured_game_description', 'Race against the rising wave to save every pet you love. A brand new co-op adventure coming soon.'),
  ('featured_game_url', 'https://view-link.cx/OuIP4sdxDhZ'),
  ('featured_game_cta', 'Play on Roblox'),
  ('countdown_target', (now() + interval '30 days')::text);

INSERT INTO public.categories (name, slug) VALUES
  ('Announcements', 'announcements'),
  ('Development', 'development'),
  ('Community', 'community');
