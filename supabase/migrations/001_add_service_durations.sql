-- Migration 001: Add service_durations column to barbers table
-- Run this in Supabase SQL editor or via Supabase MCP execute_sql

ALTER TABLE barbers
  ADD COLUMN IF NOT EXISTS service_durations JSONB NOT NULL DEFAULT '{}'::jsonb;
