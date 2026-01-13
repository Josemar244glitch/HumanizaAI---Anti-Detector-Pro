
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ModeSelector from './components/ModeSelector';
import Login from './components/Login';
import { HumanizationMode } from './types';
import { humanizeText, detectAI, extractTextFromImage, AIDetectionResult } from './services/geminiService';
import { MODES } from './constants';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [activeMode, setActiveMode] = useState<HumanizationMode>(HumanizationMode.UNI_STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<string | null>(localStorage.getItem('humaniza_user'));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('humaniza_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('humaniza_theme', 'light');
    }
  };

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('humaniza_user', email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('humaniza_user');
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      setError("Por favor, forneça o texto original para processamento.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setDetectionResult(null);
    try {
      const result = await humanizeText(inputText, activeMode);
      setOutputText(result);
    } catch (err: any) {
      setError(err.message || "Falha técnica inesperada no servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectAI = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await detectAI(inputText);
      setDetectionResult(result);
    } catch (err: any) {
      setError("Não foi possível analisar os padrões do texto no momento.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.pdf')) {
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
      } else if (fileName.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
          setInputText(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => setInputText(e.target?.result as string);
        reader.readAsText(file);
      } else {
        setError("O formato desse arquivo não é suportado pelo nosso sistema.");
      }
    } catch (err) {
      setError("Erro crítico ao processar os dados do arquivo selecionado.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsExtracting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      
      try {
        const extracted = await extractTextFromImage(base64, file.type);
        setInputText(extracted);
      } catch (err: any) {
        setError("Erro na detecção óptica de caracteres (OCR).");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handlePdfConverterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPdfImage(e.target?.result as string);
    reader.readAsDataURL(file);
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
      doc.save(`humaniza-converted-${Date.now()}.pdf`);
    } catch (err) {
      setError("Não conseguimos exportar seu PDF. Tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const clearText = () => {
    setInputText('');
    setOutputText('');
    setError(null);
    setDetectionResult(null);
    setImagePreview(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const currentModeConfig = MODES.find(m => m.id === activeMode);

  return (
    <div className="min-h-screen flex flex-col transition-all duration-700 bg-white dark:bg-[#020617]">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-12 animate-fade-in">
        {/* Intro */}
        <section className="text-center mb-8 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 animate-slide-up shadow-sm ring-1 ring-indigo-200/50 dark:ring-indigo-800/50">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
            Advanced Linguistic Rewriter
          </div>
          <h2 className="text-3xl md:text-6xl font-black font-header text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tighter leading-tight md:leading-[1.1] animate-slide-up [animation-delay:100ms]">
            Linguagem Humana <br className="hidden sm:block" /> 
            Sem Rastros de <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">IA</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-xl max-w-3xl mx-auto px-2 md:px-4 leading-relaxed animate-slide-up [animation-delay:200ms]">
            Humanize ensaios, artigos e e-mails instantaneamente. Nossa tecnologia neutraliza padrões robóticos para aprovação em qualquer detector.
          </p>
        </section>

        <div className="animate-slide-up [animation-delay:300ms]">
          <ModeSelector activeMode={activeMode} onSelect={setActiveMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch mb-12 md:mb-16 relative">
          {/* Main Input Card */}
          <div className="flex flex-col h-full animate-slide-up [animation-delay:400ms]">
            <div className="relative group bg-white dark:bg-slate-900/50 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-premium dark:shadow-premium-dark overflow-hidden flex flex-col flex-1 transition-all duration-500 hover:border-indigo-400/30">
              
              {/* Toolbar - Optimized for Mobile */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-md gap-3">
                <div className="flex items-center gap-2">
                   <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:scale-90" title="Upload Doc">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4.5 md:w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button onClick={() => imageInputRef.current?.click()} className="p-2.5 md:p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:scale-90" title="Extrair de Foto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-4.5 md:w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
                   <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                    onClick={handleDetectAI}
                    disabled={isAnalyzing || !inputText.trim()}
                    className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg border transition-all active:scale-95 ${isAnalyzing ? 'animate-pulse text-indigo-400 border-indigo-200' : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600'}`}
                  >
                    Detector IA
                  </button>
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-mono tracking-tighter bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{inputText.length}</span>
                </div>
              </div>

              {/* Text Area Wrap - Mobile Friendly */}
              <div className="relative flex-1 editor-container min-h-[350px] md:min-h-[500px]">
                {isExtracting && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-6 md:p-10 text-center animate-fade-in">
                     <div className="relative w-full max-w-sm h-1 bg-slate-800 rounded-full mb-6 md:mb-8 overflow-hidden shadow-2xl shadow-indigo-500/10">
                        <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan w-[40%] shadow-[0_0_20px_rgba(99,102,241,1)]"></div>
                     </div>
                     <p className="text-white text-base md:text-lg font-bold tracking-tight animate-pulse">OCR em Ação...</p>
                     <p className="text-slate-400 text-[10px] md:text-sm mt-2">Processando texto através de visão computacional...</p>
                  </div>
                )}
                
                {imagePreview && !isExtracting && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 w-16 h-16 md:w-28 md:h-28 rounded-xl md:rounded-2xl border-2 border-indigo-500/50 overflow-hidden shadow-2xl z-10 animate-fade-in transition-all duration-500 md:hover:scale-[2.5] hover:shadow-indigo-500/20 origin-top-right group/preview">
                    <img src={imagePreview} alt="FOTO" className="w-full h-full object-cover filter saturate-[0.8]" />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="absolute top-0 right-0 p-1.5 bg-red-600/90 text-white rounded-bl-xl opacity-100 md:opacity-0 group-hover/preview:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                )}

                <textarea
                  className="w-full h-full p-5 md:p-8 bg-[#0a0f1e] text-slate-100 font-mono text-xs md:text-base leading-relaxed resize-none focus:outline-none placeholder:text-slate-700 selection:bg-indigo-500/30 transition-all duration-300 min-h-[350px]"
                  placeholder="Cole aqui o texto da IA..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              {/* Detection Summary - Mobile Adaptive */}
              {detectionResult && (
                <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                   <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${detectionResult.score > 70 ? 'bg-red-500 shadow-red-500/20' : detectionResult.score > 30 ? 'bg-orange-500 shadow-orange-500/20' : 'bg-green-500 shadow-green-500/20'}`}></div>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Probabilidade IA: <span className="text-slate-900 dark:text-white">{detectionResult.score}%</span></span>
                   </div>
                   <p className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-widest line-clamp-1">{detectionResult.reasoning}</p>
                </div>
              )}

              {/* Footer CTA */}
              <div className="p-4 md:p-6 flex justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button onClick={clearText} className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Limpar</button>
                <button
                  onClick={handleHumanize}
                  disabled={isLoading || !inputText.trim()}
                  className={`relative group/hbtn px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-500 active:scale-95 ${isLoading ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 md:hover:-translate-y-1'}`}
                >
                  {isLoading ? 'Processando' : 'Humanizar'}
                </button>
              </div>
            </div>
          </div>

          {/* Output Card */}
          <div className="flex flex-col h-full animate-slide-up [animation-delay:500ms]">
            <div className={`bg-white dark:bg-slate-900/50 rounded-2xl md:rounded-[2rem] border shadow-premium dark:shadow-premium-dark overflow-hidden flex flex-col flex-1 relative transition-all duration-700 ${outputText ? 'border-indigo-500/40' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resultado</span>
                {outputText && (
                   <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                     <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                     100% Humano
                   </div>
                )}
              </div>
              
              <div className="relative flex-1 editor-container min-h-[300px] md:min-h-[500px]">
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-8 md:p-12 text-center animate-fade-in">
                    <div className="w-16 h-16 md:w-24 md:h-24 mb-6 relative">
                      <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-10 md:w-10 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    </div>
                    <h4 className="text-white text-xl md:text-2xl font-black font-header tracking-tighter mb-2">Humanizando...</h4>
                    <p className="text-slate-400 text-[10px] md:text-sm max-w-[280px] leading-relaxed italic">Injetando padrões de escrita humanos para ignorar detectores avançados.</p>
                  </div>
                )}

                {!outputText && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-30 select-none animate-pulse-slow">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px]">Aguardando Entrada</p>
                  </div>
                )}

                <textarea
                  readOnly
                  className={`w-full h-full p-5 md:p-8 bg-[#0a0f1e] text-slate-100 font-mono text-xs md:text-base leading-relaxed resize-none focus:outline-none selection:bg-indigo-500/30 transition-all duration-700 min-h-[300px] ${!outputText ? 'hidden' : 'block animate-fade-in'}`}
                  value={outputText}
                />
              </div>

              {outputText && (
                <div className="p-4 md:p-6 flex justify-end items-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 gap-4">
                  <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 md:px-8 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border-2 active:scale-95 ${copyStatus === 'copied' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:text-indigo-600'}`}
                  >
                    {copyStatus === 'copied' ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Error Bar */}
        {error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[90%] p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <span className="text-xs font-bold flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Tools Section - Mobile Stacked */}
        <section className="mb-12 md:mb-20 animate-slide-up [animation-delay:600ms]">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/40 dark:to-slate-900/10 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 p-6 md:p-12 shadow-premium dark:shadow-premium-dark flex flex-col md:flex-row items-center gap-8 md:gap-12 group/tool">
            <div className="flex-1 text-center md:text-left">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-inner transition-transform duration-500 mx-auto md:mx-0 group-hover/tool:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 md:mb-4 font-header tracking-tight">Image-to-PDF Studio</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed mb-6 md:mb-10 max-w-xl">
                Ferramenta utilitária para exportar digitalizações diretamente para PDF. Ideal para submissão de documentação humanizada.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  onClick={() => pdfConverterInputRef.current?.click()}
                  className="px-6 py-3.5 md:px-8 md:py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 shadow-xl active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Importar
                </button>
                <input type="file" ref={pdfConverterInputRef} onChange={handlePdfConverterUpload} className="hidden" accept="image/*" />
                
                {pdfImage && (
                  <button 
                    onClick={generatePdf}
                    disabled={isPdfGenerating}
                    className="px-6 py-3.5 md:px-8 md:py-4 bg-indigo-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 shadow-xl active:scale-95 animate-fade-in"
                  >
                    {isPdfGenerating ? 'Gerando...' : 'Baixar PDF'}
                  </button>
                )}
              </div>
            </div>

            <div className="w-full max-w-[280px] md:max-w-none md:w-80 aspect-square bg-slate-100 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative shadow-inner group/preview">
              {pdfImage ? (
                <>
                  <img src={pdfImage} alt="PDF PREVIEW" className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110" />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                    <button onClick={() => setPdfImage(null)} className="p-3 bg-red-600 text-white rounded-xl shadow-xl hover:bg-red-500 transition-all active:scale-90 text-[10px] font-bold">
                      Remover
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-premium flex items-center justify-center mb-3 md:mb-4 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Visualização</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Benefits Section - 3 cols on tablet+, 1 on mobile */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
           <div className="bg-white dark:bg-slate-900/50 p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 md:hover:-translate-y-2 group animate-slide-up [animation-delay:700ms]">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-transform group-hover:scale-110">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <h4 className="font-black text-slate-900 dark:text-white mb-3 md:mb-4 text-lg md:text-xl font-header tracking-tight">Soberania Linguística</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Garantia de aprovação institucional através da neutralização de vetores estatísticos robóticos.
             </p>
           </div>
           
           <div className="bg-white dark:bg-slate-900/50 p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 md:hover:-translate-y-2 group animate-slide-up [animation-delay:800ms]">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-transform group-hover:scale-110">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
             </div>
             <h4 className="font-black text-slate-900 dark:text-white mb-3 md:mb-4 text-lg md:text-xl font-header tracking-tight">OCR Multimodal</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Extração instantânea de texto de capturas de tela e fotos com visão computacional avançada.
             </p>
           </div>

           <div className="bg-white dark:bg-slate-900/50 p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-500 md:hover:-translate-y-2 group animate-slide-up sm:col-span-2 md:col-span-1 [animation-delay:900ms]">
             <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-transform group-hover:scale-110">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h4 className="font-black text-slate-900 dark:text-white mb-3 md:mb-4 text-lg md:text-xl font-header tracking-tight">Privacidade Radical</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Processamento efêmero seguro para máxima conformidade com leis de dados. Seus dados não são persistidos.
             </p>
           </div>
        </section>
      </main>

      <footer className="py-12 md:py-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <span className="text-xs md:text-sm font-black font-header tracking-tight text-slate-900 dark:text-white uppercase">HumanizaAI</span>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-[8px] md:text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] mb-4">Crafted Excellence</p>
            <div className="px-5 py-2 md:px-6 md:py-2 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
               <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400">Criador: <span className="text-indigo-600 dark:text-indigo-400 font-black">José Bonifacio</span></span>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-[8px] md:text-[10px] mt-6 md:mt-8">
              © 2025 HumanizaAI Neural Systems. All intellectual property remains protected.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
