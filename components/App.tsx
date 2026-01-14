
import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import ModeSelector from './ModeSelector';
import Login from './Login';
import CameraView from './CameraView';
import { AppMode, GroundingSource } from '../types';
import { humanizeText, searchWithGoogle, detectAI, extractTextFromImage, AIDetectionResult } from '../services/geminiService';
import { MODES } from '../constants';
import { authService, isSupabaseConfigured } from '../services/supabaseClient';
import { dbService, HistoryItem } from '../services/dbService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.UNI_STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const [pdfImage, setPdfImage] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfConverterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('humaniza_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (isSupabaseConfigured()) {
      authService.getSession().then((session) => {
        if (session?.user) setUser(session.user);
      });

      const { unsubscribe } = authService.onAuthStateChange(setUser);

      return () => unsubscribe();
    } else {
      const localUser = localStorage.getItem('humaniza_local_user');
      if (localUser) setUser(JSON.parse(localUser));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('humaniza_theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await authService.signOut();
    }
    localStorage.removeItem('humaniza_local_user');
    setUser(null);
    setHistory([]);
  };

  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    const data = await dbService.getHistory(user.id);
    setHistory(data);
    setIsLoadingHistory(false);
  };

  const openHistory = () => {
    setIsHistoryOpen(true);
    loadHistory();
  };

  const handleDeleteItem = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    if (!confirm("Excluir este registro permanentemente?")) return;
    if (item.id === undefined) return;
    const success = await dbService.deleteItem(item.id, item.cloud_id);
    if (success) setHistory(prev => prev.filter(i => i.id !== item.id));
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (!confirm("Deseja apagar todo o seu histórico de processamento?")) return;
    const success = await dbService.clearAll(user.id);
    if (success) setHistory([]);
  };

  const handleProcessAction = async () => {
    if (!inputText.trim()) {
      setError("Por favor, insira o texto para processamento.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setDetectionResult(null);
    setSources([]);
    
    try {
      if (activeMode === AppMode.SEARCH) {
        const result = await searchWithGoogle(inputText);
        setOutputText(result.text);
        setSources(result.sources);
      } else {
        const result = await humanizeText(inputText, activeMode);
        setOutputText(result.text);
        setSources(result.sources);
        
        if (user) {
          await dbService.saveRecord(user.id, inputText, result.text, activeMode);
          if (isHistoryOpen) loadHistory();
        }
      }
    } catch (err: any) {
      setError(err.message || "Falha técnica no motor da IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setInputText(item.original_text);
    setOutputText(item.humanized_text);
    setActiveMode(item.mode as AppMode);
    setSources([]);
    setIsHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDetectAI = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setDetectionResult(null);
    try {
      const result = await detectAI(inputText);
      setDetectionResult(result);
    } catch (err: any) {
      setError("Erro no diagnóstico de probabilidade.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await (window as any).pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          setInputText(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else if (name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer: e.target?.result });
          setInputText(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setInputText(e.target?.result as string);
        reader.readAsText(file);
      }
    } catch (err) {
      setError("Erro ao ler o documento.");
    }
  };
  
  const processImageForOcr = async (base64: string, mimeType: string) => {
      setIsExtracting(true);
      setImagePreview(base64);
      try {
        const extracted = await extractTextFromImage(base64, mimeType);
        setInputText(extracted);
      } catch (err: any) {
        setError("Erro no reconhecimento de caracteres (OCR).");
      } finally {
        setIsExtracting(false);
      }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      await processImageForOcr(base64, file.type);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCameraCapture = async (base64: string) => {
      setIsCameraOpen(false);
      await processImageForOcr(base64, 'image/jpeg');
  };

  const generatePdf = async () => {
    if (!pdfImage) return;
    setIsPdfGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      const img = new Image();
      img.src = pdfImage;
      await new Promise((resolve) => { img.onload = resolve; });
      const imgWidth = 190;
      const imgHeight = (img.height * imgWidth) / img.width;
      doc.addImage(pdfImage, 'JPEG', 10, 10, imgWidth, imgHeight);
      doc.save(`humaniza-documento-${Date.now()}.pdf`);
    } catch (err) {
      setError("Erro ao gerar PDF.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };
  
  const isSearchMode = activeMode === AppMode.SEARCH;
  
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen flex flex-col transition-all duration-700 bg-white dark:bg-[#020617] relative">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        user={user.email} 
        onLogout={handleLogout}
        onOpenHistory={openHistory}
      />
      
      {isCameraOpen && <CameraView onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />}


      {/* Painel Lateral de Histórico */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsHistoryOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-3xl transition-transform duration-500 transform ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-xl font-black font-header dark:text-white uppercase tracking-tighter">Fluxo de Atividade</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isSupabaseConfigured() ? 'Cloud Sync Ativo' : 'Banco de Dados Local (Dexie)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                >
                  Limpar Tudo
                </button>
              )}
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Acessando registros neurais...</p>
              </div>
            ) : history.length > 0 ? (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => restoreFromHistory(item)}
                  className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group bg-white dark:bg-slate-900/50 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                      {MODES.find(m => m.id === item.mode)?.label || item.mode}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteItem(e, item)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic leading-relaxed">"{item.original_text}"</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-500">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-8 py-10 md:py-16 animate-fade-in">
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-[0.3em] mb-8 animate-slide-up shadow-sm ring-1 ring-indigo-200/50">
            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
            Neural Linguistic Core v3.0
          </div>
          <h2 className="text-5xl md:text-8xl font-black font-header text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9] animate-slide-up">
            Eleve seu Texto ao <br className="hidden sm:block" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Padrão Humano</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed animate-slide-up [animation-delay:200ms]">
            A vanguarda da tecnologia para converter textos de IA em prosa autêntica, superando os mais avançados detectores do mercado.
          </p>
        </section>

        <ModeSelector activeMode={activeMode} onSelect={setActiveMode} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 items-stretch">
          {/* Painel de Entrada */}
          <div className="flex flex-col h-full">
            <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden flex flex-col flex-1">
              <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-xl">
                <div className="flex gap-2 bg-slate-200/50 dark:bg-slate-800 p-1 rounded-2xl">
                  <button onClick={() => fileInputRef.current?.click()} title="Importar Documento" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <button onClick={() => imageInputRef.current?.click()} title="OCR de Imagem" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </button>
                   <button onClick={() => setIsCameraOpen(true)} title="Escanear com Câmera" className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {!isSearchMode && (
                   <button 
                     onClick={handleDetectAI} 
                     disabled={isAnalyzing || !inputText.trim()} 
                     className="px-5 py-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all disabled:opacity-30 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                   >
                     {isAnalyzing ? (
                       <>
                         <div className="w-4 h-4 border-2 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin"></div>
                         Analisando...
                       </>
                     ) : (
                       'Verificar Texto IA'
                     )}
                   </button>
                )}
              </div>
              <div className="relative flex-1 min-h-[500px]">
                {isExtracting && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6 shadow-2xl shadow-indigo-500/50" />
                    <p className="font-black uppercase tracking-widest text-sm">Escaneando OCR...</p>
                  </div>
                )}
                {imagePreview && !isExtracting && (
                  <div className="absolute top-4 right-4 w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-indigo-500 shadow-2xl z-10 overflow-hidden group">
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <button onClick={() => setImagePreview(null)} className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                    </button>
                  </div>
                )}
                <textarea 
                  className="w-full h-full p-6 md:p-10 bg-[#0a0f1e] text-slate-100 font-mono text-base md:text-lg leading-relaxed resize-none focus:outline-none placeholder:text-slate-700" 
                  placeholder={isSearchMode ? "Digite sua pergunta para pesquisar no Google..." : "Cole aqui o texto gerado pela IA..."} 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                />
              </div>
              <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <button onClick={() => setInputText('')} className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all tracking-widest">Resetar</button>
                <button 
                  onClick={handleProcessAction} 
                  disabled={isLoading || !inputText.trim()} 
                  className={`px-12 py-5 rounded-2xl font-black text-xs uppercase text-white shadow-3xl transition-all active:scale-95 ${isLoading ? 'bg-slate-200' : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500 hover:-translate-y-1'}`}
                >
                  {isLoading ? (isSearchMode ? 'Pesquisando...' : 'Neural Engine Ativo...') : (isSearchMode ? 'Pesquisar Agora' : 'Humanizar Agora')}
                </button>
              </div>
            </div>
          </div>

          {/* Painel de Saída */}
          <div className="flex flex-col h-full">
            <div className={`bg-white dark:bg-slate-900 rounded-[3rem] border overflow-hidden flex flex-col flex-1 transition-all duration-700 ${outputText ? 'border-indigo-500 shadow-3xl shadow-indigo-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-xl flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                  {isSearchMode ? "Resumo da Pesquisa" : "Resultado Indetectável"}
                </span>
                {outputText && (
                  <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-fade-in">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Verificado
                  </div>
                )}
              </div>
              <div className="relative flex-1 min-h-[500px]">
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-12 text-center text-white">
                    <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 shadow-2xl shadow-indigo-500/50" />
                    <h4 className="text-3xl font-black mb-4 tracking-tighter">{isSearchMode ? 'Consultando a Web...' : 'Processando Linguística...'}</h4>
                    <p className="text-slate-400 text-lg max-w-[300px] italic leading-relaxed">
                      {isSearchMode ? 'Analisando e compilando as melhores fontes.' : 'Quebrando padrões sintáticos e injetando variabilidade humana.'}
                    </p>
                  </div>
                )}
                <textarea readOnly className={`w-full h-full p-6 md:p-10 bg-[#0a0f1e] text-slate-100 font-mono text-base md:text-lg leading-relaxed resize-none focus:outline-none ${!outputText ? 'hidden' : 'block animate-fade-in'}`} value={outputText} />
                {!outputText && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 opacity-20 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <p className="text-sm font-black uppercase tracking-[0.5em]">Aguardando Processamento</p>
                  </div>
                )}
              </div>
              {outputText && (
                <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    onClick={copyToClipboard} 
                    className={`px-10 py-5 rounded-2xl font-black text-xs uppercase border-2 transition-all active:scale-95 ${copyStatus === 'copied' ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/40' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow-xl'}`}
                  >
                    {copyStatus === 'copied' ? 'Copiado com Sucesso' : 'Copiar Texto Final'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fontes da Pesquisa */}
        {sources.length > 0 && (
          <div className="mb-20 animate-slide-up">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800">
              <h4 className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs mb-6 tracking-[0.4em] flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Fontes da Pesquisa Utilizadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sources.map((source, index) => source.web && (
                  <a href={source.web.uri} target="_blank" rel="noopener noreferrer" key={index} className="block p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all group">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate mb-1 group-hover:text-indigo-600">{source.web.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{source.web.uri}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resultados do Diagnóstico AI */}
        {detectionResult && (
          <div className="mb-20 animate-slide-up">
            <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 border border-indigo-500/30 shadow-3xl text-white flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-slate-800 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                <span className="text-3xl md:text-4xl font-black">{detectionResult.score}%</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-indigo-400 font-black uppercase text-xs mb-2 tracking-[0.4em]">Diagnóstico de Probabilidade</h4>
                <h3 className="text-3xl font-black mb-4">Conteúdo {detectionResult.label}</h3>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{detectionResult.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Painel de Ferramentas Studio */}
        <section className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-[3.5rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center gap-16 shadow-3xl relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"></div>
          <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-4xl md:text-6xl font-black font-header mb-6 tracking-tighter">Estúdio de Exportação</h3>
            <p className="text-indigo-100 mb-12 text-xl max-w-xl leading-relaxed">Workflow integrado para digitalização de documentos físicos e conversão para PDF humanizado.</p>
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <button onClick={() => pdfConverterInputRef.current?.click()} className="px-10 py-5 bg-white text-indigo-700 font-black text-xs uppercase rounded-2xl shadow-2xl hover:-translate-y-2 transition-all">Importar Documento</button>
              {pdfImage && (
                <button onClick={generatePdf} disabled={isPdfGenerating} className="px-10 py-5 bg-indigo-950/50 text-white border border-white/20 font-black text-xs uppercase rounded-2xl hover:bg-indigo-950 transition-all shadow-xl">
                  {isPdfGenerating ? 'Finalizando...' : 'Gerar PDF Assinado'}
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
              <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <input type="file" ref={pdfConverterInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setPdfImage(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }} className="hidden" accept="image/*" />
            </div>
          </div>
          <div className="w-full max-w-xs aspect-[3/4.5] bg-white/5 border-2 border-dashed border-white/20 rounded-[3rem] overflow-hidden flex items-center justify-center group shadow-inner">
            {pdfImage ? (
              <img src={pdfImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            ) : (
              <div className="text-center opacity-30 px-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="font-black text-[10px] uppercase tracking-[0.4em]">Preview Digital</p>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="fixed bottom-6 inset-x-4 sm:bottom-12 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-xl sm:inset-x-auto z-[300] bg-red-600 text-white px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-full shadow-[0_20px_60px_rgba(220,38,38,0.5)] flex items-center gap-4 animate-slide-up">
            <span className="font-black text-xs uppercase tracking-widest flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-4 group cursor-pointer mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h3 className="text-2xl font-extrabold font-header text-slate-900 dark:text-white tracking-tight">HumanizaAI Pro</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                Criador: <span className="font-bold text-indigo-600 dark:text-indigo-400">José Bonifácio</span>
            </p>
            <div className="px-6 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    © 2025 Neural Core Systems
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
