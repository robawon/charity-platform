import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmkqbdntjvilkywtqdcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZta3FiZG50anZpbGt5d3RxZGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTIwNzQsImV4cCI6MjA4OTUyODA3NH0.xWJxvZUqpLVcEhUSra7lW9lQNfkQtHe_itW9-UiUjdE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;