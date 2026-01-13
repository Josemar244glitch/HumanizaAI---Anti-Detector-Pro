
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
  
  // Estados para o Conversor de Imagem para PDF
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
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
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
      setError("Por favor, insira um texto para humanizar.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setDetectionResult(null);
    try {
      const result = await humanizeText(inputText, activeMode);
      setOutputText(result);
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
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
      setError(err.message);
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
        setError("Formato não suportado. Use PDF, DOCX ou TXT.");
      }
    } catch (err) {
      setError("Erro ao ler o arquivo.");
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
        setError(err.message);
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
    reader.onload = (e) => {
      setPdfImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generatePdf = async () => {
    if (!pdfImage) return;
    setIsPdfGenerating(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      
      // Carregar a imagem para obter dimensões
      const img = new Image();
      img.src = pdfImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = 190;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      doc.addImage(pdfImage, 'JPEG', 10, 10, imgWidth, imgHeight);
      doc.save(`conversao-humaniza-ai-${Date.now()}.pdf`);
    } catch (err) {
      setError("Erro ao gerar PDF.");
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentModeConfig = MODES.find(m => m.id === activeMode);

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 selection:bg-indigo-500 selection:text-white">
      <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 animate-fade-in">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold font-header text-slate-900 dark:text-white mb-4 tracking-tight">
            Remova o rastro da <span className="text-indigo-600 dark:text-indigo-400">IA</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto px-4">
            Transforme PDFs, Word, Imagens ou textos em narrativas humanas autênticas.
          </p>
        </div>

        <ModeSelector activeMode={activeMode} onSelect={setActiveMode} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-stretch mb-12">
          {/* Lado da Entrada */}
          <div className="flex flex-col h-full animate-slide-up">
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 relative">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-2">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Entrada</span>
                   
                   <div className="flex gap-1">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload PDF/Word"
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded text-[9px] md:text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      DOCS
                    </button>
                    
                    <button 
                      onClick={() => imageInputRef.current?.click()}
                      title="Analisar Foto"
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded text-[9px] md:text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      FOTO
                    </button>
                   </div>

                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
                   <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    onClick={handleDetectAI}
                    disabled={isAnalyzing || !inputText.trim()}
                    className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded flex items-center gap-1 transition-all ${isAnalyzing ? 'animate-pulse text-indigo-400' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                  >
                    🔍 ANALISAR IA
                  </button>
                  <span className="text-[9px] md:text-xs text-slate-400 font-medium">{inputText.length}</span>
                </div>
              </div>

              {detectionResult && (
                <div className={`p-3 md:p-4 border-b animate-slide-up ${detectionResult.score > 70 ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' : detectionResult.score > 30 ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30' : 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30'}`}>
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Detector de IA:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${detectionResult.score > 70 ? 'bg-red-200 text-red-800' : detectionResult.score > 30 ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                        {detectionResult.score}% ({detectionResult.label})
                      </span>
                   </div>
                   <p className="text-[10px] md:text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{detectionResult.reasoning}</p>
                </div>
              )}

              <div className="relative flex-1 group">
                {isExtracting && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8">
                     <div className="relative w-full max-w-xs h-1 bg-slate-700 overflow-hidden rounded-full mb-4">
                        <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 animate-[scan_2s_linear_infinite] w-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
                     </div>
                     <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Escaneando Imagem...</p>
                  </div>
                )}
                
                {imagePreview && !isExtracting && (
                  <div className="absolute top-4 right-4 w-24 h-24 rounded-lg border-2 border-indigo-500 overflow-hidden shadow-lg z-10 animate-fade-in group-hover:scale-150 transition-transform origin-top-right">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}

                <textarea
                  className="w-full h-full p-4 md:p-6 bg-slate-900 text-white dark:bg-slate-950 dark:text-white leading-relaxed resize-none focus:outline-none min-h-[300px] md:min-h-[450px] font-mono text-sm transition-opacity duration-300 placeholder:text-slate-600"
                  placeholder="Cole o texto ou escaneie uma foto (letras brancas)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <div className="p-3 md:p-4 flex justify-between items-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={clearText}
                  className="text-xs md:text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Limpar
                </button>
                <button
                  onClick={handleHumanize}
                  disabled={isLoading || !inputText.trim()}
                  className={`px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg text-xs md:text-base ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 text-white shadow-indigo-200 dark:shadow-none'}`}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : 'Humanizar'}
                </button>
              </div>
            </div>
          </div>

          {/* Lado do Resultado */}
          <div className="flex flex-col h-full mt-4 lg:mt-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden flex flex-col flex-1 relative transition-all duration-500 ${outputText ? `${currentModeConfig?.borderColor} dark:border-opacity-50 shadow-indigo-50 dark:shadow-none ring-2 ring-indigo-500/10` : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</span>
                {outputText && (
                   <div className="flex items-center gap-1.5 text-[9px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                     100% Humano
                   </div>
                )}
              </div>
              
              <div className="relative flex-1">
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Humanizando...</p>
                    <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">
                      Ajustando semântica, ritmo e removendo padrões de IA.
                    </p>
                  </div>
                )}

                {!outputText && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center opacity-40 animate-pulse-slow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic text-sm md:text-base tracking-wide">Aguardando processamento...</p>
                  </div>
                )}

                <textarea
                  readOnly
                  className={`w-full h-full p-4 md:p-6 bg-slate-900 text-white dark:bg-slate-950 dark:text-white leading-relaxed resize-none focus:outline-none min-h-[300px] md:min-h-[450px] font-mono text-sm transition-all duration-700 transform ${!outputText ? 'hidden' : 'block animate-fade-in'}`}
                  value={outputText}
                />
              </div>

              {outputText && (
                <div className="p-3 md:p-4 flex justify-end items-center bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 gap-2 md:gap-3">
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 border-2 text-xs md:text-sm transform active:scale-95 ${copyStatus === 'copied' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-400 shadow-sm'}`}
                  >
                    {copyStatus === 'copied' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 md:mt-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-slide-up">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-xs md:text-sm">{error}</span>
          </div>
        )}

        {/* Conversor de Imagem para PDF */}
        <section className="mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 font-header">Conversor de Imagem para PDF</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Transforme rapidamente qualquer imagem em um arquivo PDF profissional. Suporta JPG, PNG e outros formatos.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  onClick={() => pdfConverterInputRef.current?.click()}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Selecionar Imagem
                </button>
                <input 
                  type="file" 
                  ref={pdfConverterInputRef} 
                  onChange={handlePdfConverterUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
                
                {pdfImage && (
                  <button 
                    onClick={generatePdf}
                    disabled={isPdfGenerating}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    {isPdfGenerating ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Baixar PDF
                  </button>
                )}
              </div>
            </div>

            <div className="w-full md:w-64 h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative">
              {pdfImage ? (
                <img src={pdfImage} alt="Preview PDF" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Preview</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-12 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group animate-slide-up" style={{ animationDelay: '0.3s' }}>
             <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
               </svg>
             </div>
             <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm md:text-base">Humanização Pro</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Garante integridade da pesquisa removendo padrões robóticos detectáveis por algoritmos avançados.
             </p>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group animate-slide-up" style={{ animationDelay: '0.4s' }}>
             <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
               </svg>
             </div>
             <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm md:text-base">Análise de Foto</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Escaneie documentos físicos e converta em texto humano instantaneamente com nosso OCR integrado.
             </p>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group animate-slide-up sm:col-span-2 md:col-span-1" style={{ animationDelay: '0.5s' }}>
             <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm md:text-base">Privacidade Total</h4>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
               Seus dados são processados de forma segura e não são armazenados para treinamento de modelos.
             </p>
           </div>
        </section>
      </main>

      <footer className="mt-12 md:mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg font-header">HumanizaAI - Anti-Detector de ia Pro</h3>
              <p className="text-slate-400 text-xs mt-1">Linguagem natural, resultados profissionais.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest">
                Criador: <span className="text-indigo-600 dark:text-indigo-400">José Bonifacio</span>
              </p>
              <p className="text-slate-400 dark:text-slate-600 text-[10px]">
                © 2025 HumanizaAI. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
