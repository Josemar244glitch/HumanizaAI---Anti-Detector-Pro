
import { createClient } from '@supabase/supabase-js';

// Função utilitária para validar se uma string de configuração é real e não um placeholder
const isValidConfig = (val: string | undefined): boolean => {
  if (!val) return false;
  const v = val.trim();
  return v.length > 10 && !v.includes('PLACEHOLDER') && v !== 'undefined' && v !== 'null';
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Inicializa o cliente apenas se as configurações forem válidas, evitando o erro "supabaseUrl is required"
export const supabase = (isValidConfig(supabaseUrl) && isValidConfig(supabaseAnonKey)) 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

/**
 * Verifica se o Supabase está configurado e operacional
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

/**
 * Tenta salvar na nuvem se o serviço estiver disponível
 */
export const saveToCloud = async (userId: string, original: string, humanized: string, mode: string) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('humanization_history')
      .insert([{ 
        user_id: userId, 
        original_text: original, 
        humanized_text: humanized, 
        mode,
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Falha na sincronização em nuvem:', e);
    return null;
  }
};
