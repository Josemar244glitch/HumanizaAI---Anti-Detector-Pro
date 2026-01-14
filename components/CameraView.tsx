
import React, { useState, useRef, useEffect } from 'react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCapturedImage(null);
      setError(null);
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-lg flex flex-col items-center justify-center animate-fade-in">
      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="w-full max-w-4xl aspect-[4/3] bg-black rounded-3xl overflow-hidden relative shadow-2xl border-4 border-slate-800">
        {error && <div className="w-full h-full flex items-center justify-center text-red-400 p-8 text-center">{error}</div>}
        
        {!capturedImage ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="mt-8 flex items-center gap-6">
        {!capturedImage ? (
          <button onClick={handleCapture} disabled={!!error} className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-slate-500 disabled:opacity-50 group">
            <div className="w-20 h-20 bg-white rounded-full border-2 border-slate-800 group-hover:bg-indigo-200 transition-colors"></div>
          </button>
        ) : (
          <>
            <button onClick={handleRetake} className="px-10 py-5 rounded-2xl font-black text-xs uppercase text-white bg-white/10 hover:bg-white/20 transition-all">
              Tirar Outra
            </button>
            <button onClick={handleConfirm} className="px-12 py-5 rounded-2xl font-black text-xs uppercase bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all">
              Usar esta Foto
            </button>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
