import React from 'react';
import { Star, Bookmark, BookOpen } from 'lucide-react';

export function BookCard({ book, onReadClick }) {
  return (
    <div className="group relative flex flex-col bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden hover:bg-gray-800/80 hover:border-gray-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300">
      
      {/* 1. Capa do Livro & Botões de Ação Superiores */}
      <div className="relative h-64 w-full bg-gray-900 overflow-hidden">
        <img 
          src={book.cover_url} 
          alt={`Capa do livro ${book.title}`}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
        
        {/* Badge de Status (Visível apenas se o livro estiver pendente de moderação) */}
        {book.status === 'pending' && (
          <span className="absolute top-3 left-3 bg-yellow-500/90 text-yellow-950 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
            Em Análise
          </span>
        )}
        
        {/* Botão de Favoritar (Guardar para depois) */}
        <button 
          className="absolute top-3 right-3 p-2 bg-gray-900/60 backdrop-blur-md rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Guardar nos Favoritos"
        >
          <Bookmark size={18} />
        </button>
      </div>

      {/* 2. Informações Principais */}
      <div className="flex flex-col flex-grow p-5">
        
        {/* Tags (Categoria e Nível) */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 rounded-md">
            {book.category || 'Sem categoria'}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-800 rounded-md">
            {book.difficulty_level || 'Geral'}
          </span>
        </div>

        {/* Título e Autor */}
        <h3 className="text-lg font-bold text-gray-100 leading-tight mb-1 line-clamp-2 font-serif" title={book.title}>
          {book.title}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-1" title={book.author}>
          {book.author}
        </p>

        {/* 3. Rodapé do Card (Avaliação e Botão de Leitura) */}
        <div className="mt-auto pt-4 border-t border-gray-700/50 flex items-center justify-between">
          
          {/* Estrelas */}
          <div className="flex items-center gap-1.5 text-yellow-500" title={`Avaliação: ${book.average_rating} de 5`}>
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-semibold text-gray-300">
              {Number(book.average_rating || 0).toFixed(1)}
            </span>
          </div>
          
          {/* Botão para abrir o Modal de Leitura */}
          <button 
            onClick={() => onReadClick(book)} 
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-blue-500/10"
          >
            <BookOpen size={16} />
            <span>Ler Agora</span>
          </button>
        </div>

      </div>
    </div>
  );
}