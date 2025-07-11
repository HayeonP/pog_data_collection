// GridFixationClick.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onNext: () => void;
  onCapture: (data: {
    images: Blob[];
    targetX: number;
    targetY: number;
    timestamp: number;
  }) => void;
};

const GRID_SIZE = 5; // 필요시 5로 변경

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

export default function GridFixationClick({ onNext, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const targets = useRef(shuffleGrid());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        alert('카메라 접근 오류');
      });

    const checkReady = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoReady(true);
      }
    };
    const video = videoRef.current;
    video?.addEventListener('loadeddata', checkReady);

    return () => {
      video?.removeEventListener('loadeddata', checkReady);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleClick = () => {
    if (!videoReady) {
      alert('비디오가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const target = targets.current[index];
    const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
    const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);
    const timestamp = Date.now();

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      alert('비디오가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        onCapture({ images: [blob], targetX: screenX, targetY: screenY, timestamp });
      } else {
        alert('이미지 캡처에 실패했습니다.');
      }

      if (index + 1 === targets.current.length) {
        onNext();
      } else {
        setIndex(index + 1);
      }
    }, 'image/jpeg', 0.92);
  };

  const target = targets.current[index];
  const screenX = (target.col + 0.5) * (window.innerWidth / GRID_SIZE);
  const screenY = (target.row + 0.5) * (window.innerHeight / GRID_SIZE);

  return (
    <div className="relative w-screen h-screen bg-black">
      <video
        ref={videoRef}
        style={{
          opacity: 0,
          width: 1,
          height: 1,
          position: 'fixed',
          left: 0,
          top: 0,
          pointerEvents: 'none',
        }}
        autoPlay
        muted
        playsInline
      />
      <button
        onClick={handleClick}
        className="absolute w-16 h-16 rounded-full bg-blue-500 hover:bg-yellow-600 z-20"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div className="absolute top-4 left-4 text-white text-sm">
        클릭 {index + 1} / {targets.current.length}
      </div>
    </div>
  );
}
