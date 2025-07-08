'use client';

import React, { useEffect, useRef, useState } from 'react';
import MediaPipeFaceDetection from '@mediapipe/face_detection';
import MediaPipeCamera from '@mediapipe/camera_utils';

export const FaceDetection = MediaPipeFaceDetection.FaceDetection;
export const Camera = MediaPipeCamera.Camera;

type Props = {
  onNext: () => void;
	videoRef: React.RefObject<HTMLVideoElement>;
};

export default function FaceCenter({ onNext, videoRef }: Props) {  
  const [isAligned, setIsAligned] = useState(false);
	const [offset, setOffset] = useState<number | null>(null);
	const [maxOffset, setMaxOffset] = useState<number | null>(null);
	const [iouValue, setIouValue] = useState<number | null>(null);
  
  const centerBoxSize = window.innerHeight * 0.3; // TODO
  const centerBox = {
    x: (window.innerWidth - centerBoxSize) / 2,
    y: (window.innerHeight - centerBoxSize) / 2,
    size: centerBoxSize,
  };

  const [faceBox, setFaceBox] = useState<DOMRect | null>(null);

  const iou = (a: DOMRect, b: DOMRect) => {
    const x1 = Math.max(a.left, b.left);
    const y1 = Math.max(a.top, b.top);
    const x2 = Math.min(a.right, b.right);
    const y2 = Math.min(a.bottom, b.bottom);
    const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const unionArea = a.width * a.height + b.width * b.height - interArea;
    return interArea / unionArea;
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5,
    });
    
    faceDetection.onResults((results) => {
      if (!results.detections || results.detections.length === 0) {
        setIsAligned(false);
        return;
      }

      const detection = results.detections[0];
      const box = detection.boundingBox;

			const video = videoRef.current!;
			const rect = video.getBoundingClientRect();

			const videoAspect = video.videoWidth / video.videoHeight;
			const screenAspect = rect.width / rect.height;

			let drawWidth = rect.width;
			let drawHeight = rect.height;
			let offsetX = 0;
			let offsetY = 0;

			if (screenAspect > videoAspect) {
				drawWidth = rect.height * videoAspect;
				offsetX = (rect.width - drawWidth) / 2;
			} else {
				drawHeight = rect.width / videoAspect;
				offsetY = (rect.height - drawHeight) / 2;
			}

			const faceBox = new DOMRect(
			  offsetX + box.xCenter! * drawWidth - box.width! * drawWidth / 2,
			  offsetY + box.yCenter! * drawHeight - box.height! * drawHeight / 2,
			  box.width! * drawWidth,
			  box.height! * drawHeight
			);

      const center = new DOMRect(
			  offsetX + drawWidth / 2 - (centerBox.size / 2),
			  offsetY + drawHeight / 2 - (centerBox.size / 2),
			  centerBox.size,
			  centerBox.size
			);

      const centerX = center.x + center.width / 2;
      const centerY = center.y + center.height / 2;
      const faceX = faceBox.x + faceBox.width / 2;
      const faceY = faceBox.y + faceBox.height / 2;

      const offset = Math.sqrt((faceX - centerX) ** 2 + (faceY - centerY) ** 2);
			const iouValue = iou(faceBox, center);

			/* TODO: 중앙 판단 조건 */
      const maxOffset = centerBox.size * 0.3;
      const isInCenter = offset <= maxOffset;
      const isOverlap = iou(faceBox, center) >= 0.4;

			setOffset(offset);
			setMaxOffset(maxOffset);
			setIouValue(iouValue);
      setIsAligned(isInCenter && isOverlap);
      setFaceBox(faceBox);
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceDetection.send({ image: videoRef.current! });
      },
      width: window.innerWidth,
      height: window.innerHeight,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <video ref={videoRef} className="absolute w-full h-full object-cover" autoPlay muted playsInline />

      <div className="absolute top-4 w-full text-center text-white text-xl z-20">
        얼굴을 중앙 박스에 맞춰주세요. 화면이 연두색이 되면 다음 버튼을 눌러주세요.
      </div>

      {/* 중앙 박스 */}
      <div
        className={`absolute border-4 z-10 transition-all duration-200 ${
          isAligned ? 'bg-green-300/30 border-green-500' : 'border-white'
        }`}
        style={{
          width: `${centerBox.size}px`,
          height: `${centerBox.size}px`,
          left: `${centerBox.x}px`,
          top: `${centerBox.y}px`,
        }}
      />

      {faceBox && ( /* Detect된 얼굴 박스 */
        <div
          className="absolute border-2 border-yellow-400 z-10"
          style={{
            left: `${faceBox.x}px`,
            top: `${faceBox.y}px`,
            width: `${faceBox.width}px`,
            height: `${faceBox.height}px`,
          }}
        />
      )}

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        disabled={!isAligned}
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded text-white ${
          isAligned ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed'
        }`}
      >
        다음
      </button>

      {offset !== null && iouValue !== null && (
			  <div className="absolute bottom-4 left-4 text-white bg-black/50 p-4 rounded text-sm z-30 space-y-1">
			    <div>🎯 <b>중심 오차</b>: {(Math.round(offset).toFixed(2))} (기준 ≤ {Math.round(maxOffset).toFixed(2)})</div>
			    <div>🧩 <b>IoU</b>: {iouValue.toFixed(2)} (기준 ≥ 0.4)</div>
			    <div>✅ <b>정렬 상태</b>: {isAligned ? '✅ OK' : '❌ NO'}</div>
			  </div>
			)}
    </div>
  );
}
