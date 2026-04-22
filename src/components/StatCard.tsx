import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We use a temporary element or measure the existing one while unscaled
    const measure = () => {
      const textElement = container.firstChild as HTMLElement;
      if (!textElement) return;

      // Ensure we measure the full unscaled width
      const containerWidth = container.offsetWidth;
      
      // Temporarily remove transform to measure natural width
      const originalTransform = textElement.style.transform;
      textElement.style.transform = 'none';
      const textWidth = textElement.offsetWidth;
      textElement.style.transform = originalTransform;

      if (textWidth > containerWidth && containerWidth > 0) {
        // Calculate scale but don't go below a reasonable limit (e.g., 0.5)
        setScale(Math.max(0.5, containerWidth / textWidth));
      } else {
        setScale(1);
      }
    };

    measure();
    
    // Use ResizeObserver for more robust detection than window.resize
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm min-w-0">
      <div ref={containerRef} className="mb-4 overflow-hidden relative h-10 flex items-center">
        <span 
          className="stat-value inline-block font-bold text-gray-900 origin-left transition-transform duration-200 whitespace-nowrap text-3xl"
          style={{ 
            transform: `scale(${scale})`,
          }}
        >
          {value}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 truncate mr-2">{title}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EBEBECCC]/80 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
