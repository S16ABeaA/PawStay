-- Migration: Add 'super_admin' to the allowed roles in profiles table
-- Run this once in your Supabase SQL editor before enabling super_admin signups.

-- 1. Drop the existing role check constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Re-add it with 'super_admin' included
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'customer'::text,
    'admin'::text,
    'proprietor'::text,
    'super_admin'::text
  ]));
