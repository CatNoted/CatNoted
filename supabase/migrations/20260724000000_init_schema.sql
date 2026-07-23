-- Supabase Init Schema Migration for CatNoted
-- Path: supabase/migrations/20260724000000_init_schema.sql
-- Description: Zero-Knowledge E2EE + Yjs CRDT + Local-First Architecture DDL Schema with RLS.

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- 1. public.profiles
-- Extends auth.users for extra user metadata.
-- -------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- -------------------------------------------------------------
-- 2. public.workspaces
-- Multi-user workspace container.
-- -------------------------------------------------------------
create table if not exists public.workspaces (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on workspaces
alter table public.workspaces enable row level security;

-- -------------------------------------------------------------
-- 3. public.workspace_members
-- Maps users to workspaces with specific roles.
-- -------------------------------------------------------------
create type workspace_role as enum ('owner', 'editor', 'viewer');

create table if not exists public.workspace_members (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role workspace_role default 'viewer'::workspace_role not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (workspace_id, user_id)
);

-- Enable RLS on workspace_members
alter table public.workspace_members enable row level security;

-- -------------------------------------------------------------
-- Helper Function: Check Workspace Membership
-- Used inside RLS policies for documents, updates, and attachments.
-- -------------------------------------------------------------
create or replace function public.is_workspace_member(workspace_id uuid, user_id uuid)
returns boolean security definer as $$
begin
    return exists (
        select 1 
        from public.workspace_members 
        where workspace_members.workspace_id = is_workspace_member.workspace_id 
          and workspace_members.user_id = is_workspace_member.user_id
    );
end;
$$ language plpgsql;

-- -------------------------------------------------------------
-- 4. public.documents
-- Documents and infinite canvas metadata (E2EE/Zero-Knowledge).
-- -------------------------------------------------------------
create type document_type as enum ('doc', 'canvas', 'hybrid');

create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    type document_type default 'doc'::document_type not null,
    -- Title and metadata are encrypted on the client side (AES-GCM)
    encrypted_title text, 
    encrypted_meta text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on documents
alter table public.documents enable row level security;

-- -------------------------------------------------------------
-- 5. public.crdt_updates
-- Stores binary delta updates Yjs terenkripsi (E2EE bytea blob).
-- -------------------------------------------------------------
create table if not exists public.crdt_updates (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references public.documents(id) on delete cascade not null,
    -- Local state timestamp for tracking version / sequencing
    client_id bigint not null,
    version int default 1 not null,
    -- Binary payload of the Yjs update encrypted with AES-GCM
    encrypted_blob bytea not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for fast retrieval of document updates
create index if not exists idx_crdt_updates_document_id on public.crdt_updates(document_id);

-- Enable RLS on crdt_updates
alter table public.crdt_updates enable row level security;

-- -------------------------------------------------------------
-- 6. public.attachments
-- Maps encrypted binary media assets stored in Storage Buckets.
-- -------------------------------------------------------------
create table if not exists public.attachments (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    document_id uuid references public.documents(id) on delete cascade,
    storage_path text not null, -- Path inside the supabase storage bucket
    encrypted_filename text not null,
    file_size bigint,
    mime_type text,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on attachments
alter table public.attachments enable row level security;

-- -------------------------------------------------------------
-- 7. public.widgets_catalog
-- Public registry of AI Agent-created UI widgets.
-- -------------------------------------------------------------
create table if not exists public.widgets_catalog (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    -- Widget definition structure containing Sandboxed JS execution specs
    widget_spec jsonb not null,
    created_by uuid references public.profiles(id) on delete set null,
    is_public boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on widgets_catalog
alter table public.widgets_catalog enable row level security;


-- -------------------------------------------------------------
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger security definer as $$
declare
    new_workspace_id uuid;
begin
    -- 1. Create Profile
    insert into public.profiles (id, email, display_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );

    -- 2. Create default personal workspace for the user
    insert into public.workspaces (name, created_by)
    values ('Personal Workspace', new.id)
    returning id into new_workspace_id;

    -- 3. Add user as the Owner of that workspace
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, new.id, 'owner'::workspace_role);

    return new;
end;
$$ language plpgsql;

-- Trigger definition on auth.users
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- Profiles Policies
create policy "Allow users to read all profiles"
    on public.profiles for select
    using (true);

create policy "Allow users to update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Workspaces Policies
create policy "Allow workspace members to select workspaces"
    on public.workspaces for select
    using (
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = workspaces.id
              and workspace_members.user_id = auth.uid()
        )
    );

create policy "Allow authenticated users to create workspaces"
    on public.workspaces for insert
    with check (auth.uid() = created_by);

create policy "Allow workspace owners to update workspaces"
    on public.workspaces for update
    using (
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = workspaces.id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role = 'owner'::workspace_role
        )
    );

create policy "Allow workspace owners to delete workspaces"
    on public.workspaces for delete
    using (
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = workspaces.id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role = 'owner'::workspace_role
        )
    );

-- Workspace Members Policies
create policy "Allow members to view workspace membership list"
    on public.workspace_members for select
    using (
        exists (
            select 1 from public.workspace_members as self
            where self.workspace_id = workspace_members.workspace_id
              and self.user_id = auth.uid()
        )
    );

create policy "Allow owners/editors to manage membership roles"
    on public.workspace_members for all
    using (
        exists (
            select 1 from public.workspace_members as self
            where self.workspace_id = workspace_members.workspace_id
              and self.user_id = auth.uid()
              and self.role in ('owner'::workspace_role, 'editor'::workspace_role)
        )
    );

-- Documents Policies
create policy "Allow members to read workspace documents"
    on public.documents for select
    using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Allow owners/editors to insert documents"
    on public.documents for insert
    with check (
        public.is_workspace_member(workspace_id, auth.uid()) and
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = documents.workspace_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role in ('owner'::workspace_role, 'editor'::workspace_role)
        )
    );

create policy "Allow owners/editors to update documents"
    on public.documents for update
    using (
        public.is_workspace_member(workspace_id, auth.uid()) and
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = documents.workspace_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role in ('owner'::workspace_role, 'editor'::workspace_role)
        )
    );

create policy "Allow owners to delete documents"
    on public.documents for delete
    using (
        public.is_workspace_member(workspace_id, auth.uid()) and
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = documents.workspace_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role = 'owner'::workspace_role
        )
    );

-- CRDT Updates Policies
create policy "Allow members to select document CRDT updates"
    on public.crdt_updates for select
    using (
        exists (
            select 1 from public.documents
            where documents.id = crdt_updates.document_id
              and public.is_workspace_member(documents.workspace_id, auth.uid())
        )
    );

create policy "Allow members (owners/editors) to insert CRDT updates"
    on public.crdt_updates for insert
    with check (
        exists (
            select 1 from public.documents
            join public.workspace_members on workspace_members.workspace_id = documents.workspace_id
            where documents.id = crdt_updates.document_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role in ('owner'::workspace_role, 'editor'::workspace_role)
        )
    );

-- Attachments Policies
create policy "Allow members to read attachments"
    on public.attachments for select
    using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Allow members to upload/insert attachments"
    on public.attachments for insert
    with check (
        public.is_workspace_member(workspace_id, auth.uid()) and
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = attachments.workspace_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role in ('owner'::workspace_role, 'editor'::workspace_role)
        )
    );

create policy "Allow members to delete attachments"
    on public.attachments for delete
    using (
        public.is_workspace_member(workspace_id, auth.uid()) and
        exists (
            select 1 from public.workspace_members
            where workspace_members.workspace_id = attachments.workspace_id
              and workspace_members.user_id = auth.uid()
              and workspace_members.role = 'owner'::workspace_role
        )
    );

-- Widgets Catalog Policies
create policy "Allow anyone to read public catalog widgets"
    on public.widgets_catalog for select
    using (is_public = true or auth.uid() = created_by);

create policy "Allow authenticated users to create widgets"
    on public.widgets_catalog for insert
    with check (auth.role() = 'authenticated' and auth.uid() = created_by);

create policy "Allow creator to update/delete widgets"
    on public.widgets_catalog for all
    using (auth.uid() = created_by);
