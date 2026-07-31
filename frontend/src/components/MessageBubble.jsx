import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, AlertTriangle, Volume2, VolumeX, Copy, Check } from 'lucide-react';

const sanitizeText = (raw) => {
  if (!raw) return '';
  let str = String(raw);

  // If text starts with Python list representation e.g. [{'type': 'text', 'text': '...'}]
  if (str.trim().startsWith("[{'type': 'text'") || str.trim().startsWith('[{"type": "text"')) {
    try {
      const matches = [...str.matchAll(/['"]text['"]\s*:\s*['"]((?:\\.|[^'"])*)['"]/g)];
      if (matches.length > 0) {
        str = matches.map(m => m[1]).join('\n');
      }
    } catch (e) {
      console.error("Text sanitize error:", e);
    }
  }

  // Unescape literal \n strings if present
  str = str.replace(/\\n/g, '\n').replace(/\\r/g, '');
  return str;
};

const formatMarkdown = (text) => {
  if (!text) return '';
  let cleanText = sanitizeText(text);

  let html = cleanText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings #, ##, ###
  html = html.replace(/^# (.*$)/gim, '<h2 class="font-extrabold text-lg text-slate-900 mt-3 mb-1.5 border-b pb-1">$1</h2>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-base text-slate-900 mt-2.5 mb-1">$1</h3>');
  html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-sm text-slate-900 mt-2 mb-1">$1</h4>');

  // Bold text: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Italic text: *text*
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

  // Horizontal rules: ---
  html = html.replace(/^---$/gim, '<hr class="my-2 border-slate-200"/>');

  // Bullet points: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-800 my-0.5">$1</li>');

  // Newlines to breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
};

const MessageBubble = ({ message }) => {
  const isUser = message.isUser;
  const isEmergency = message.isEmergency;
  const htmlContent = formatMarkdown(message.text);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = message.text.replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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
      <div className="flex flex-col gap-1 max-w-full min-w-0 group">
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
        >
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

          {/* Action Toolbar for AI Messages */}
          {!isUser && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100/80 text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleSpeech}
                className="p-1 sm:p-1.5 rounded-lg hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title={isSpeaking ? "Stop Voice Readout" : "Listen to Advice (Speech Synthesis)"}
              >
                {isSpeaking ? <VolumeX size={14} className="text-rose-500 animate-pulse" /> : <Volume2 size={14} />}
                <span>{isSpeaking ? "Stop" : "Listen"}</span>
              </button>

              <button
                onClick={handleCopy}
                className="p-1 sm:p-1.5 rounded-lg hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="Copy Message"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
