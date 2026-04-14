import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function UploadModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category_id: '',
    difficulty: 'Iniciante',
    file: null
  });

  // 1. Carregar categorias do banco
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFormData({ ...formData, file: selectedFile });
      setError(null);
    } else {
      setError('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return setError('Selecione um arquivo!');

    try {
      setLoading(true);
      setError(null);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Você precisa estar logado para enviar.');

      // --- PASSO 1: Limpar o nome do arquivo para evitar Erro 400 ---
      const fileExt = formData.file.name.split('.').pop();
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${cleanFileName}`;

      // --- PASSO 2: Upload para o Storage (Bucket 'pdfs') ---
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // --- PASSO 3: Obter a URL Pública ---
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      // --- PASSO 4: Salvar na Tabela 'books' ---
      const { error: dbError } = await supabase.from('books').insert({
        title: formData.title,
        author: formData.author,
        category_id: formData.category_id,
        difficulty_level: formData.difficulty,
        file_url: publicUrl,
        owner_id: user.id,
        status: 'approved' // Definimos como aprovado direto para teste
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Recarrega para mostrar o novo livro
      }, 2000);

    } catch (err) {
      console.error('Erro no Upload:', err);
      setError(err.message || 'Erro ao enviar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-bold text-white font-serif">Enviar Material</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="py-10 text-center space-y-4">
              <div className="flex justify-center text-green-500"><CheckCircle size={60} /></div>
              <p className="text-white font-bold">Livro enviado com sucesso!</p>
              <p className="text-gray-500 text-sm">Atualizando o acervo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Título da Obra</label>
                <input 
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
                  placeholder="Ex: Dom Casmurro"
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Autor</label>
                  <input 
                    required
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
                    placeholder="Machado de Assis"
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Matéria</label>
                  <select 
                    required
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all text-sm appearance-none"
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">Selecionar...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Arquivo PDF</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`
                    w-full border-2 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center transition-all
                    ${formData.file ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 group-hover:border-gray-600 bg-gray-800/30'}
                  `}>
                    <Upload className={formData.file ? 'text-blue-400' : 'text-gray-600'} size={24} />
                    <p className="mt-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                      {formData.file ? formData.file.name : 'Clique ou arraste o PDF'}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button 
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalizar Upload'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}