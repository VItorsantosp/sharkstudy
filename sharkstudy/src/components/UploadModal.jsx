import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Mapeamento simples de IDs (ajuste de acordo com os IDs da sua tabela 'categories' no Supabase)
const CATEGORY_MAP = {
  1: 'Matemática',
  2: 'Física',
  3: 'Biologia',
  4: 'História',
  5: 'Programação'
};

export function UploadModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [difficulty, setDifficulty] = useState('iniciante');
  const [coverUrl, setCoverUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setErrorMsg('Por favor, envie apenas arquivos PDF.');
      setPdfFile(null);
      return;
    }
    setErrorMsg('');
    setPdfFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setErrorMsg('O arquivo PDF é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Fazer o Upload do PDF para o Storage do Supabase
      // Criamos um nome único para evitar que arquivos com o mesmo nome se sobrescrevam
      const fileName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '-')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs') // O nome do bucket que criamos no Passo 1
        .upload(fileName, pdfFile);

      if (uploadError) throw new Error('Falha ao enviar o arquivo PDF.');

      // 2. Obter a URL pública do PDF gerado
      const { data: publicUrlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);
      
      const pdfUrl = publicUrlData.publicUrl;

      // 3. Salvar as informações no banco de dados
      // NOTA: Como você não tem login ainda, não passaremos o uploader_id. 
      // O RLS precisa estar relaxado para inserções anônimas para isso funcionar agora.
      const { error: dbError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          category_id: parseInt(categoryId),
          difficulty_level: difficulty,
          file_url: pdfUrl,
          cover_url: coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400', // Capa genérica se vazio
          // status vai automaticamente como 'pending' por padrão no SQL
        });

      if (dbError) throw new Error('Falha ao salvar as informações do livro.');

      // Sucesso!
      setSuccess(true);
      
      // Fecha o modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <UploadCloud size={24} className="text-blue-400" />
            Contribuir com Material
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle size={60} className="text-green-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-2">Material Enviado!</h3>
              <p className="text-gray-400">O seu PDF foi enviado para a fila de moderação e estará disponível em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Título e Autor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="Ex: Cálculo I" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Autor</label>
                  <input required type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" placeholder="Nome do autor" />
                </div>
              </div>

              {/* Categoria e Dificuldade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Matéria</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                    {Object.entries(CATEGORY_MAP).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nível</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediário">Intermediário</option>
                    <option value="avançado">Avançado</option>
                  </select>
                </div>
              </div>

              {/* Capa (URL) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL da Capa (Opcional)</label>
                <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="https://link-da-imagem.com/foto.jpg" />
              </div>

              {/* Upload de Arquivo PDF */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Arquivo PDF</label>
                <input required type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-all border border-gray-700 rounded-lg bg-gray-800" />
              </div>

              {/* Mensagem de Erro */}
              {errorMsg && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm border border-red-500/20">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {/* Botão de Envio */}
              <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar para Moderação'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}