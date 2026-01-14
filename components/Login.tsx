
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Se o Supabase não estiver configurado, funciona como ferramenta local de alta performance
    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        const localUser = { email: email || 'usuario@local.pro', id: 'local-user-id' };
        localStorage.setItem('humaniza_local_user', JSON.stringify(localUser));
        onLogin(localUser);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) onLogin(data.user);
      } else {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Cadastro realizado! Verifique sua caixa de entrada para confirmar o e-mail.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured()) {
      setErrorMsg("O login social requer configuração Cloud (Supabase).");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || `Erro ao entrar com ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-[#020617] animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4rem] shadow-premium border border-slate-200 dark:border-slate-800 transition-all duration-500 relative z-10">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30 mx-auto mb-8 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black font-header dark:text-white tracking-tighter">
            {isLogin ? 'HumanizaAI Pro' : 'Crie sua Conta'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-base font-medium">
            A elite da inteligência linguística.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase rounded-2xl text-center tracking-widest">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Credencial de E-mail</label>
            <input 
              type="email" 
              required
              className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
              placeholder="exemplo@servidor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Senha Segura</label>
            <input 
              type="password" 
              required
              className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isLogin ? 'Iniciar Sessão' : 'Cadastrar Perfil')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            {isLogin ? 'Novo por aqui? Criar conta' : 'Já possui conta? Entrar'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
