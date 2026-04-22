import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<string>("1.875rem"); // text-3xl

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    
    if (!container || !text) return;

    const adjustFontSize = () => {
      const containerWidth = container.offsetWidth;
      const textWidth = text.scrollWidth;
      
      if (textWidth > containerWidth) {
        const ratio = containerWidth / textWidth;
        // Clamp the font size between 1rem and 1.875rem
        const newSize = Math.max(1, 1.875 * ratio);
        setFontSize(`${newSize}rem`);
      } else {
        setFontSize("1.4rem");
      }
    };

    adjustFontSize();
    
    // Optional: Re-adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [value]);

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm min-w-0">
      <div ref={containerRef} className="mb-4 overflow-hidden whitespace-nowrap">
        <span 
          ref={textRef} 
          className="font-bold text-gray-900 transition-all duration-100"
          style={{ fontSize }}
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
