// src/config/supabase.js

const SUPABASE_URL = 'https://pkokrgpxcqaxmhzgggev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2tyZ3B4Y3FheG1oemdnZ2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTg4ODksImV4cCI6MjA3NzA3NDg4OX0.yaqn0EcSQTLiCYDTqEq5UtJnkSzN5Zh9t3hkTXozGQM';

export const supabase = {
  from: (table) => ({
    select: async (columns = '*') => {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    insert: async (values) => {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(values)
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data };
      } catch (error) {
        return { data: null, error };
      }
    },
    
    update: async (values) => ({
      eq: async (column, value) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(values)
          });
          const data = await response.json();
          return { data, error: response.ok ? null : data };
        } catch (error) {
          return { data: null, error };
        }
      }
    })
  })
};