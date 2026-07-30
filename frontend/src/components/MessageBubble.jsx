import React from 'react';
import { motion } from 'framer-motion';
import { User, Activity } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.isUser;
  
  // Format text securely representing carriage returns as breaks
  const formattedText = message.text ? message.text.replace(/\n/g, '<br/>') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border
        ${isUser 
          ? 'bg-gray-100 border-gray-200 text-gray-500' 
          : 'bg-healthcare-50 border-healthcare-200 text-healthcare-600'
        }
        ${message.isEmergency ? 'bg-red-50 border-red-200 text-red-600' : ''}
      `}
      >
        {isUser ? <User size={18} /> : <Activity size={18} />}
      </div>

      {/* Bubble Content */}
      <div className="flex flex-col gap-1 max-w-full min-w-0">
        <div className="text-[10px] text-gray-400 font-medium px-1 flex gap-2" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          <span>{isUser ? 'You' : 'Healthcare AI'}</span>
          {message.timestamp && <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        
        <div 
          className={`px-4 py-3 text-[15px] leading-relaxed relative
            ${isUser
              ? 'bg-healthcare-600 text-white rounded-2xl rounded-tr-sm shadow-[0_4px_14px_rgba(13,148,136,0.2)]'
              : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100'
            }
            ${message.isEmergency ? '!bg-red-50 !border-red-200 !text-red-900 !rounded-tl-sm' : ''}
          `}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      </div>
    </motion.div>
  );
};

export default MessageBubble;
