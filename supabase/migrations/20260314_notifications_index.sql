-- Add index to speed notification queries filtered by user and ordered by created_at
create index if not exists idx_notifications_user_created on notifications(user_id, created_at desc);
