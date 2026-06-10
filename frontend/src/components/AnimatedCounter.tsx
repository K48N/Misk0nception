import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms
  className?: string;
}

export default function AnimatedCounter({ value, duration = 1200, className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  // removed unused start ref
  const raf = useRef<number>();

  useEffect(() => {
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    }
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
