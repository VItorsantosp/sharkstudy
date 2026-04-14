import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export function AuthModal({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false); // Alterna entre Login e Registro
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Registro
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada! Verifique seu e-mail (se a confirmação estiver ativa).');
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onClose(); // Fecha o modal após sucesso
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white font-serif mb-2 text-center">
          {isSignUp ? 'Criar Nova Conta' : 'Bem-vindo de Volta'}
        </h2>
        <p className="text-gray-400 text-sm text-center mb-8">
          {isSignUp ? 'Junte-se à nossa biblioteca colaborativa.' : 'Acesse seus estudos e favoritos.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              required type="email" placeholder="Seu e-mail" 
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              required type="password" placeholder="Sua senha" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {errorMsg && (
            <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex gap-2">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'} 
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 ml-1 hover:underline font-medium"
          >
            {isSignUp ? 'Faça Login' : 'Cadastre-se'}
          </button>
        </p>
      </div>
    </div>
  );
}