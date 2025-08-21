import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// These credentials must be stored in environment variables.
// In development, you can use a .env file. For production, configure them
// on your hosting platform.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and/or Anon Key are missing from environment variables (SUPABASE_URL, SUPABASE_ANON_KEY). The application will not be able to connect to Supabase.");
    // A user-friendly app would show a proper error message on the screen.
}

// The createClient function requires strings. If the env vars are missing,
// we pass empty strings to avoid a startup crash, but Supabase calls will fail.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

/**
 * --- RECOMMENDED SUPABASE SETUP ---
 * 
 * 1. Authentication:
 *    - Enable Email provider.
 *    - Disable "Enable email confirmations" for easier testing initially.
 * 
 * 2. Database Tables:
 *    - `profiles`: (id (matches auth.users.id), name, avatar_url, role ('admin' or 'member'), coins, level, etc.)
 *    - `tasks`: (id, title, description, status, coins, assigned_to (user id), due_date)
 *    - `events`: (id, title, date, location, description)
 *    - `prayer_requests`: (id, request, author_id, prayers (count))
 *    - ... and other tables based on `types.ts`.
 * 
 * 3. Storage:
 *    - Create a public bucket named `avatars`.
 * 
 * 4. Row Level Security (RLS) Policies:
 *    - `profiles`:
 *      - Enable RLS.
 *      - Policy for SELECT: `(auth.uid() = id)` (Users can only see their own profile).
 *      - Policy for UPDATE: `(auth.uid() = id)` (Users can only update their own profile).
 *    - `events`:
 *      - Enable RLS.
 *      - Policy for SELECT: `true` (Everyone can see events).
 *      - Policy for INSERT: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'` (Only admins can create events).
 *    - Apply similar, appropriate RLS policies to all other tables. For example, only admins should be able to create tasks.
 */
