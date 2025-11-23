import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:9999';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon_example_key';

export const supabase = createClient(url, key);
