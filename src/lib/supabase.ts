import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface VideoRecord {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  thumbnail_path: string | null;
  duration: number;
  file_size: number;
  share_id: string;
  user_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  status: 'processing' | 'ready' | 'failed';
  metadata: {
    client_name?: string;
    account_type?: string;
    tags?: string[];
  } | null;
}

export interface Comment {
  id: string;
  video_id: string;
  user_name: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  type: 'comment' | 'issue' | 'win' | 'action_item';
}
