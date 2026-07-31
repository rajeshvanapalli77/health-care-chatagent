import React, { useRef } from 'react';
import { Send, Paperclip, Loader2, Sparkles } from 'lucide-react';

const InputBox = ({ input, setInput, handleSend, handleFileUpload, isLoading }) => {
  const fileInputRef = useRef(null);

  const onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-t from-slate-100 via-slate-50/90 to-transparent mt-auto relative z-20">
      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all duration-200">
        
        {/* Attachment Button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2.5 sm:p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50/80 active:bg-teal-100 rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 flex-shrink-0 relative group"
          title="Upload Medical Document (PDF, Image, DOCX)"
        >
          <Paperclip size={20} />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block px-2.5 py-1 bg-slate-900 text-white text-[10px] font-semibold rounded-lg whitespace-nowrap shadow-lg">
            Attach Lab Report / Prescription
          </span>
        </button>

        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Describe your symptoms or upload a report..."
          className="flex-1 max-h-36 min-h-[44px] bg-transparent py-2.5 px-2 text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed text-sm sm:text-[15px]"
          rows={1}
        />

        {/* Send Button */}
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="p-2.5 sm:p-3 text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 rounded-xl sm:rounded-2xl transition-all flex-shrink-0 shadow-md shadow-teal-900/10 active:scale-95"
          title="Send Query"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
        </button>
      </div>

      <div className="text-center mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <Sparkles size={12} className="text-teal-500" />
        <span>AI Medical Assistant may make mistakes. Always verify critical symptoms with a doctor.</span>
      </div>
    </div>
  );
};

export default InputBox;
