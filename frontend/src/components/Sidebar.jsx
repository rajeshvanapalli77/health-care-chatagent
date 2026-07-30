import React from 'react';
import { PlusCircle, Stethoscope } from 'lucide-react';
import ChatHistoryItem from './ChatHistoryItem';

const Sidebar = ({ chats, currentChatId, onCreateNewChat, onSelectChat, onDeleteChat }) => {
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 hidden md:flex">
      {/* App Logo Area */}
      <div className="p-5 flex items-center gap-3 border-b border-gray-100">
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

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onCreateNewChat}
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
                onClick={() => onSelectChat(chat.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Profile or Settings (Optional Placeholder) */}
      <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400 flex flex-col items-center gap-1.5">
         <span>Secure & Encrypted Session</span>
         <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">HIPAA COMPLIANT</span>
         <span className="text-[10px] text-gray-400 font-medium mt-1">© 2026 Vanapalli Rajesh</span>
      </div>
    </div>
  );
};

export default Sidebar;
