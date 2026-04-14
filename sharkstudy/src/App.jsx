import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; 
import { Plus, Menu, X } from 'lucide-react';

// Componentes
import { Sidebar } from './components/Sidebar';
import { BookCard } from './components/BookCard';
import { PDFReaderModal } from './components/PDFReaderModal';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';

function App() {
  // --- Estados de Dados e Filtros ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeDifficulty, setActiveDifficulty] = useState('Qualquer');

  // --- Estados de Autenticação e Perfil ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // --- Estados de UI e Responsividade ---
  const [readingBook, setReadingBook] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Menu Mobile

  // 1. Monitorizar Sessão e Perfil
  useEffect(() => {
    fetchBooks();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile(session.user.id);
        setIsAuthOpen(false);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleUpdateName = async (newName) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', user.id);
    if (!error) setProfile({ ...profile, full_name: newName });
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*, categories(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Filtros Dinâmicos
  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryName = book.categories?.name || 'Sem categoria';
    const matchesCategory = activeCategory === 'Todos' || categoryName === activeCategory;
    const matchesDifficulty = activeDifficulty === 'Qualquer' || book.difficulty_level === activeDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="flex min-h-screen bg-gray-950 font-sans relative">
      
      {/* Botão Hambúrguer para Mobile */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white shadow-2xl"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar (Responsiva) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        profile={profile}
        onUpdateName={handleUpdateName}
        onLogout={async () => await supabase.auth.signOut()}
        onLoginClick={() => setIsAuthOpen(true)}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        activeDifficulty={activeDifficulty} setActiveDifficulty={setActiveDifficulty}
      />

      {/* Overlay para Mobile (fecha a sidebar ao clicar fora) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-12 lg:pt-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-serif mb-2 text-center sm:text-left">
                Acervo Digital
              </h2>
              <p className="text-gray-400 text-sm text-center sm:text-left">
                Olá, <span className="text-blue-400 font-bold">{profile?.full_name || 'Estudante'}</span>.
              </p>
            </div>
            
            <button 
              onClick={() => user ? setIsUploadOpen(true) : setIsAuthOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 w-full sm:w-auto"
            >
              <Plus size={18} />
              Enviar PDF
            </button>
          </header>

          {/* Grid Responsivo */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-80 bg-gray-900/50 rounded-2xl animate-pulse border border-gray-800" />)}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={{ ...book, category: book.categories?.name }} 
                  onReadClick={setReadingBook} 
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20 text-gray-500">
              Nenhum material encontrado.
            </div>
          )}
        </div>
      </main>

      {/* --- Modais --- */}
      {readingBook && (
        <PDFReaderModal 
          book={readingBook} 
          user={user} 
          profile={profile}
          onClose={() => setReadingBook(null)} 
        />
      )}

      {isUploadOpen && user && <UploadModal onClose={() => setIsUploadOpen(false)} />}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}

    </div>
  );
}

export default App;