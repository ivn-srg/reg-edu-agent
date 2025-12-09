import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import Header from './components/Header';
import Chat from './components/Chat';
import ChatInput from './components/ChatInput';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden">
          <Chat />
        </div>
        <div className="flex-shrink-0">
          <ChatInput />
        </div>
      </div>
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all duration-300 z-[9999]"
        aria-label="Переключить тёмную тему"
        type="button"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <Moon className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>
    </div>
  );
}

export default App;
