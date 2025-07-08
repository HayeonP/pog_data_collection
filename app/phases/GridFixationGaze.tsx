'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onNext: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  frameBufferRef: React.RefObject<Blob[]>;
  onCapture: (data: {
    images: Blob[];
    targetX: number;
    targetY: number;
    timestamp: number;
  }) => void;
};

const GRID_SIZE = 5;
const DISPLAY_DURATION = 1500;

function shuffleGrid(): { row: number; col: number }[] {
  const all = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      all.push({ row, col });
    }
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

export default function GridFixationGaze({ onNext, videoRef, frameBufferRef, onCapture }: Props) {
  const targets = useRef(shuffleGrid());
  const startTimeRef = useRef(Date.now());
  const lastCapturedIndexRef = useRef(-1);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentIndex = Math.floor(elapsed / DISPLAY_DURATION);

      if (currentIndex >= targets.current.length) {
        clearInterval(interval);
        onNext();
        return;
      }

      setIndex(currentIndex);

      if (lastCapturedIndexRef.current < currentIndex) {
        const target = targets.current[currentIndex];
        const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
        const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);
        const frames = frameBufferRef.current?.slice(-3) ?? [];

        onCapture({
          images: frames,
          targetX: screenX,
          targetY: screenY,
          timestamp: Date.now(),
        });

        lastCapturedIndexRef.current = currentIndex;
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const target = targets.current[index] ?? { row: 0, col: 0 };
  const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
  const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);

  return (
    <div className="relative w-screen h-screen bg-black">
      <div
        className="absolute w-16 h-16 bg-green-500 rounded-full z-20"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div className="absolute top-4 left-4 text-white text-sm">
        응시 {index + 1} / {targets.current.length}
      </div>
    </div>
  );
}