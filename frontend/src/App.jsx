import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import FeedbackModal from './components/FeedbackModal';
import AdminFeedbackDashboard from './components/AdminFeedbackDashboard';

function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('healthcare_chats');
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    } else {
      createNewChat();
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('healthcare_chats', JSON.stringify(chats));
    } else {
      localStorage.removeItem('healthcare_chats');
    }
  }, [chats]);

  const currentChat = chats.find(c => c.id === currentChatId);

  const createNewChat = () => {
    const newChat = {
      id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: "New Consultation",
      updatedAt: Date.now(),
      messages: [{
        text: "Hello! I am your AI Health Assistant. How can I help you today? You can describe your symptoms, or securely upload your medical reports for analysis.",
        isUser: false,
        timestamp: Date.now()
      }]
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      const remaining = chats.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setCurrentChatId(remaining[0].id);
      } else {
        createNewChat();
      }
    }
  };

  // Safe updater for messages inside the active chat
  const addMessageToCurrentChat = (newMessage, customTitle = null) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === currentChatId) {
        const isFirstUserMessage = newMessage.isUser && chat.messages.filter(m => m.isUser).length === 0;
        return {
          ...chat,
          messages: [...chat.messages, { ...newMessage, timestamp: Date.now() }],
          title: customTitle || (isFirstUserMessage ? newMessage.text.substring(0, 30) + '...' : chat.title),
          updatedAt: Date.now()
        };
      }
      return chat;
    }));
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';


  const handleSend = async (customPrompt = null) => {
    const userText = typeof customPrompt === 'string' ? customPrompt.trim() : input.trim();
    if (!userText || !currentChatId) return;

    if (!customPrompt) setInput('');
    addMessageToCurrentChat({ text: userText, isUser: true });
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText, session_id: currentChatId })
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }
      
      if (response.ok) {
        addMessageToCurrentChat({ 
          text: data.response, 
          isUser: false, 
          isEmergency: data.is_emergency 
        });
      } else {
        addMessageToCurrentChat({ text: `❌ Error: ${data.detail || 'Internal Server Error'}`, isUser: false });
      }
    } catch (error) {
      addMessageToCurrentChat({ text: `Connection error (${error.message}). Is the backend running on ${API_BASE_URL || 'localhost:8000'}?`, isUser: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentChatId) return;

    addMessageToCurrentChat({ text: `📎 Processing attachment: **${file.name}**...`, isUser: true }, `Uploaded: ${file.name}`);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/patient-upload?session_id=${currentChatId}`, {
        method: 'POST',
        body: formData
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      if (response.ok && data.status !== "REJECTED") {
        addMessageToCurrentChat({ text: data.chat_acknowledgement || "File uploaded and processed successfully.", isUser: false });
      } else {
        addMessageToCurrentChat({ text: `❌ Attachment rejected: ${data.rejection_reason || data.detail || 'Unknown processing error'}`, isUser: false });
      }
    } catch (error) {
      console.error("Upload Error:", error);
      addMessageToCurrentChat({ text: `Upload failed: ${error.message || "Connection error."}`, isUser: false });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSessionBackendMemory = async () => {
    if(!currentChatId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/controller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_type: 'CLEAR_SESSION', session_id: currentChatId })
      });
      if(response.ok) {
         addMessageToCurrentChat({text: "⚠️ System memory actively wiped for this session per HIPAA compliance rules. You may start fresh.", isUser: false});
      }
    } catch(err) {
      console.error("Failed to clear backend memory", err);
    }
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans text-gray-800">
      <Sidebar 
        chats={chats}
        currentChatId={currentChatId}
        onCreateNewChat={createNewChat}
        onSelectChat={setCurrentChatId}
        onDeleteChat={deleteChat}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
      />
      
      {currentChat ? (
        <ChatWindow 
          messages={currentChat.messages}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleFileUpload={handleFileUpload}
          isLoading={isLoading}
          currentChat={currentChat}
          onClearSession={clearSessionBackendMemory}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
           <div className="text-gray-400">Loading Patient Portal...</div>
        </div>
      )}

      {/* Customer Feedback & Reviews Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        sessionId={currentChatId}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Admin Feedback & Issue Review Dashboard Modal */}
      <AdminFeedbackDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}

export default App;

