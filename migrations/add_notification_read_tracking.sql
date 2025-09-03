-- Migration: Add read tracking fields to notifications table
-- Created: 2025-01-27
-- Description: Adds columns for tracking when users have read notifications

-- Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for efficient querying of unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications (user_id, is_read) 
WHERE is_read = FALSE;

-- Create index for read_at timestamp queries
CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
ON notifications (read_at) 
WHERE read_at IS NOT NULL;

-- Update existing notifications to set user_id if null
-- This assumes you have a way to determine the user for existing notifications
-- You may need to customize this based on your notification structure
UPDATE notifications 
SET user_id = COALESCE(user_id, 'system')
WHERE user_id IS NULL;

-- Add a comment to the table
COMMENT ON COLUMN notifications.is_read IS 'Indicates whether the notification has been read by the user';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when the notification was marked as read';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who owns this notification';
