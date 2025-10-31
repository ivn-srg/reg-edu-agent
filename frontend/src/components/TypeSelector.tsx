import { useChatStore } from '../store/chatStore';
import type { MessageType } from '../types';

export default function TypeSelector() {
  const { currentType, setCurrentType } = useChatStore();

  const types: { value: MessageType; label: string }[] = [
    { value: 'question', label: 'Вопрос' },
    { value: 'quiz', label: 'Квиз' },
    { value: 'task', label: 'Задание' },
  ];

  return (
    <select
      value={currentType || ''}
      onChange={(e) => setCurrentType((e.target.value as MessageType) || null)}
      className="w-full md:w-auto rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-3 pr-9 md:pl-4 md:pr-10 py-2 text-base md:text-sm font-medium text-gray-800 dark:text-gray-100 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors cursor-pointer appearance-none bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`
      }}
    >
      <option value="" className="text-base">Выберите тип</option>
      {types.map((type) => (
        <option key={type.value} value={type.value} className="text-base">
          {type.label}
        </option>
      ))}
    </select>
  );
}
