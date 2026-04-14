import React, { useState } from 'react';
import { 
  Search, BookMarked, Layers, GraduationCap, 
  LogOut, User, LogIn, Edit2, Check, X 
} from 'lucide-react';

const CATEGORIES = ['Todos', 'Matemática', 'Física', 'Biologia', 'História', 'Programação'];
const DIFFICULTIES = ['Qualquer', 'Iniciante', 'Intermediário', 'Avançado'];

export function Sidebar({ 
  user, profile, onUpdateName, onLogout, onLoginClick,
  searchTerm, setSearchTerm, activeCategory, setActiveCategory,
  activeDifficulty, setActiveDifficulty 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  const handleStartEdit = () => {
    setTempName(profile?.full_name || 'Estudante Shark');
    setIsEditing(true);
  };

  const handleSaveName = () => {
    onUpdateName(tempName);
    setIsEditing(false);
  };

  return (
    <aside className="w-72 bg-gray-900/80 border-r border-gray-800 h-screen sticky top-0 flex flex-col p-6 overflow-y-auto backdrop-blur-xl">
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 text-white">
        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
          <BookMarked size={22} strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold font-serif tracking-tight">SharkStudy</h1>
      </div>

      {/* Pesquisa */}
      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text" placeholder="Pesquisar obras..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 text-gray-200 text-sm rounded-xl pl-10 pr-4 py-3 outline-none border border-gray-700/50 focus:border-blue-500/50 focus:bg-gray-800 transition-all"
          />
        </div>
      </div>

      {/* Filtros de Matérias */}
      <div className="mb-8">
        <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <Layers size={14} /> Matérias
        </h2>
        <ul className="flex flex-col gap-1">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <button
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeCategory === category 
                    ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                }`}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Filtros de Nível */}
      <div className="mb-8">
        <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <GraduationCap size={14} /> Nível
        </h2>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setActiveDifficulty(diff)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeDifficulty === diff
                  ? 'bg-gray-700 text-white shadow-lg'
                  : 'bg-gray-800/30 text-gray-500 hover:text-gray-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* RODAPÉ: PERFIL EDITÁVEL */}
      <div className="mt-auto pt-6 border-t border-gray-800/60">
        {user ? (
          <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
                <User size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input 
                      autoFocus
                      className="bg-gray-900 text-white text-[11px] px-2 py-1 rounded border border-blue-500 outline-none w-full"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} className="text-green-500"><Check size={14} /></button>
                    <button onClick={() => setIsEditing(false)} className="text-red-500"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={handleStartEdit}>
                    <p className="text-xs font-bold text-gray-200 truncate">
                      {profile?.full_name || 'Estudante Shark'}
                    </p>
                    <Edit2 size={10} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all">
              <LogOut size={12} /> Sair da Conta
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <LogIn size={18} /> Acessar Conta
          </button>
        )}
      </div>
    </aside>
  );
}