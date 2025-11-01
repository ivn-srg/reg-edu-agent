import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface GenerationTimerProps {
  isGenerating: boolean;
  finalTime?: number;
}

export default function GenerationTimer({ isGenerating, finalTime }: GenerationTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const displayTime = finalTime !== undefined ? finalTime : elapsedTime;

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      <Clock className="w-3 h-3" />
      <span>{displayTime.toFixed(1)}s</span>
    </div>
  );
}
