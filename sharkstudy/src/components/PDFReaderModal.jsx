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
  const [scale, setScale] = useState(1.1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showChat, setShowChat] = useState(true);

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

  // Salvar progresso (Upsert)
  const saveProgress = useCallback(async (newPage) => {
    if (!user) return;
    setIsSyncing(true);
    await supabase.from('user_progress').upsert({ 
      user_id: user.id, 
      book_id: book.id, 
      last_page: newPage,
      updated_at: new Date()
    }, { onConflict: 'user_id, book_id' });
    setTimeout(() => setIsSyncing(false), 600);
  }, [book.id, user]);

  const changePage = (offset) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
      saveProgress(newPage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shadow-xl z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full transition-all">
            <X size={18} />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-gray-100 font-serif leading-none mb-1">{book.title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{book.author}</span>
              {isSyncing && (
                <span className="flex items-center gap-1 text-[9px] text-blue-400 font-bold animate-pulse">
                  <Loader2 size={10} className="animate-spin" /> SALVO
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-1.5 text-gray-400 hover:text-white"><ZoomOut size={16} /></button>
            <span className="text-[10px] text-gray-300 font-black w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.2, 2.0))} className="p-1.5 text-gray-400 hover:text-white"><ZoomIn size={16} /></button>
          </div>

          {/* Toggle Chat */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2.5 rounded-xl transition-all ${showChat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT (PDF + CHAT) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PDF Area */}
        <main className="flex-1 overflow-auto flex justify-center p-6 bg-[#121212] custom-scrollbar">
          <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <Document 
              file={book.file_url} 
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="flex items-center justify-center h-full text-gray-600 font-serif animate-pulse">Desdobrando páginas...</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true} 
                renderAnnotationLayer={true}
                className="rounded-sm overflow-hidden"
              />
            </Document>
          </div>
        </main>

        {/* Chat Sidebar */}
        {showChat && <BookChat bookId={book.id} user={user} profile={profile} />}
      </div>

      {/* FOOTER NAVIGATION */}
      <footer className="flex items-center justify-center gap-10 py-4 bg-gray-900 border-t border-gray-800 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <button 
          onClick={() => changePage(-1)} 
          disabled={pageNumber <= 1}
          className="group flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-10 transition-all"
        >
          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700"><ChevronLeft size={18} /></div>
          ANTERIOR
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-600 font-black tracking-[0.2em] mb-1">PROGRESSO</span>
          <div className="text-sm font-serif text-white flex items-center gap-2">
            <span className="text-blue-400 font-bold">{pageNumber}</span>
            <span className="text-gray-700">/</span>
            <span>{numPages || '...'}</span>
          </div>
        </div>

        <button 
          onClick={() => changePage(1)} 
          disabled={pageNumber >= numPages}
          className="group flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-10 transition-all"
        >
          PRÓXIMA
          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700"><ChevronRight size={18} /></div>
        </button>
      </footer>
    </div>
  );
}