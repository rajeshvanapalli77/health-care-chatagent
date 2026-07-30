import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import { Menu, Trash2 } from 'lucide-react';

const ChatWindow = ({ 
  messages, 
  input, 
  setInput, 
  handleSend, 
  handleFileUpload, 
  isLoading, 
  currentChat,
  onClearSession,
  onToggleMobileSidebar 
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full relative bg-[#F8FAFC]">
      {/* Mobile Header / Top Bar */}
      <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
            title="Open Consultations"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-800 text-sm md:text-base">
              {currentChat?.title || "New Consultation"}
            </h2>
            <span className="text-[10px] md:text-xs text-healthcare-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-healthcare-500"></span>
              Secure Session Active
            </span>
          </div>
        </div>

        <button 
          onClick={onClearSession}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
          title="Clear Backend Session Memory"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Clear Memory</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center justify-center max-w-md text-center space-y-4 opacity-70">
            <div className="w-16 h-16 bg-healthcare-50 rounded-2xl flex items-center justify-center text-healthcare-500 shadow-sm border border-healthcare-100 mb-2">
              <span className="text-3xl">🩺</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">How can I assist you today?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Describe your symptoms, ask general health questions, or securely upload your lab reports and prescriptions for instant analysis.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border bg-healthcare-50 border-healthcare-200 text-healthcare-600">
               <span className="animate-pulse">🏥</span>
            </div>
            <div className="bg-white text-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-1.5">
               <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Fixed Input Box at Bottom */}
      <InputBox 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleFileUpload={handleFileUpload}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatWindow;
