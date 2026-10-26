import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label = 'กำลังโหลดข้อมูล...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
        <Loader2 className={`${sizeMap[size]} text-cyan-400 animate-spin relative z-10`} />
      </div>
      {label && (
        <p className="text-xs font-mono tracking-wider text-cyan-300/80 animate-pulse uppercase">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060913]/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="py-6 flex items-center justify-center">{content}</div>;
};
