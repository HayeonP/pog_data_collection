'use client';

import React, { useState, useRef, useEffect } from 'react';
import MetadataStep, { Metadata } from './phases/Metadata';
import FaceCenter from './phases/FaceCenter';
import GridFixationClick from './phases/GridFixationClick';
import GridFixationGaze from './phases/GridFixationGaze';
import RadialSaccadeClick from './phases/RadialSaccadeClick';
import RadialSaccadeGaze from './phases/RadialSaccadeGaze';
import ExportDataZip from './phases/ExportDataZip';
import { usePersistentFrameCapture } from '@/hooks/usePersistentFrameCapture';
import { Phase } from '@/types';


export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('metadata');
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  // ✅ 각 단계별 분리된 데이터 저장
  const [gridFixationClick1, setGridFixationClick1] = useState<any[]>([]);
  const [gridFixationClick2, setGridFixationClick2] = useState<any[]>([]);
  const [radialSaccadeClick1, setRadialSaccadeClick1] = useState<any[]>([]);
  const [radialSaccadeClick2, setRadialSaccadeClick2] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameBufferRef = usePersistentFrameCapture(videoRef);

  useEffect(() => {
    if (!videoRef.current) return;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current!.srcObject = stream;
      })
      .catch((err) => {
        console.error('Camera access denied or failed:', err);
      });
  }, []);

  return (
    <>
      {phase === 'metadata' && (
        <MetadataStep
          onSubmit={(data) => {
            setMetadata(data);
            setPhase('face-center');
            console.log('✅ 메타데이터 저장:', data);
          }}
        />
      )}

      {/* 캠 비디오 화면 (좌측 상단 작게) */}
      <video
        ref={videoRef}
        className="fixed top-2 left-2 w-40 h-auto opacity-70 rounded z-50 shadow-lg"
        autoPlay
        muted
        playsInline
      />

      {phase === 'face-center' && (
        <FaceCenter
          videoRef={videoRef}
          onNext={() => setPhase('grid-fixation-click-1')}
        />
      )}

      {phase === 'grid-fixation-click-1' && (
        <GridFixationClick
          videoRef={videoRef}
          frameBufferRef={frameBufferRef}
          onCapture={(datum) => setGridFixationClick1(prev => [...prev, datum])}
          onNext={() => setPhase('radial-saccade-click-1')}
        />
      )}

      {phase === 'radial-saccade-click-1' && (
        <RadialSaccadeClick
          videoRef={videoRef}
          frameBufferRef={frameBufferRef}
          onCapture={(datum) => setRadialSaccadeClick1(prev => [...prev, datum])}
          onNext={() => setPhase('grid-fixation-click-2')}
        />
      )}

      {phase === 'grid-fixation-click-2' && (
        <GridFixationClick
          videoRef={videoRef}
          frameBufferRef={frameBufferRef}
          onCapture={(datum) => setGridFixationClick2(prev => [...prev, datum])}
          onNext={() => setPhase('radial-saccade-click-2')}
        />
      )}

      {phase === 'radial-saccade-click-2' && (
        <RadialSaccadeClick
          videoRef={videoRef}
          frameBufferRef={frameBufferRef}
          onCapture={(datum) => setRadialSaccadeClick2(prev => [...prev, datum])}
          onNext={() => setPhase('export-data-zip')}
        />
      )}

      

      {phase === 'export-data-zip' && (
        <ExportDataZip
          metadata={metadata!}
          taskData={{
            grid_fixation_click_1: gridFixationClick1,            
            radial_saccade_click_1: radialSaccadeClick1,
            grid_fixation_click_2: gridFixationClick2,
            radial_saccade_click_2: radialSaccadeClick2,
          }}
        />
      )}
    </>
  );
}
