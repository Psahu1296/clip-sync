-- Migration: 001_initial_schema.sql
-- Description: Create initial tables for users, devices, and clips
-- Created: 2026-01-10

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE content_type AS ENUM ('text', 'url', 'image');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan user_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on plan for quick filtering
CREATE INDEX idx_users_plan ON users(plan);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for devices
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_last_sync ON devices(last_sync_at);

-- Clips table
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  encrypted_blob TEXT NOT NULL,
  content_type content_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for clips
CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_device_id ON clips(device_id);
CREATE INDEX idx_clips_updated_at ON clips(updated_at);
CREATE INDEX idx_clips_deleted ON clips(deleted);
CREATE INDEX idx_clips_user_updated ON clips(user_id, updated_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Note: These work with Supabase Auth
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only access their own devices
CREATE POLICY devices_select_own ON devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY devices_insert_own ON devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY devices_update_own ON devices
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY devices_delete_own ON devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can only access their own clips
CREATE POLICY clips_select_own ON clips
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY clips_insert_own ON clips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY clips_update_own ON clips
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY clips_delete_own ON clips
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to automatically create user on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, plan)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
