import { RefObject, useEffect, useRef } from 'react';

export function usePersistentFrameCapture(
  videoRef: RefObject<HTMLVideoElement>
) {
  const frameBuffer = useRef<Blob[]>([]);

  useEffect(() => {

    const video = videoRef.current;
    
    let animationFrameId: number;

    const captureLoop = () => {
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        console.log("captuer loop - fall in the condition");
        animationFrameId = requestAnimationFrame(captureLoop);
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          frameBuffer.current.push(blob);
          if (frameBuffer.current.length > 5) frameBuffer.current.shift();
        }
      });

      animationFrameId = requestAnimationFrame(captureLoop);
    };

    animationFrameId = requestAnimationFrame(captureLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [videoRef]);

  return frameBuffer;
}