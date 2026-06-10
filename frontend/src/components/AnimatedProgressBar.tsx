import { useEffect, useRef } from 'react';

interface AnimatedProgressBarProps {
  value: number; // 0-1
  duration?: number; // ms
  className?: string;
}

export default function AnimatedProgressBar({ value, duration = 1200, className = '' }: AnimatedProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.transition = `width ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
      barRef.current.style.width = `${Math.round(value * 100)}%`;
    }
  }, [value, duration]);

  return (
    <div className={`w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        ref={barRef}
        className="h-full bg-kit-green rounded-full shadow-inner"
        style={{ width: 0 }}
      />
    </div>
  );
}
