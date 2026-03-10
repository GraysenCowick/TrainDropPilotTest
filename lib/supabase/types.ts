// ── Shared types ────────────────────────────────────────────────────────────

export type ModuleStatus = "processing" | "ready" | "published" | "error";
export type VideoProcessingStep =
  | "transcribing"
  | "analyzing"
  | "voiceover"
  | "processing_video"
  | "finalizing"
  | null;
export type InputType = "video" | "text";

export interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  user_id: string;
  title: string;
  status: ModuleStatus;
  input_type: InputType;
  raw_notes: string | null;
  original_video_url: string | null;
  processed_video_url: string | null;
  processed_video_original_audio_url: string | null;
  transcript: unknown;
  cleaned_transcript: string | null;
  sop_content: string | null;
  chapters: unknown;
  processing_step: VideoProcessingStep;
  voiceover_url: string | null;
  vtt_content: string | null;
  share_slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Completion {
  id: string;
  module_id: string;
  employee_name: string;
  employee_email: string | null;
  completed_at: string;
}

export interface Assignment {
  id: string;
  module_id: string;
  user_id: string;
  employee_email: string;
  assigned_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ModuleCompletion {
  id: string;
  module_id: string;
  team_member_id: string;
  unique_token: string;
  sent_at: string;
  viewed_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number | null;
  // joined
  team_member?: TeamMember;
}

export interface Track {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  // joined
  track_modules?: TrackModule[];
}

export interface TrackModule {
  id: string;
  track_id: string;
  module_id: string;
  sort_order: number;
  created_at: string;
  // joined
  module?: Module;
}

export interface TrackAssignment {
  id: string;
  track_id: string;
  employee_email: string;
  employee_name: string | null;
  assigned_at: string;
  completed_at: string | null;
  unique_token: string;
  // joined
  track?: Track;
  track_module_completions?: TrackModuleCompletion[];
}

export interface TrackModuleCompletion {
  id: string;
  track_assignment_id: string;
  module_id: string;
  completed_at: string | null;
}

/*
  ========================================
  SUPABASE SQL SCHEMA
  Run this in your Supabase SQL editor:
  ========================================

  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Profiles table (auto-created from auth.users)
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    business_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Modules table
  CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'published', 'error')),
    input_type TEXT NOT NULL CHECK (input_type IN ('video', 'text')),
    raw_notes TEXT,
    original_video_url TEXT,
    processed_video_url TEXT,
    processed_video_original_audio_url TEXT,
    transcript JSONB,
    cleaned_transcript TEXT,
    sop_content TEXT,
    chapters JSONB,
    share_slug TEXT UNIQUE,
    published_at TIMESTAMPTZ,
    processing_step TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- If modules table already exists, run these migrations:
  -- ALTER TABLE modules ADD COLUMN IF NOT EXISTS processing_step TEXT;
  -- ALTER TABLE modules ADD COLUMN IF NOT EXISTS voiceover_url TEXT;
  -- ALTER TABLE modules ADD COLUMN IF NOT EXISTS vtt_content TEXT;

  -- Completions table
  CREATE TABLE completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    employee_email TEXT,
    completed_at TIMESTAMPTZ DEFAULT now()
  );

  -- Assignments table
  CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    employee_email TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(module_id, employee_email)
  );

  -- Auto-create profile on signup
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

  -- RLS Policies
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Users can view own modules" ON modules FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own modules" ON modules FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own modules" ON modules FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own modules" ON modules FOR DELETE USING (auth.uid() = user_id);
  CREATE POLICY "Public can view published modules" ON modules FOR SELECT
    USING (status = 'published' AND share_slug IS NOT NULL);

  CREATE POLICY "Anyone can insert completions" ON completions FOR INSERT WITH CHECK (true);
  CREATE POLICY "Module owners can view completions" ON completions FOR SELECT
    USING (EXISTS (SELECT 1 FROM modules WHERE modules.id = completions.module_id AND modules.user_id = auth.uid()));

  CREATE POLICY "Module owners can manage assignments" ON assignments FOR ALL
    USING (auth.uid() = user_id);

  -- Team members table
  CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, email)
  );

  ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own team members" ON team_members FOR ALL
    USING (auth.uid() = user_id);

  -- Module completions table (token-based, per-employee tracking)
  CREATE TABLE module_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    unique_token TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    viewed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    UNIQUE(module_id, team_member_id)
  );

  ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Module owners can view module_completions" ON module_completions FOR SELECT
    USING (EXISTS (SELECT 1 FROM modules WHERE modules.id = module_completions.module_id AND modules.user_id = auth.uid()));
  CREATE POLICY "Anyone can insert module_completions" ON module_completions FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update module_completions" ON module_completions FOR UPDATE USING (true);

  -- Storage buckets: create in Supabase Dashboard > Storage
  -- Bucket: "videos" (private)
  -- Bucket: "processed" (public)

  -- ── Training Tracks ──────────────────────────────────────────────────────

  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Tracks (a named, ordered collection of modules)
  CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Ordered modules within a track
  CREATE TABLE track_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(track_id, module_id)
  );

  -- Per-employee track assignments (magic-link access)
  CREATE TABLE track_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    UNIQUE(track_id, employee_email)
  );

  -- Per-module completion within a track assignment
  CREATE TABLE track_module_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_assignment_id UUID NOT NULL REFERENCES track_assignments(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(track_assignment_id, module_id)
  );

  -- RLS for tracks
  ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own tracks" ON tracks FOR ALL USING (auth.uid() = user_id);

  -- RLS for track_modules
  ALTER TABLE track_modules ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own track_modules" ON track_modules FOR ALL
    USING (EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_modules.track_id AND tracks.user_id = auth.uid()));

  -- RLS for track_assignments
  ALTER TABLE track_assignments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own track_assignments" ON track_assignments FOR ALL
    USING (EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_assignments.track_id AND tracks.user_id = auth.uid()));
  CREATE POLICY "Anyone can read track_assignments by token" ON track_assignments FOR SELECT
    USING (true);
  CREATE POLICY "Anyone can update track_assignments" ON track_assignments FOR UPDATE
    USING (true);

  -- RLS for track_module_completions
  ALTER TABLE track_module_completions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Anyone can insert track_module_completions" ON track_module_completions FOR INSERT
    WITH CHECK (true);
  CREATE POLICY "Anyone can read track_module_completions" ON track_module_completions FOR SELECT
    USING (true);
  CREATE POLICY "Users can view own track_module_completions" ON track_module_completions FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM track_assignments ta
      JOIN tracks t ON t.id = ta.track_id
      WHERE ta.id = track_module_completions.track_assignment_id
        AND t.user_id = auth.uid()
    ));
*/
