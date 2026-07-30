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
          ? 'bg-healthcare-50 text-healthcare-900 border border-healthcare-100 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100'
        }
      `}
    >
      <MessageSquare size={16} className={isActive ? "text-healthcare-500" : "text-gray-400 group-hover:text-gray-600"} />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <span className="text-sm font-medium truncate pr-6">{chat.title || "New Consultation"}</span>
        <span className="text-[10px] text-gray-400">{new Date(chat.updatedAt).toLocaleDateString()}</span>
      </div>

      <button
        onClick={onDelete}
        className={`absolute right-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100
          ${isActive ? 'opacity-100' : ''}`}
        title="Delete chat"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
};

export default ChatHistoryItem;
