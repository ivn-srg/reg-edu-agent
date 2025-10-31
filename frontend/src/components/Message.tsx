import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Tooltip.Provider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-end gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {!isUser && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-gray-100 dark:text-white" />
          </div>
        )}
        
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div
              className={`chat-bubble max-w-[85%] sm:max-w-[80%] md:max-w-[70%] px-3 py-2 md:px-4 md:py-3 cursor-default ${
                isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 text-gray-800 dark:text-gray-100 dark:text-white'
              }`}
            >
              <div className="text-sm md:text-base leading-relaxed prose prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-3 prose-table:my-3">
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

        {isUser && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
        )}
      </motion.div>
    </Tooltip.Provider>
  );
}
