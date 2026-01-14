
import { createClient, Session, User, Provider, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

// Função utilitária para validar se uma string de configuração é real e não um placeholder
const isValidConfig = (val: string | undefined): boolean => {
  if (!val) return false;
  const v = val.trim();
  return v.length > 10 && !v.includes('PLACEHOLDER') && v !== 'undefined' && v !== 'null';
};

const supabaseUrl = 'https://lrbqvuwhhrsqyhxavfsd.supabase.co';
const supabaseAnonKey = 'sb_publishable_85nnAe0K8-ckIPi8OHlrjg_c9bTmBQ6';

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

/**
 * Gerencia a autenticação e o estado do usuário.
 */
export const authService = {
  /**
   * Obtém a sessão do usuário atual. O JWT é gerenciado automaticamente pelo Supabase.
   * @returns A sessão atual ou null.
   */
  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Escuta por mudanças no estado de autenticação (login, logout).
   * @param callback A função a ser chamada com o novo usuário (ou null).
   * @returns A inscrição para que possa ser cancelada.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return subscription;
  },

  /**
   * Realiza o login com email e senha.
   */
  async signInWithPassword(credentials: SignInWithPasswordCredentials) {
    if (!supabase) throw new Error("Supabase not configured.");
    return await supabase.auth.signInWithPassword(credentials);
  },
  
  /**
   * Realiza o cadastro com email e senha.
   */
  async signUp(credentials: SignUpWithPasswordCredentials) {
    if (!supabase) throw new Error("Supabase not configured.");
    return await supabase.auth.signUp(credentials);
  },

  /**
   * Realiza o login com um provedor OAuth (Google, GitHub, etc.).
   */
  async signInWithOAuth(provider: Provider) {
    if (!supabase) throw new Error("Supabase not configured.");
    return await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
  },
  
  /**
   * Realiza o logout do usuário.
   */
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }
};