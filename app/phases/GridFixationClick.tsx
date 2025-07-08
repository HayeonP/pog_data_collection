'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onNext: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  frameBufferRef: React.RefObject<Blob[]>;
  onCapture: (data: {
    images: Blob[];          // 항상 배열로 저장
    targetX: number;         // 타겟의 화면상 위치
    targetY: number;
    timestamp: number;       // 캡처 시점
  }) => void;
};

const GRID_SIZE = 5; // Default: 5

// 5x5 그리드 좌표를 무작위 순서로 섞음
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

export default function GridFixationClick({ onNext, videoRef, frameBufferRef, onCapture }: Props) {
  const targets = useRef(shuffleGrid());         // 모든 타겟 순서
  const [index, setIndex] = useState(0);         // 현재 타겟 인덱스

  // 🔵 클릭 시 현재 타겟 위치와 timestamp, 그리고 frameBuffer에서 최신 프레임 1개 저장
  const handleClick = () => {
    const target = targets.current[index];
    const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
    const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);
    const timestamp = Date.now();

    const latest = frameBufferRef.current?.at(-1); // 가장 최근 이미지 1개 사용
    if (latest && latest.size > 0) {      
      onCapture({ images: [latest], targetX: screenX, targetY: screenY, timestamp });
    } else {
      console.log('frameBufferRef:', frameBufferRef.current);
      alert('캡처된 이미지가 없습니다. 잠시 후 다시 시도해주세요.');
    }

    // 다음 타겟 or 종료
    if (index + 1 === targets.current.length) {
      onNext();
    } else {
      setIndex(index + 1);
    }
  };

  const target = targets.current[index];
  const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
  const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* 🎯 타겟 버튼 (클릭 시 다음으로 진행) */}
      <button
        onClick={handleClick}
        className="absolute w-16 h-16 rounded-full bg-blue-500 hover:bg-yellow-600 z-20"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* 진행도 표시 */}
      <div className="absolute top-4 left-4 text-white text-sm">
        클릭 {index + 1} / {targets.current.length}
      </div>
    </div>
  );
}
