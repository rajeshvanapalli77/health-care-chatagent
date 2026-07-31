import React from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, AlertTriangle } from 'lucide-react';

const formatMarkdown = (text) => {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold text: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Italic text: *text*
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-base text-slate-900 mt-2 mb-1">$1</h4>');

  // Bullet points: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-800">$1</li>');

  // Newlines to breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
};

const MessageBubble = ({ message }) => {
  const isUser = message.isUser;
  const isEmergency = message.isEmergency;
  const htmlContent = formatMarkdown(message.text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 max-w-[90%] md:max-w-[82%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all
        ${isUser 
          ? 'bg-slate-100 border-slate-200 text-slate-600' 
          : 'bg-teal-50 border-teal-200 text-teal-600'
        }
        ${isEmergency ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : ''}
      `}
      >
        {isUser ? <User size={18} /> : isEmergency ? <AlertTriangle size={18} /> : <Stethoscope size={18} />}
      </div>

      {/* Bubble Content */}
      <div className="flex flex-col gap-1 max-w-full min-w-0">
        <div className="text-[10px] text-slate-400 font-semibold tracking-wide px-1 flex items-center gap-2" style={{ alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          <span>{isUser ? 'You' : 'Healthcare AI'}</span>
          {message.timestamp && <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        
        <div 
          className={`px-4 sm:px-5 py-3.5 text-sm sm:text-[15px] leading-relaxed relative rounded-2xl shadow-xs border transition-all
            ${isUser
              ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-xs border-teal-600 shadow-teal-900/10 font-medium'
              : 'bg-white text-slate-800 rounded-tl-xs border-slate-200/80 shadow-slate-900/5'
            }
            ${isEmergency ? '!bg-rose-50/90 !border-rose-200 !text-rose-950 !rounded-tl-xs ring-2 ring-rose-300/40' : ''}
          `}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </motion.div>
  );
};

export default MessageBubble;
