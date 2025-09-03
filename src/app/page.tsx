'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { BsFillMoonStarsFill} from "react-icons/bs"
import { TbMessageChatbotFilled } from "react-icons/tb";


interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'refund-agent-history'; // Key for localStorage

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount (caching conversations)
  useEffect(() => {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
    }
  }, []);

  // Save history to localStorage whenever messages change (persistent caching)
  useEffect(() => {
    if (messages.length > 0) {
      // Limit to last 100 messages to prevent storage overflow
      const limitedMessages = messages.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedMessages));
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {

      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL ||"https://sabahat12-refund-agent.hf.space/refund" , {  // Update to your backend URL in production
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            assistantMessage += data;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1].content = assistantMessage;
              return updated;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen  bg-cyan-600/30">
      <header className="bg-black shadow shadow-blue-950 text-white p-4 text-center font-bold text-lg flex justify-between items-center py-6 ">
        Refund AI Assistant
        <button
          onClick={clearHistory}
          className="bg-cyan-800 text-white p-1 rounded-lg hover:bg-red-600"
          aria-label="Clear conversation history"
        >
          Clear History
        </button>
        
      </header>
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className='text-white/80 overflow-y-auto text-center font-medium p-5 md:text-lg flex-1'>    < BsFillMoonStarsFill className='md:w-9 md:h-9 w-5 h-5 flex justify-start shadow shadow-blue-200 rounded-lg ' /> Hey This is Sabahat AI Refund Assistant Would you like to refund you order</div>

        {messages.length === 0 && (
          <div  className="text-center text-gray-500 "  >Start by requesting a refund...</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
           
            className={`max-w-lg p-3 rounded-t-2xl  shadow-cyan-900 BsChatRightFill flex-1    ${ 
              msg.role === 'user' ? 'bg-slate-800 ml-auto' : 'bg-neutral-100 text-black/80'
            } shadow-md`} 
          > <div className='flex-1'> <TbMessageChatbotFilled /> </div>
            
            {msg.content}

        
          </div>
          
        ))}
        {isLoading && <div className="text-center font-bold text-white/80">Thinking Request...</div>}
      </div>
      
      <form onSubmit={handleSubmit}
      className="w-full flex justify-center items-center mt-6"
>
  <div className="flex items-center w-full max-w-2xl bg-white rounded-3xl shadow-md px-4">
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="E.g., I would like a refund for my order..."
      className="flex-1 bg-transparent p-4 text-black focus:outline-none"
      disabled={isLoading}
      aria-label="Enter your refund request"
    />
    <button
      type="submit"
      className="text-white bg-gray-700 p-2 w-16 rounded-3xl  hover:text-cyan-500 transition disabled:opacity-50"
      disabled={isLoading}
    >
      ⬆
    </button>
  </div>
</form>

    </div>
  );
}