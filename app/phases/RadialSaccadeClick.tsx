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

const NUM_RADIAL_LINES = 6; // 필요시 6으로 변경
const NUM_CIRCLES = 4;      // 필요시 4 등으로 변경
const MAX_RADIUS_RATIO = 0.45;

export default function RadialSaccadeClick({ onNext, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const sequence = useRef<{ x: number; y: number }[]>([]);
  const [index, setIndex] = useState(0);
  const [savedCenterOnce, setSavedCenterOnce] = useState(false);

  // 비디오 스트림 활성화
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

  // 타겟 시퀀스 생성
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
      fullSequence.push({ x: centerX, y: centerY }); // center
      fullSequence.push(target);                     // actual target
    }

    sequence.current = fullSequence;
  }, []);

  const handleClick = () => {
    if (!videoReady) {
      alert('비디오가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const target = sequence.current[index];
    const timestamp = Date.now();

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      alert('비디오가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 캡처
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const isCenter = target.x === centerX && target.y === centerY;
        if (!isCenter || !savedCenterOnce) {
          onCapture({
            images: [blob],
            targetX: target.x,
            targetY: target.y,
            timestamp,
          });
          if (isCenter) setSavedCenterOnce(true);
        }
      } else {
        alert('이미지 캡처에 실패했습니다.');
      }

      if (index + 1 === sequence.current.length) {
        onNext();
      } else {
        setIndex(index + 1);
      }
    }, 'image/jpeg', 0.92);
  };

  const target = sequence.current[index] ?? { x: centerX, y: centerY };

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
