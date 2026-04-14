import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Send, User as UserIcon, Loader2 } from 'lucide-react';

export function BookChat({ bookId, user, profile }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    // Inscrição em tempo real para novas mensagens
    const channel = supabase
      .channel(`chat-${bookId}`)
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'book_comments', filter: `book_id=eq.${bookId}` }, 
          () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [bookId]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('book_comments')
      .select('*, profiles(full_name)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('book_comments').insert({
      book_id: bookId,
      user_id: user.id,
      content: newMessage
    });

    if (!error) setNewMessage('');
  };

  return (
    <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-800 h-full shadow-2xl">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Discussão ao Vivo
        </h3>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] font-bold text-gray-500 mb-1">
              {msg.profiles?.full_name || 'Estudante'}
            </span>
            <p className={`text-xs p-3 rounded-2xl max-w-[90%] ${
              msg.user_id === user?.id 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-300 rounded-tl-none'
            }`}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="relative">
          <input 
            type="text" 
            disabled={!user}
            placeholder={user ? "Escreva algo..." : "Faça login para participar"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-10 py-3 text-xs text-white outline-none focus:border-blue-500 transition-all disabled:opacity-50"
          />
          <button type="submit" disabled={!user} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 p-1">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}