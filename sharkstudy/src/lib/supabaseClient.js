import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Alterámos o final desta linha para corresponder ao seu .env:
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)