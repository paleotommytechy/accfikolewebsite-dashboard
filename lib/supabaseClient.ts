
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// These credentials must be stored in environment variables.
// In development, you can use a .env file. For production, configure them
// on your hosting platform.
const supabaseUrl = 'https://tblkfcafwjconemdcrpk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibGtmY2Fmd2pjb25lbWRjcnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MjMwNDksImV4cCI6MjA2ODM5OTA0OX0.RMf4-H4z9I8rdzroyl_an390s0SggD_5TqPw30vDV5Q';

// The createClient function requires strings. If the env vars are missing,
// we initialize supabase as null and the app will show a degraded state.
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
    console.error("Supabase URL and/or Anon Key are missing from environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). The application will not be able to connect to Supabase and will be in a read-only/mocked state.");
}

/**
 * --- RECOMMENDED SUPABASE SETUP ---
 * 
 * 1. Authentication:
 *    - Enable Email provider.
 *    - Disable "Enable email confirmations" in development for easier testing.
 * 
 * 2. Database Tables & SQL Snippets:
 *    - Run the following SQL in your Supabase project's SQL Editor
 *      to create the necessary tables for the application features.
 * 
 *    ```sql
 *    -- Create profiles table (if not already created by handle_new_user)
 *    CREATE TABLE IF NOT EXISTS public.profiles (
 *        id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *        full_name text,
 *        avatar_url text,
 *        fellowship_position text,
 *        level integer DEFAULT 1,
 *        department text,
 *        gender text,
 *        dob text,
 *        whatsapp text,
 *        hotline text,
 *        email text,
 *        coins integer DEFAULT 0,
 *        role text DEFAULT 'member'::text
 *    );
 *    COMMENT ON TABLE public.profiles IS 'Stores user-specific public data.';
 *
 *    -- Create user_roles table for role-based access control
 *    CREATE TABLE IF NOT EXISTS public.user_roles (
 *      user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *      role text NOT NULL
 *    );
 *    COMMENT ON TABLE public.user_roles IS 'Assigns roles (e.g., admin) to users.';
 * 
 *    -- Create weekly_challenges table
 *    CREATE TABLE IF NOT EXISTS public.weekly_challenges (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        title text NOT NULL,
 *        details text,
 *        start_date date,
 *        due_date date,
 *        rules text,
 *        created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.weekly_challenges IS 'Stores weekly group challenges for all users.';
 *
 *    -- Create weekly_participants table for tracking challenge progress
 *    CREATE TABLE IF NOT EXISTS public.weekly_participants (
 *      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *      challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
 *      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      progress integer DEFAULT 0,
 *      streak integer DEFAULT 0,
 *      joined_at timestamp with time zone DEFAULT now(),
 *      UNIQUE(challenge_id, user_id)
 *    );
 *    COMMENT ON TABLE public.weekly_participants IS 'Tracks which users have joined a challenge and their progress.';
 *
 *    -- Create tasks table for master tasks
 *    CREATE TABLE IF NOT EXISTS public.tasks (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        title text NOT NULL,
 *        frequency text NOT NULL CHECK (frequency IN ('daily', 'once', 'weekly')),
 *        details text,
 *        due_date date,
 *        created_at timestamp with time zone DEFAULT now(),
 *        updated_at timestamp with time zone
 *    );
 *    COMMENT ON TABLE public.tasks IS 'Stores master tasks that can be assigned.';
 *
 *    -- Create tasks_assignments table to link tasks to users
 *    CREATE TABLE IF NOT EXISTS public.tasks_assignments (
 *      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *      task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
 *      assignee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      status text NOT NULL DEFAULT 'assigned'::text CHECK (status IN ('assigned', 'done')),
 *      completed_at timestamp with time zone,
 *      created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.tasks_assignments IS 'Assigns tasks to specific users and tracks completion.';
 *
 *    ```
 * 
 * 3. Create Profile on Signup (Database Trigger):
 *    - This function automatically creates a profile and a role for new users.
 * 
 *    ```sql
 *    -- Function to create a new profile and role for a new user
 *    create or replace function public.handle_new_user()
 *    returns trigger
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    begin
 *      -- Create a profile
 *      insert into public.profiles (id, email, role, coins, level)
 *      values (new.id, new.email, 'member', 0, 1);
 *      -- Assign a default role
 *      insert into public.user_roles (user_id, role)
 *      values (new.id, 'member');
 *      return new;
 *    end;
 *    $$;
 * 
 *    -- Trigger to run the function after a new user is created
 *    create or replace trigger on_auth_user_created
 *      after insert on auth.users
 *      for each row execute procedure public.handle_new_user();
 *    ```
 * 
 * 4. Storage:
 *    - Create a public bucket named `avatars`.
 * 
 * 5. Row Level Security (RLS) Policies:
 *    - It's critical to enable RLS on all tables and create policies
 *      to secure your data.
 *    - Example: Only admins can manage challenges.
 *      `CREATE POLICY "Admins can manage challenges" ON public.weekly_challenges FOR ALL USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );`
 *    - Example: Users can only see their own task assignments.
 *      `CREATE POLICY "Users can view their own assignments" ON public.tasks_assignments FOR SELECT USING ( auth.uid() = assignee_id );`
 */
