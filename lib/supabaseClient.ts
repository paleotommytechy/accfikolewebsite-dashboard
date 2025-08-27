

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
 *        coins integer DEFAULT 0
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
 *        created_at timestamp with time zone DEFAULT now(),
 *        coin_reward integer NOT NULL DEFAULT 0
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
 *        updated_at timestamp with time zone,
 *        coin_reward integer NOT NULL DEFAULT 0
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
 *    -- Create user_coins table to hold the official coin balance
 *    CREATE TABLE IF NOT EXISTS public.user_coins (
 *      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *      user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 *      total_coins integer NOT NULL DEFAULT 0,
 *      updated_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.user_coins IS 'Stores the official total coin count for each user.';
 *
 *    -- Create coin_transactions table to log all coin movements
 *    CREATE TABLE IF NOT EXISTS public.coin_transactions (
 *      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      source_type text NOT NULL, -- 'task' or 'challenge'
 *      source_id uuid NOT NULL,
 *      coin_amount integer NOT NULL,
 *      status text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
 *      created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.coin_transactions IS 'Logs every coin transaction for auditing and history.';
 *
 *    ```
 * 
 * 3. Create Profile on Signup (Database Trigger):
 *    - This function automatically creates a profile, role, and coin record for new users.
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
 *      insert into public.profiles (id, email, coins)
 *      values (new.id, new.email, 0);
 *      -- Assign a default role
 *      insert into public.user_roles (user_id, role)
 *      values (new.id, 'member');
 *      -- Create a coin record
 *      insert into public.user_coins (user_id, total_coins)
 *      values (new.id, 0);
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
 * 4. Coin Approval Function (RPC)
 *    - This function securely credits coins to a user's account.
 *
 *    ```sql
 *    create or replace function public.approve_coin_transaction(transaction_id uuid)
 *    returns void
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    declare
 *      trans_info record;
 *      current_role text;
 *    begin
 *      -- Check if current user is an admin
 *      select role into current_role from public.user_roles where user_id = auth.uid();
 *      if current_role <> 'admin' then
 *        raise exception 'Only admins can approve transactions.';
 *      end if;
 *
 *      -- Get transaction details
 *      select user_id, coin_amount, status into trans_info
 *      from public.coin_transactions where id = transaction_id;
 *
 *      -- Ensure transaction is pending
 *      if trans_info.status <> 'pending' then
 *        raise exception 'Transaction is not pending.';
 *      end if;
 *
 *      -- Update user_coins table
 *      update public.user_coins
 *      set total_coins = total_coins + trans_info.coin_amount
 *      where user_id = trans_info.user_id;
 *
 *      -- For convenience, also update the profiles table if you use it for display
 *      update public.profiles
 *      set coins = coins + trans_info.coin_amount
 *      where id = trans_info.user_id;
 *
 *      -- Mark transaction as approved
 *      update public.coin_transactions
 *      set status = 'approved'
 *      where id = transaction_id;
 *
 *    end;
 *    $$;
 *    ```
 * 
 * 5. Task Assignment Function (RPC)
 *    - This function assigns a daily task to all users for the current day.
 *
 *    ```sql
 *    create or replace function public.assign_task_to_all_users(task_id_to_assign uuid)
 *    returns void
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    declare
 *      user_record record;
 *      current_role text;
 *    begin
 *      -- Check if current user is an admin
 *      select role into current_role from public.user_roles where user_id = auth.uid();
 *      if current_role <> 'admin' then
 *        raise exception 'Only admins can assign tasks.';
 *      end if;
 *
 *      for user_record in select id from auth.users loop
 *        -- Check if an assignment for this task already exists for this user today
 *        if not exists (
 *          select 1
 *          from public.tasks_assignments
 *          where task_id = task_id_to_assign
 *            and assignee_id = user_record.id
 *            and date_trunc('day', created_at) = date_trunc('day', now())
 *        ) then
 *          -- Insert a new assignment
 *          insert into public.tasks_assignments (task_id, assignee_id, status)
 *          values (task_id_to_assign, user_record.id, 'assigned');
 *        end if;
 *      end loop;
 *
 *    end;
 *    $$;
 *    ```
 * 
 * 6. Storage:
 *    - Create a public bucket named `avatars`.
 * 
 * 7. Row Level Security (RLS) Policies:
 *    - It's critical to enable RLS on all tables and create policies
 *      to secure your data.
 *    - Example: Admins can do anything, users can only see their own transactions.
 *      `CREATE POLICY "Enable all for admins" ON public.coin_transactions FOR ALL TO authenticated USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );`
 *      `CREATE POLICY "Users can see their own transactions" ON public.coin_transactions FOR SELECT TO authenticated USING ( auth.uid() = user_id );`
 *      `CREATE POLICY "Users can create their own transactions" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK ( auth.uid() = user_id );`
 */