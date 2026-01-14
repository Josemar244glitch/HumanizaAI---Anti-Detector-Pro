
import React, { useState } from 'react';

interface ApiKeySetupProps {
  onApiKeySet: (key: string) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    // Simula uma validação/salvamento rápido
    setTimeout(() => {
      onApiKeySet(apiKey);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-[#020617] animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full"></div>
      </div>
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl md:rounded-[4rem] shadow-premium border border-slate-200 dark:border-slate-800 transition-all duration-500 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl font-black font-header dark:text-white tracking-tighter">
          Configurar API Key
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-base sm:text-lg font-medium max-w-md mx-auto">
          Para utilizar os recursos de IA, por favor, insira sua chave de API do Google Gemini.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Sua chave é armazenada apenas no seu navegador e nunca é enviada para nossos servidores.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <input 
              type="password" 
              required
              className="w-full text-center px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400 text-sm"
              placeholder="Cole sua API Key aqui"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Salvar e Continuar'}
          </button>
        </form>
        <p className="mt-8">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-400 text-sm font-bold transition-colors"
          >
            Obtenha sua API Key no Google AI Studio &rarr;
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;
