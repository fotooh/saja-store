// تهيئة Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = 'https://wysmbwfbhbpjosnidckn.supabase.co'; // استبدل برابط مشروعك
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5c21id2ZiaGJwam9zbmlkY2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk5NDQsImV4cCI6MjA3NDIxNTk0NH0.80EsRfc0BlV0xH6Hh_pJ9H4oV11t3Y8ioqmHf3zwxks'; // استبدل بمفتاح المشروع

// إنشاء عميل Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
