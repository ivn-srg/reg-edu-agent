import { motion } from 'framer-motion';
import { Bot, User, Copy, RotateCcw, Check } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useState } from 'react';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleResend = () => {
    // This will be handled by ChatInput component
    const event = new CustomEvent('resendMessage', { detail: { content: message.content } });
    window.dispatchEvent(event);
  };

  return (
    <Tooltip.Provider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-end gap-2 mb-4 group ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-gray-100" />
          </div>
        )}
        
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div
                className={`chat-bubble max-w-[85%] sm:max-w-[80%] md:max-w-[70%] px-3 py-2 md:px-4 md:py-3 cursor-default min-h-[2.5rem] flex items-center ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                }`}
              >
                <div className="text-sm md:text-base leading-relaxed prose prose-sm md:prose-base max-w-none prose-p:my-0 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-blockquote:my-1 prose-hr:my-2 prose-table:my-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      p: ({ children }) => <p className="my-1">{children}</p>,
                      h1: ({ children }) => <h1 className="text-xl md:text-2xl font-bold my-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg md:text-xl font-bold my-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base md:text-lg font-semibold my-2">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside my-2">{children}</ol>,
                      li: ({ children }) => <li className="my-1">{children}</li>,
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <code className={`${className} block bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto my-2`} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={`${isUser ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'} px-1.5 py-0.5 rounded text-sm`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <pre className="my-2">{children}</pre>,
                      blockquote: ({ children }) => (
                        <blockquote className={`border-l-4 ${isUser ? 'border-blue-300' : 'border-gray-400 dark:border-gray-500'} pl-4 my-2 italic`}>
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a href={href} className={`${isUser ? 'text-blue-100 underline' : 'text-blue-600 dark:text-blue-400 underline'} hover:opacity-80`} target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3">
                          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className={`border border-gray-300 dark:border-gray-600 px-3 py-2 ${isUser ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'} font-semibold text-left`}>
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{children}</td>
                      ),
                      hr: () => <hr className={`my-3 ${isUser ? 'border-blue-400' : 'border-gray-300 dark:border-gray-600'}`} />,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-800 dark:bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-50"
                side={isUser ? 'left' : 'right'}
                sideOffset={5}
              >
                {time}
                <Tooltip.Arrow className="fill-gray-800 dark:fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {/* Action buttons */}
          <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="relative">
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded transition-colors ${
                  copied ? 'bg-green-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
                title="Copy message"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                >
                  Copied!
                </motion.div>
              )}
            </div>
            {isUser && (
              <button
                onClick={handleResend}
                className="p-1.5 rounded transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                title="Resend message"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Generation time for assistant messages */}
          {!isUser && message.generationTime && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {message.generationTime.toFixed(1)}s
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        )}
      </motion.div>
    </Tooltip.Provider>
  );
}
