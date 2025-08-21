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
 *    -- Create the 'challenges' table for weekly challenges
 *    CREATE TABLE IF NOT EXISTS public.challenges (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        title text NOT NULL,
 *        description text,
 *        end_date timestamp with time zone NOT NULL,
 *        progress integer DEFAULT 0,
 *        total_participants integer DEFAULT 0,
 *        created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.challenges IS 'Stores weekly or periodic group challenges.';
 *
 *    -- Create the 'tasks' table for user-specific tasks
 *    CREATE TABLE IF NOT EXISTS public.tasks (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        title text NOT NULL,
 *        description text,
 *        status text DEFAULT 'pending'::text,
 *        due_date date,
 *        coins integer DEFAULT 0,
 *        assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *        created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.tasks IS 'Stores tasks assigned to individual users.';
 *    ```
 * 
 * 3. Create Profile on Signup (Database Trigger):
 *    - To automatically create a user profile when a new user signs up,
 *      run the following SQL code in the Supabase SQL Editor.
 *      This function will be triggered every time a new user is added to `auth.users`.
 * 
 *    ```sql
 *    -- Function to create a new profile for a new user
 *    create or replace function public.handle_new_user()
 *    returns trigger
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    begin
 *      insert into public.profiles (id, email, role, coins, level)
 *      values (new.id, new.email, 'member', 0, 1);
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
 *    - `profiles`:
 *      - Enable RLS.
 *      - Policy for SELECT: `(auth.uid() = id)` (Users can only see their own profile).
 *      - Policy for UPDATE: `(auth.uid() = id)` (Users can only update their own profile).
 *    - `tasks`:
 *      - Enable RLS.
 *      - Policy for SELECT: `(auth.uid() = assigned_to)` (Users can only see their own tasks).
 *    - Apply similar, appropriate RLS policies to all other tables. For example, only admins should be able to create tasks or challenges.
 */