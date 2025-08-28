const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Client for public operations (client-side)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Service client for admin operations (server-side only)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabaseClient,
  supabaseService,
  supabaseUrl
};
