import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '../lib/supabaseClient';
import { BookChat } from './BookChat';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, MessageSquare } from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function PDFReaderModal({ book, user, profile, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(window.innerWidth < 768 ? 0.6 : 1.1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showChat, setShowChat] = useState(window.innerWidth > 1024); // Chat aberto só no PC por padrão

  // Carregar progresso salvo
  useEffect(() => {
    async function loadProgress() {
      if (!user) return;
      const { data } = await supabase
        .from('user_progress')
        .select('last_page')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .single();
      if (data) setPageNumber(data.last_page);
    }
    loadProgress();
  }, [book.id, user]);

  // Salvar progresso
  const saveProgress = useCallback(async (newPage) => {
    if (!user) return;
    setIsSyncing(true);
    await supabase.from('user_progress').upsert({ 
      user_id: user.id, 
      book_id: book.id, 
      last_page: newPage,
      updated_at: new Date()
    }, { onConflict: 'user_id, book_id' });
    setTimeout(() => setIsSyncing(false), 800);
  }, [book.id, user]);

  const changePage = (offset) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
      saveProgress(newPage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 overflow-hidden">
      
      {/* HEADER RESPONSIVO */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-all">
            <X size={18} />
          </button>
          <div className="max-w-[120px] md:max-w-xs">
            <h2 className="text-xs md:text-sm font-bold text-gray-100 truncate">{book.title}</h2>
            {isSyncing && (
              <span className="flex items-center gap-1 text-[9px] text-blue-400 font-bold animate-pulse uppercase tracking-tighter">
                Sincronizando...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Zoom - Escondido em telas muito pequenas para ganhar espaço */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.4))} className="p-1.5 text-gray-400"><ZoomOut size={16} /></button>
            <span className="text-[10px] text-gray-300 font-black w-8 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.2, 2.0))} className="p-1.5 text-gray-400"><ZoomIn size={16} /></button>
          </div>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2.5 rounded-xl transition-all ${showChat ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-800 text-gray-400'}`}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL (PDF + CHAT) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Visualizador de PDF */}
        <main className="flex-1 overflow-auto flex justify-center bg-[#0f0f0f] custom-scrollbar p-2 md:p-6">
          <div className="h-fit shadow-[0_0_60px_rgba(0,0,0,0.7)]">
            <Document 
              file={book.file_url} 
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="flex items-center justify-center mt-20 text-gray-600 animate-pulse font-serif">Iniciando leitura...</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                className="max-w-full"
                renderTextLayer={true} 
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </main>

        {/* Sidebar do Chat (Mobile Overlay / Desktop Side) */}
        {showChat && (
          <div className={`
            absolute lg:relative right-0 top-0 h-full z-30
            w-full sm:w-80 shadow-2xl transition-all duration-300
          `}>
            {/* Botão para fechar chat no Mobile */}
            <button 
              className="lg:hidden absolute top-4 right-4 z-40 p-2 bg-gray-800 rounded-full text-white"
              onClick={() => setShowChat(false)}
            >
              <X size={16} />
            </button>
            <BookChat bookId={book.id} user={user} profile={profile} />
          </div>
        )}
      </div>

      {/* FOOTER DE NAVEGAÇÃO RESPONSIVO */}
      <footer className="grid grid-cols-3 items-center px-4 py-3 bg-gray-900 border-t border-gray-800 shadow-2xl z-20">
        <button 
          onClick={() => changePage(-1)} 
          disabled={pageNumber <= 1}
          className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white disabled:opacity-5 transition-all"
        >
          <div className="p-2 bg-gray-800 rounded-lg"><ChevronLeft size={16} /></div>
          <span className="hidden sm:inline">ANTERIOR</span>
        </button>
        
        <div className="flex flex-col items-center">
          <div className="text-[11px] md:text-sm font-bold text-white bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <span className="text-blue-400">{pageNumber}</span>
            <span className="mx-1 text-gray-600">/</span>
            <span>{numPages || '...'}</span>
          </div>
        </div>

        <button 
          onClick={() => changePage(1)} 
          disabled={pageNumber >= numPages}
          className="flex items-center justify-end gap-2 text-[10px] font-bold text-gray-500 hover:text-white disabled:opacity-5 transition-all"
        >
          <span className="hidden sm:inline">PRÓXIMA</span>
          <div className="p-2 bg-gray-800 rounded-lg"><ChevronRight size={16} /></div>
        </button>
      </footer>
    </div>
  );
}