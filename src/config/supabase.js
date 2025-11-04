// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pkokrgpxcqaxmhzgggev.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2tyZ3B4Y3FheG1oemdnZ2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTg4ODksImV4cCI6MjA3NzA3NDg4OX0.yaqn0EcSQTLiCYDTqEq5UtJnkSzN5Zh9t3hkTXozGQM';

// Création du client Supabase officiel
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);