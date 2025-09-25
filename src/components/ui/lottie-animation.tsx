'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationPath: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  width?: number;
  height?: number;
}

export function LottieAnimation({
  animationPath,
  className = '',
  loop = true,
  autoplay = true,
  width,
  height,
}: LottieAnimationProps) {
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(animationPath);
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnimationData(data);
      } catch (err) {
        console.error('[LottieAnimation]: Failed to load animation', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimation();
  }, [animationPath]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse bg-gray-200 rounded-lg w-full h-full min-h-[200px]">
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading animation...
          </div>
        </div>
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg w-full h-full min-h-[200px] flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-2">🎬</div>
            <div className="text-sm">Animation not available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width, height }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 