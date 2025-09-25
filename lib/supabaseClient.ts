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
 *    -- (Keep your existing tables for profiles, user_roles, etc.)
 *
 *    -- NOTE: The 'get_chat_history' function joins with the 'profiles' table.
 *    -- Make sure you have a Row Level Security policy that allows authenticated
 *    -- users to read profiles. For example:
 *    -- CREATE POLICY "Authenticated users can view profiles"
 *    -- ON public.profiles FOR SELECT
 *    -- TO authenticated
 *    -- USING (true);
 *
 *    -- Create messages table
 *    CREATE TABLE IF NOT EXISTS public.messages (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *        recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *        text text NOT NULL,
 *        created_at timestamp with time zone DEFAULT now(),
 *        is_read boolean DEFAULT false
 *    );
 *    COMMENT ON TABLE public.messages IS 'Stores private messages between users.';
 *
 *    -- Enable Row Level Security for the messages table
 *    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
 * 
 *    -- Drop any old, less specific policies if they exist
 *    DROP POLICY IF EXISTS "Allow users to manage their own messages" ON public.messages;
 * 
 *    -- Create policies for the messages table
 *    CREATE POLICY "Allow users to read their own messages"
 *    ON public.messages FOR SELECT
 *    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
 * 
 *    CREATE POLICY "Allow users to send messages"
 *    ON public.messages FOR INSERT
 *    WITH CHECK (auth.uid() = sender_id);
 * 
 *    CREATE POLICY "Allow users to mark received messages as read"
 *    ON public.messages FOR UPDATE
 *    USING (auth.uid() = recipient_id)
 *    WITH CHECK (auth.uid() = recipient_id);
 * 
 *    CREATE POLICY "Allow users to delete their own sent messages"
 *    ON public.messages FOR DELETE
 *    USING (auth.uid() = sender_id);
 *
 *    -- Create function to mark messages as read
 *    CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_sender_id uuid)
 *    RETURNS VOID
 *    LANGUAGE plpgsql
 *    SECURITY DEFINER
 *    AS $$
 *    BEGIN
 *      UPDATE public.messages
 *      SET is_read = true
 *      WHERE recipient_id = auth.uid()
 *        AND sender_id = p_sender_id
 *        AND is_read = false;
 *    END;
 *    $$;
 * 
 *    -- Create function to get chat history
 *    create or replace function get_chat_history()
 *    returns table (
 *        other_user_id uuid,
 *        other_user_name text,
 *        other_user_avatar text,
 *        last_message_text text,
 *        last_message_at timestamptz,
 *        unread_count bigint
 *    )
 *    language sql security definer
 *    as $$
 *    with conversations as (
 *        select
 *            case
 *                when sender_id = auth.uid() then recipient_id
 *                else sender_id
 *            end as other_user_id,
 *            text,
 *            created_at,
 *            case
 *                when recipient_id = auth.uid() and is_read = false then 1
 *                else 0
 *            end as is_unread
 *        from messages
 *        where sender_id = auth.uid() or recipient_id = auth.uid()
 *    ),
 *    ranked_conversations as (
 *        select
 *            other_user_id,
 *            text,
 *            created_at,
 *            is_unread,
 *            row_number() over(partition by other_user_id order by created_at desc) as rn
 *        from conversations
 *    ),
 *    latest_messages as (
 *        select
 *            other_user_id,
 *            text as last_message_text,
 *            created_at as last_message_at
 *        from ranked_conversations
 *        where rn = 1
 *    ),
 *    unread_counts as (
 *        select
 *            other_user_id,
 *            sum(is_unread) as unread_count
 *        from conversations
 *        group by other_user_id
 *    )
 *    select
 *        u.other_user_id,
 *        p.full_name as other_user_name,
 *        p.avatar_url as other_user_avatar,
 *        l.last_message_text,
 *        l.last_message_at,
 *        coalesce(u.unread_count, 0) as unread_count
 *    from unread_counts u
 *    join latest_messages l on u.other_user_id = l.other_user_id
 *    join profiles p on u.other_user_id = p.id
 *    order by l.last_message_at desc;
 *    $$;
 * 
 *    ```
 */