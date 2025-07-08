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

const NUM_RADIAL_LINES = 6;
const NUM_CIRCLES = 4;
const MAX_RADIUS_RATIO = 0.45;
const DISPLAY_DURATION = 1500;

export default function RadialSaccadeGaze({ onNext, videoRef, frameBufferRef, onCapture }: Props) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const sequence = useRef<{ x: number; y: number }[]>([]);
  const startTimeRef = useRef(Date.now());
  const lastCapturedIndexRef = useRef(-1);
  const savedCenterOnce = useRef(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const height = window.innerHeight;
    const maxRadius = height * MAX_RADIUS_RATIO;
    const radii = Array.from({ length: NUM_CIRCLES }, (_, i) => ((i + 1) * maxRadius) / NUM_CIRCLES);

    const targets: { x: number; y: number }[] = [];
    for (const radius of radii) {
      for (let i = 0; i < NUM_RADIAL_LINES; i++) {
        const angle = (i * 2 * Math.PI) / NUM_RADIAL_LINES;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        targets.push({ x, y });
      }
    }

    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }

    const fullSequence: { x: number; y: number }[] = [];
    for (const target of targets) {
      fullSequence.push({ x: centerX, y: centerY });
      fullSequence.push(target);
    }

    sequence.current = fullSequence;
    startTimeRef.current = Date.now();
    lastCapturedIndexRef.current = -1;
    savedCenterOnce.current = false;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentIndex = Math.floor(elapsed / DISPLAY_DURATION);

      if (currentIndex >= sequence.current.length) {
        clearInterval(interval);
        onNext();
        return;
      }

      setIndex(currentIndex);

      if (lastCapturedIndexRef.current < currentIndex) {
        const target = sequence.current[currentIndex];
        const isCenter = target.x === centerX && target.y === centerY;
        const frames = frameBufferRef.current?.slice(-3) ?? [];

        if (!isCenter || !savedCenterOnce.current) {
          onCapture({
            images: frames,
            targetX: target.x,
            targetY: target.y,
            timestamp: Date.now(),
          });
          if (isCenter) savedCenterOnce.current = true;
        }

        lastCapturedIndexRef.current = currentIndex;
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const target = sequence.current[index] ?? { x: centerX, y: centerY };

  return (
    <div className="relative w-screen h-screen bg-black">
      <div
        className="absolute w-16 h-16 bg-green-500 rounded-full z-20"
        style={{
          left: `${target.x}px`,
          top: `${target.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div className="absolute top-4 left-4 text-white text-sm">
        응시 {index + 1} / {sequence.current.length}
      </div>
    </div>
  );
}
