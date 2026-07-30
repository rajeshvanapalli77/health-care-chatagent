import React, { useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';

const InputBox = ({ input, setInput, handleSend, handleFileUpload, isLoading }) => {
  const fileInputRef = useRef(null);

  const onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-transparent mt-auto relative z-20">
      <div className="max-w-4xl mx-auto flex items-end gap-2 bg-white p-2 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-200 focus-within:border-healthcare-400 focus-within:ring-4 focus-within:ring-healthcare-50 transition-all">
        
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
          className="p-3 text-gray-400 hover:text-healthcare-600 hover:bg-healthcare-50 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
          title="Attach Medical Document"
        >
          <Paperclip size={20} />
        </button>

        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Describe symptoms or upload a report..."
          className="flex-1 max-h-32 min-h-[44px] bg-transparent py-3 px-2 text-gray-700 placeholder-gray-400 resize-none outline-none leading-relaxed"
          rows={1}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-3 text-white bg-healthcare-500 hover:bg-healthcare-600 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all flex-shrink-0 shadow-sm"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
        </button>
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px] text-gray-400 font-medium">Healthcare AI can make mistakes. Always consult your doctor.</span>
      </div>
    </div>
  );
};

export default InputBox;
