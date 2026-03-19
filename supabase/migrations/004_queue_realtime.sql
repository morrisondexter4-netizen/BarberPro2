-- Enable realtime for live queue status page
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
