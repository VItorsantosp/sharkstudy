import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; 
import { Plus } from 'lucide-react';

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
  const [profile, setProfile] = useState(null); // Armazena o nome vindo da tabela 'profiles'
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // --- Estados de Modais ---
  const [readingBook, setReadingBook] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // 1. Ciclo de Vida: Monitorizar Sessão e Dados do Perfil
  useEffect(() => {
    fetchBooks();

    // Verificar sessão inicial
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    };

    checkSession();

    // Escutar mudanças no login/logout
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

  // 2. Procurar Nome/Perfil na tabela 'profiles'
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  // 3. Função para atualizar o nome do utilizador
  const handleUpdateName = async (newName) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id);

    if (!error) {
      setProfile({ ...profile, full_name: newName });
    }
  };

  // 4. Carregamento de Livros
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 5. Filtros
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
      
      {/* Sidebar com Gestão de Perfil */}
      <Sidebar 
        user={user}
        profile={profile}
        onUpdateName={handleUpdateName}
        onLogout={handleLogout}
        onLoginClick={() => setIsAuthOpen(true)}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        activeDifficulty={activeDifficulty} setActiveDifficulty={setActiveDifficulty}
      />

      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight font-serif mb-2">Acervo Digital</h2>
              <p className="text-gray-400">
                Olá, <span className="text-blue-400">{profile?.full_name || 'Estudante'}</span>. Explorando {filteredBooks.length} obras.
              </p>
            </div>
            
            <button 
              onClick={() => user ? setIsUploadOpen(true) : setIsAuthOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              Adicionar Material
            </button>
          </header>

          {/* Grid de Livros */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-96 bg-gray-800/40 rounded-2xl border border-gray-800" />)}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={{ ...book, category: book.categories?.name }} 
                  onReadClick={setReadingBook} 
                />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border-2 border-dashed border-gray-800/80 rounded-2xl bg-gray-900/20 text-gray-400">
              Nenhum material encontrado.
            </div>
          )}
        </div>
      </main>

      {/* --- Modais --- */}
      
      {/* Leitor + Chat + Progresso */}
      {readingBook && (
        <PDFReaderModal 
          book={readingBook} 
          user={user} 
          profile={profile}
          onClose={() => setReadingBook(null)} 
        />
      )}

      {isUploadOpen && user && (
        <UploadModal onClose={() => setIsUploadOpen(false)} />
      )}

      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}

    </div>
  );
}

export default App;