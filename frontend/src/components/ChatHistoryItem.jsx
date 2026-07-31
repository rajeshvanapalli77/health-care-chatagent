import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatHistoryItem = ({ chat, isActive, onClick, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-teal-50 text-teal-950 border border-teal-200/80 shadow-2xs font-semibold' 
          : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200/60'
        }
      `}
    >
      <MessageSquare size={16} className={isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"} />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <span className="text-xs sm:text-sm font-medium truncate pr-6">{chat.title || "New Consultation"}</span>
        <span className="text-[10px] text-slate-400">{new Date(chat.updatedAt).toLocaleDateString()}</span>
      </div>

      <button
        onClick={onDelete}
        className={`absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100
          ${isActive ? 'opacity-100' : ''}`}
        title="Delete chat"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
};

export default ChatHistoryItem;
