-- =============================================================================
-- Smart Heritage Guide — Supabase PostgreSQL + PostGIS + pgvector Schema
-- Migration: 001_initial_schema.sql
-- Run in Supabase SQL Editor or via psql against Supabase Cloud PostgreSQL.
-- =============================================================================

-- 1. Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Table: profiles (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    display_name TEXT NOT NULL DEFAULT 'Khách Du Lịch',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    preferred_language TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_language IN ('vi', 'en', 'fr', 'zh', 'ja')),
    preferred_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_verified_walking_seconds INTEGER NOT NULL DEFAULT 0,
    total_verified_walking_meters INTEGER NOT NULL DEFAULT 0,
    verified_sites_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_time ON public.profiles (total_verified_walking_seconds DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_dist ON public.profiles (total_verified_walking_meters DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard_sites ON public.profiles (verified_sites_count DESC);

-- 3. Table: heritage_sites (PostGIS geography Point 4326)
CREATE TABLE IF NOT EXISTS public.heritage_sites (
    id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    district TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) STORED,
    category TEXT NOT NULL CHECK (category IN ('imperial', 'temple', 'museum', 'monument', 'ancient_town')),
    unesco_recognized BOOLEAN NOT NULL DEFAULT FALSE,
    national_special_monument BOOLEAN NOT NULL DEFAULT FALSE,
    rating DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    ticket_price TEXT NOT NULL DEFAULT 'Miễn phí tham quan',
    address TEXT,
    cover_image TEXT NOT NULL DEFAULT '',
    recommended_visit_minutes INTEGER NOT NULL DEFAULT 45,
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heritage_sites_location_gist ON public.heritage_sites USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_heritage_sites_category ON public.heritage_sites (category);
CREATE INDEX IF NOT EXISTS idx_heritage_sites_district ON public.heritage_sites (district);

-- 4. Table: restaurants (nearby culinary stops with PostGIS geography)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES public.heritage_sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL DEFAULT '',
    specialty_dishes JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    price_range TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) STORED,
    address TEXT NOT NULL DEFAULT '',
    open_hours TEXT NOT NULL DEFAULT '07:00 – 21:00',
    meal_slots JSONB NOT NULL DEFAULT '["lunch", "dinner"]'::jsonb,
    image_url TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_restaurants_site_id ON public.restaurants (site_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_location_gist ON public.restaurants USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants (rating DESC);

-- 5. Table: heritage_knowledge_chunks (Hybrid pgvector HNSW + Full-Text GIN)
CREATE TABLE IF NOT EXISTS public.heritage_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL REFERENCES public.heritage_sites(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'vi' CHECK (language IN ('vi', 'en', 'fr', 'zh', 'ja')),
    source_type TEXT NOT NULL DEFAULT 'summary' CHECK (source_type IN ('summary', 'script', 'architecture', 'restaurant')),
    content TEXT NOT NULL,
    embedding_json JSONB,
    embedding VECTOR(768),
    search_tsv TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', COALESCE(content, ''))
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_site_lang ON public.heritage_knowledge_chunks (site_id, language);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tsv_gin ON public.heritage_knowledge_chunks USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
    ON public.heritage_knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 6. Table: visited_journeys (Check-ins + Anti-Fake Verification)
CREATE TABLE IF NOT EXISTS public.visited_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL REFERENCES public.heritage_sites(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    walking_duration_seconds INTEGER NOT NULL DEFAULT 0,
    walking_distance_meters INTEGER NOT NULL DEFAULT 0,
    route_coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_note TEXT NOT NULL DEFAULT '',
    user_rating INTEGER NOT NULL DEFAULT 5 CHECK (user_rating BETWEEN 1 AND 5),
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'simulated', 'flagged')),
    verification_score DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    verification_details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_visited_journeys_user_id ON public.visited_journeys (user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visited_journeys_site_id ON public.visited_journeys (site_id);
CREATE INDEX IF NOT EXISTS idx_visited_journeys_status ON public.visited_journeys (verification_status);

-- 7. Table: journey_photos (Supabase Storage references + Vision AI metadata)
CREATE TABLE IF NOT EXISTS public.journey_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES public.visited_journeys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    site_id TEXT NOT NULL REFERENCES public.heritage_sites(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL DEFAULT '',
    public_url TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    lat DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    lng DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    walking_duration_seconds_at_capture INTEGER NOT NULL DEFAULT 0,
    vision_detected_site_id TEXT,
    vision_confidence DOUBLE PRECISION,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_photos_journey_id ON public.journey_photos (journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_photos_user_id ON public.journey_photos (user_id);

-- 8. Table: badges (Achievement catalog)
CREATE TABLE IF NOT EXISTS public.badges (
    code TEXT PRIMARY KEY,
    title_vi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'award',
    rule_config JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 9. Table: user_badges (Unlocked user achievements)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- 10. Table: route_cache (Backend Walking Route Proxy Cache)
CREATE TABLE IF NOT EXISTS public.route_cache (
    cache_key TEXT PRIMARY KEY,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    provider TEXT NOT NULL DEFAULT 'osrm' CHECK (provider IN ('osrm', 'goong', 'fallback')),
    route_payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_cache_expires_at ON public.route_cache (expires_at);

-- =============================================================================
-- Helper: Sync Supabase Auth users -> public.profiles automatically
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, preferred_language, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1), 'Khách Du Lịch'),
        COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'vi'),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- =============================================================================
-- Row-Level Security (RLS) Policies
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heritage_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_cache ENABLE ROW LEVEL SECURITY;

-- Public catalog read policies
DROP POLICY IF EXISTS "heritage_sites_public_read" ON public.heritage_sites;
CREATE POLICY "heritage_sites_public_read" ON public.heritage_sites FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "heritage_sites_admin_write" ON public.heritage_sites;
CREATE POLICY "heritage_sites_admin_write" ON public.heritage_sites FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "restaurants_admin_write" ON public.restaurants;
CREATE POLICY "restaurants_admin_write" ON public.restaurants FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "knowledge_chunks_public_read" ON public.heritage_knowledge_chunks;
CREATE POLICY "knowledge_chunks_public_read" ON public.heritage_knowledge_chunks FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "knowledge_chunks_admin_write" ON public.heritage_knowledge_chunks;
CREATE POLICY "knowledge_chunks_admin_write" ON public.heritage_knowledge_chunks FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "badges_public_read" ON public.badges;
CREATE POLICY "badges_public_read" ON public.badges FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "route_cache_public_read" ON public.route_cache;
CREATE POLICY "route_cache_public_read" ON public.route_cache FOR SELECT USING (TRUE);

-- Profiles: public leaderboard read, self update
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Visited Journeys & Photos: owner read/write, admin read
DROP POLICY IF EXISTS "journeys_owner_all" ON public.visited_journeys;
CREATE POLICY "journeys_owner_all" ON public.visited_journeys
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "photos_owner_all" ON public.journey_photos;
CREATE POLICY "photos_owner_all" ON public.journey_photos
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_badges_public_read" ON public.user_badges;
CREATE POLICY "user_badges_public_read" ON public.user_badges FOR SELECT USING (TRUE);

-- =============================================================================
-- Supabase Storage Bucket: heritage-photos + Storage RLS
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'heritage-photos',
            'heritage-photos',
            TRUE,
            10485760,
            ARRAY['image/jpeg', 'image/png', 'image/webp']
        )
        ON CONFLICT (id) DO UPDATE SET public = TRUE;

        DROP POLICY IF EXISTS "heritage_photos_public_read" ON storage.objects;
        CREATE POLICY "heritage_photos_public_read" ON storage.objects
            FOR SELECT USING (bucket_id = 'heritage-photos');

        DROP POLICY IF EXISTS "heritage_photos_owner_insert" ON storage.objects;
        CREATE POLICY "heritage_photos_owner_insert" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'heritage-photos'
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

        DROP POLICY IF EXISTS "heritage_photos_owner_delete" ON storage.objects;
        CREATE POLICY "heritage_photos_owner_delete" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'heritage-photos'
                AND (
                    (storage.foldername(name))[1] = auth.uid()::text
                    OR public.is_admin()
                )
            );
    END IF;
END $$;
