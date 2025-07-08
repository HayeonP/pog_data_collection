'use client';

import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type Datum = {
  images: Blob[];
  targetX: number;
  targetY: number;
  timestamp: number;
};

type Props = {
  metadata: {
    name: string;
    device: string;
    gender: string;
    hat: string;
    glasses: string;
  };
  taskData: Record<string, Datum[]>;
};

export default function ExportDataZip({ metadata, taskData }: Props) {
  const [done, setDone] = useState(false);
  const hasExported = useRef(false); // ✅ 한번만 export

  useEffect(() => {
    if (hasExported.current || !metadata?.name || !metadata?.device || !metadata?.gender || !metadata?.glasses || !metadata?.hat ) return;
    hasExported.current = true;

    const exportZip = async () => {
      const zip = new JSZip();
			console.log(metadata)
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      for (const [taskName, dataList] of Object.entries(taskData)) {
        const folder = zip.folder(taskName)!;

        for (let i = 0; i < dataList.length; i++) {
          const { images, targetX, targetY, timestamp } = dataList[i];

          for (let j = 0; j < images.length; j++) {
            const img = images[j];
            const padded = String(i + 1).padStart(3, '0');
            const suffix = images.length > 1 ? `_${j}` : '';

            if (img instanceof Blob && img.size > 0) {
              folder.file(`${padded}${suffix}.png`, img);
            } else {
              console.warn(`[스킵됨] 유효하지 않은 이미지: ${taskName} ${padded}${suffix}`);
            }
          }

          const json = { targetX, targetY, timestamp };
          folder.file(`${String(i + 1).padStart(3, '0')}.json`, JSON.stringify(json, null, 2));
        }
      }

      const now = new Date();
      const YYMMDD = now.toISOString().slice(2, 10).replace(/-/g, '');
      const HHmm = now.toTimeString().slice(0, 5).replace(':', '');
      const sanitize = (s: string) => s.trim().replace(/\s+/g, '-').replace(/[^가-힣a-zA-Z0-9-_]/g, '');
      const filename = `${YYMMDD}_${HHmm}_${sanitize(metadata.name)}_${sanitize(metadata.device)}.zip`;

      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'STORE'
      });
      saveAs(blob, filename);
      setDone(true);
    };

    exportZip();
  }, [metadata]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-black">
      {done ? (
        <div className="text-xl">✅ 데이터 저장이 완료되었습니다!</div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">데이터 저장 중...</h1>
          <p>압축파일이 곧 다운로드됩니다.</p>
        </>
      )}
    </div>
  );
}
