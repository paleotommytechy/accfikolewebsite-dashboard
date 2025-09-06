


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
 *      source_type text NOT NULL, -- 'task', 'challenge', or 'admin_adjustment'
 *      source_id uuid NOT NULL,
 *      coin_amount integer NOT NULL,
 *      status text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
 *      created_at timestamp with time zone DEFAULT now(),
 *      reason text -- For admin adjustments
 *    );
 *    COMMENT ON TABLE public.coin_transactions IS 'Logs every coin transaction for auditing and history.';
 *
 *    -- Create notifications table
 *    CREATE TABLE IF NOT EXISTS public.notifications (
 *      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *      type text NOT NULL, -- 'coin_approval', 'new_event', etc.
 *      message text NOT NULL,
 *      link text, -- optional link to navigate to
 *      read boolean DEFAULT false,
 *      created_at timestamp with time zone DEFAULT now()
 *    );
 *    COMMENT ON TABLE public.notifications IS 'Stores user-specific notifications.';
 * 
 *    -- Create messages table
 *    CREATE TABLE IF NOT EXISTS public.messages (
 *        id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
 *        sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *        receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *        text text NOT NULL,
 *        created_at timestamp with time zone DEFAULT now(),
 *        read boolean DEFAULT false
 *    );
 *    COMMENT ON TABLE public.messages IS 'Stores private messages between users.';
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
 *    declare
 *      admin_user_id uuid;
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
 *      
 *      -- Notify all admins about the new user
 *      for admin_user_id in select user_id from public.user_roles where role = 'admin' loop
 *        insert into public.notifications (user_id, type, message, link)
 *        values (
 *            admin_user_id,
 *            'new_user',
 *            'New member ' || coalesce(new.email, 'with unknown email') || ' has joined. Click to send a welcome message!',
 *            '/compose?recipientId=' || new.id
 *        );
 *      end loop;
 *
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
 *      -- FIX: Iterate over the public 'profiles' table instead of 'auth.users' to avoid potential permission issues
 *      -- with accessing the 'auth' schema directly from a SECURITY DEFINER function.
 *      -- Every user is expected to have a profile.
 *      for user_record in select id from public.profiles loop
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
 *      to secure your data. After creating tables, go to the "Authentication" -> "Policies"
 *      section in Supabase Studio for each table and add the following policies.
 * 
 *    ```sql
 *    -- Helper function to check for admin role
 *    create or replace function is_admin()
 *    returns boolean
 *    language sql
 *    security definer
 *    as $$
 *      select exists(
 *        select 1 from public.user_roles
 *        where user_id = auth.uid() and role = 'admin'
 *      );
 *    $$;
 * 
 *    -- PROFILES TABLE
 *    -- 1. Enable RLS
 *    alter table public.profiles enable row level security;
 *    -- 2. Policy: Allow users to see all profiles
 *    create policy "Allow all users to read profiles" on public.profiles for select using (true);
 *    -- 3. Policy: Allow users to update their own profile
 *    create policy "Allow user to update own profile" on public.profiles for update using (auth.uid() = id);
 * 
 *    -- TASKS TABLE
 *    -- 1. Enable RLS
 *    alter table public.tasks enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to tasks" on public.tasks for all using (is_admin());
 *    -- 3. Policy: Authenticated users can read tasks
 *    create policy "Allow users to read tasks" on public.tasks for select using (auth.role() = 'authenticated');
 * 
 *    -- TASKS_ASSIGNMENTS TABLE
 *    -- 1. Enable RLS
 *    alter table public.tasks_assignments enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to assignments" on public.tasks_assignments for all using (is_admin());
 *    -- 3. Policy: Users can see their own assignments
 *    create policy "Allow user to see own assignments" on public.tasks_assignments for select using (auth.uid() = assignee_id);
 *    -- 4. Policy: Users can update their own assignments (e.g., mark as done)
 *    create policy "Allow user to update own assignments" on public.tasks_assignments for update using (auth.uid() = assignee_id);
 * 
 *    -- WEEKLY_CHALLENGES TABLE
 *    -- 1. Enable RLS
 *    alter table public.weekly_challenges enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to challenges" on public.weekly_challenges for all using (is_admin());
 *    -- 3. Policy: Authenticated users can read challenges
 *    create policy "Allow users to read challenges" on public.weekly_challenges for select using (auth.role() = 'authenticated');
 * 
 *    -- WEEKLY_PARTICIPANTS TABLE
 *    -- 1. Enable RLS
 *    alter table public.weekly_participants enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to participants" on public.weekly_participants for all using (is_admin());
 *    -- 3. Policy: Users can manage their own participation record
 *    create policy "Allow user to manage own participation" on public.weekly_participants for all using (auth.uid() = user_id);
 * 
 *    -- COIN_TRANSACTIONS TABLE
 *    -- 1. Enable RLS
 *    alter table public.coin_transactions enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to transactions" on public.coin_transactions for all using (is_admin());
 *    -- 3. Policy: Users can see their own transactions
 *    create policy "Allow user to see own transactions" on public.coin_transactions for select using (auth.uid() = user_id);
 *    -- 4. Policy: Users can create their own transactions
 *    create policy "Allow user to create own transactions" on public.coin_transactions for insert with check (auth.uid() = user_id);
 * 
 *    -- NOTIFICATIONS TABLE
 *    -- 1. Enable RLS
 *    alter table public.notifications enable row level security;
 *    -- 2. Policy: Admins can create notifications
 *    create policy "Allow admin to create notifications" on public.notifications for insert with check (is_admin());
 *    -- 3. Policy: Users can see their own notifications
 *    create policy "Allow user to see own notifications" on public.notifications for select using (auth.uid() = user_id);
 *    -- 4. Policy: Users can update their own notifications (e.g., mark as read)
 *    create policy "Allow user to update own notifications" on public.notifications for update using (auth.uid() = user_id);
 *
 *    -- MESSAGES TABLE
 *    -- 1. Enable RLS
 *    alter table public.messages enable row level security;
 *    -- 2. Policy: Users can manage their own messages (send, receive, read)
 *    create policy "Allow users to manage their own messages" on public.messages for all using (auth.uid() = sender_id or auth.uid() = receiver_id);
 *    ```
 * 
 * 8. User Management Functions (RPC for Admins)
 *    - These functions are for admins to manage users.
 * 
 *    ```sql
 *    -- Function to allow an admin to delete a user. This is highly destructive.
 *    -- This function MUST be created by a SUPERUSER, as it modifies the auth schema.
 *    -- It may be preferable to implement this as a Supabase Edge Function using the service_role key.
 *    create or replace function public.delete_user_account(target_user_id uuid)
 *    returns void
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    begin
 *      if not is_admin() then
 *        raise exception 'Only admins can delete users.';
 *      end if;
 *      
 *      delete from auth.users where id = target_user_id;
 *    end;
 *    $$;
 * 
 *    -- Function to allow an admin to update a user's role.
 *    create or replace function public.update_user_role(target_user_id uuid, new_role text)
 *    returns void
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    begin
 *      if not is_admin() then
 *        raise exception 'Only admins can change roles.';
 *      end if;
 *
 *      update public.user_roles
 *      set role = new_role
 *      where user_id = target_user_id;
 *    end;
 *    $$;
 *
 *    -- Function for an admin to adjust a user's coin balance.
 *    create or replace function public.admin_adjust_coins(target_user_id uuid, amount integer, reason text)
 *    returns void
 *    language plpgsql
 *    security definer set search_path = public
 *    as $$
 *    declare
 *      transaction_source_id uuid;
 *    begin
 *      if not is_admin() then
 *        raise exception 'Only admins can adjust coins.';
 *      end if;
 *
 *      -- Use admin's own user_id as the source_id for the transaction log for audit purposes.
 *      transaction_source_id := auth.uid();
 *
 *      -- Update the profiles table
 *      update public.profiles
 *      set coins = coins + amount
 *      where id = target_user_id;
 *
 *      -- Log the transaction
 *      insert into public.coin_transactions(user_id, source_type, source_id, coin_amount, status, reason)
 *      values (target_user_id, 'admin_adjustment', transaction_source_id, amount, 'approved', reason);
 *    end;
 *    $$;
 *    ```
 * 
 * 9. Update RLS policies for user_roles
 *    - Admins need to be able to read and write to this table.
 *
 *    ```sql
 *    -- USER_ROLES TABLE
 *    -- 1. Enable RLS
 *    alter table public.user_roles enable row level security;
 *    -- 2. Policy: Admins can do anything
 *    create policy "Allow admin full access to roles" on public.user_roles for all using (is_admin());
 *    -- 3. Policy: Users can see their own role
 *    create policy "Allow users to see their own role" on public.user_roles for select using (auth.uid() = user_id);
 *    ```
 */