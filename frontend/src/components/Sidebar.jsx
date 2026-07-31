import React from 'react';
import { PlusCircle, Stethoscope, X, MessageSquare, ShieldCheck } from 'lucide-react';
import ChatHistoryItem from './ChatHistoryItem';

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onCreateNewChat, 
  onSelectChat, 
  onDeleteChat, 
  isOpen, 
  onClose,
  onOpenFeedback,
  onOpenAdmin
}) => {
  const content = (
    <div className="h-full flex flex-col bg-white">
      {/* App Logo Area */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-healthcare-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-healthcare-500/30">
            <Stethoscope size={22} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 tracking-tight text-lg">Healthcare AI</h1>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium tracking-wide">MEDICAL PORTAL</span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">by Vanapalli Rajesh</span>
            </div>
          </div>
        </div>
        {/* Mobile Close Button */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 flex flex-col gap-2">
        <button
          onClick={() => {
            onCreateNewChat();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-healthcare-500 to-healthcare-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all hover:shadow-md hover:from-healthcare-600 hover:to-healthcare-700 hover:-translate-y-[1px]"
        >
          <PlusCircle size={18} />
          New Chat
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2 mt-2">Recent Consultations</h2>
        
        {chats.length === 0 ? (
          <div className="text-sm text-gray-400 text-center mt-6 px-2">No history available.<br/>Start a new chat.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {chats.map(chat => (
              <ChatHistoryItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (onClose) onClose();
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feedback & Admin Actions Section */}
      <div className="px-3 py-2 border-t border-gray-100 flex flex-col gap-1.5">
        <button
          onClick={() => {
            if (onOpenFeedback) onOpenFeedback();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-2.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 p-2.5 rounded-xl border border-teal-200/60 transition-all text-left"
        >
          <MessageSquare size={16} className="text-teal-600 shrink-0" />
          <span>Feedback & Reviews</span>
        </button>

        <button
          onClick={() => {
            if (onOpenAdmin) onOpenAdmin();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl transition-all text-left"
        >
          <ShieldCheck size={16} className="text-slate-600 shrink-0" />
          <span>Admin Portal</span>
        </button>
      </div>

      {/* Footer Profile Credit */}
      <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400 flex flex-col items-center gap-1.5">
         <span>Secure & Encrypted Session</span>
         <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">HIPAA COMPLIANT</span>
         <span className="text-[10px] text-gray-400 font-medium mt-1">© 2026 Vanapalli Rajesh</span>
      </div>
    </div>
  );


  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="w-64 h-full bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 hidden md:flex flex-col">
        {content}
      </div>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
          <div className="relative w-72 max-w-[80vw] h-full bg-white shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
