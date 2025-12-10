import { useEffect } from 'react';
import Header from './components/Header';
import Chat from './components/Chat';
import ChatInput from './components/ChatInput';
import ConversationHistory from './components/ConversationHistory';

function App() {
  useEffect(() => {
    // Initialize dark mode on app load
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex-1 flex min-h-0">
        <ConversationHistory />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
          <div className="flex-shrink-0">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
