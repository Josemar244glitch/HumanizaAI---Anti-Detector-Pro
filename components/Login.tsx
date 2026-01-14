
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
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setShowSignupSuccess(false);

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
        setShowSignupSuccess(true);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook') => {
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

        {showSignupSuccess && (
          <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-center flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <p className="text-xs font-bold leading-snug">Cadastro realizado! Verifique sua caixa de entrada para confirmar o e-mail.</p>
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

        <div className="my-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest">OU</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleSocialLogin('google')} disabled={loading} className="w-full flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.22 10.23c0-.62-.06-1.22-.16-1.81H12.04v3.42h5.16c-.22 1.11-.86 2.06-1.85 2.71v2.21h2.84c1.66-1.52 2.62-3.88 2.62-6.53Z" fill="#4285F4"></path><path d="M12.04 22c2.49 0 4.58-.83 6.1-2.23l-2.84-2.21c-.78.53-1.79.84-2.81.84-2.17 0-4-1.46-4.66-3.43H4.47v2.29C5.98 20.03 8.8 22 12.04 22Z" fill="#34A853"></path><path d="M7.38 14.71a4.811 4.811 0 0 1 0-3.43V8.99H4.47a7.027 7.027 0 0 0 0 6.02l2.91-2.3Z" fill="#FBBC04"></path><path d="M12.04 6.58c1.35 0 2.58.46 3.54 1.4l2.52-2.52C16.62 3.93 14.53 3 12.04 3 8.8 3 5.98 4.97 4.47 7.28l2.91 2.29c.66-1.97 2.49-3.43 4.66-3.43Z" fill="#EA4335"></path></svg>
            </button>
            <button onClick={() => handleSocialLogin('github')} disabled={loading} className="w-full flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              <svg className="h-6 w-6 text-slate-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.493.5.092.682-.217.682-.482 0-.237-.009-.865-.014-1.698-2.782.602-3.369-1.34-3.369-1.34-.455-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.089 2.91.833.091-.647.35-1.086.635-1.335-2.22-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.446-1.27.098-2.64 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.82c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.026 2.747-1.026.546 1.37.201 2.387.098 2.64.64.698 1.03 1.591 1.03 2.682 0 3.84-2.337 4.687-4.565 4.935.359.307.678.915.678 1.846 0 1.334-.012 2.41-.012 2.736 0 .267.18.577.688.48C19.135 20.165 22 16.418 22 12c0-5.523-4.477-10-10-10Z"></path></svg>
            </button>
            <button onClick={() => handleSocialLogin('facebook')} disabled={loading} className="w-full flex items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              <svg className="h-6 w-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V15.89H8.13V12.98h2.308V10.8c0-2.28 1.34-3.55 3.42-3.55 1.01 0 1.87.07 2.12.1v2.54h-1.49c-1.1 0-1.32.52-1.32 1.29v1.7h2.82l-.45 2.91h-2.37v6.009C18.343 21.128 22 16.991 22 12Z"></path></svg>
            </button>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setShowSignupSuccess(false);
            }}
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
