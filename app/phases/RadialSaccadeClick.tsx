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

// 설정값
const NUM_RADIAL_LINES = 6; // Default: 6
const NUM_CIRCLES = 4; // Default:
const MAX_RADIUS_RATIO = 0.45; // 화면 세로의 90% / 2 → 0.45

export default function RadialSaccadeClick({ onNext, videoRef, frameBufferRef, onCapture }: Props) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const sequence = useRef<{ x: number; y: number }[]>([]);
  const [index, setIndex] = useState(0);
  const [savedCenterOnce, setSavedCenterOnce] = useState(false);

  // 타겟 초기 생성
  useEffect(() => {
    const height = window.innerHeight;
    const maxRadius = height * MAX_RADIUS_RATIO;

    // 4개의 반지름 단계
    const radii = Array.from({ length: NUM_CIRCLES }, (_, i) => ((i + 1) * maxRadius) / NUM_CIRCLES);

    // 각 반지름에 대해 6방향 점 생성
    const targets: { x: number; y: number }[] = [];
    for (const radius of radii) {
      for (let i = 0; i < NUM_RADIAL_LINES; i++) {
        const angle = (i * 2 * Math.PI) / NUM_RADIAL_LINES;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        targets.push({ x, y });
      }
    }

    // 타겟 순서를 무작위로 섞고 [center, target, center, target, ...] 구성
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }

    const fullSequence: { x: number; y: number }[] = [];
    for (const target of targets) {
      fullSequence.push({ x: centerX, y: centerY }); // center
      fullSequence.push(target);                     // actual target
    }

    sequence.current = fullSequence;
  }, []);

  const handleClick = () => {
    const target = sequence.current[index];
    const timestamp = Date.now();
    const latest = frameBufferRef.current?.at(-1);

    if (latest) {
      const isCenter = target.x === centerX && target.y === centerY;
      if (!isCenter || !savedCenterOnce) {
        onCapture({
          images: [latest],
          targetX: target.x,
          targetY: target.y,
          timestamp,
        });
        if (isCenter) setSavedCenterOnce(true);
      }
    }

    if (index + 1 === sequence.current.length) {
      onNext();
    } else {
      setIndex(index + 1);
    }
  };

  const target = sequence.current[index] ?? { x: centerX, y: centerY };

  return (
    <div className="relative w-screen h-screen bg-black">
      <button
        onClick={handleClick}
        className="absolute w-16 h-16 rounded-full bg-red-500 hover:bg-yellow-600 z-20"
        style={{
          left: `${target.x}px`,
          top: `${target.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="absolute top-4 left-4 text-white text-sm">
        클릭 {index + 1} / {sequence.current.length}
      </div>
    </div>
  );
}
