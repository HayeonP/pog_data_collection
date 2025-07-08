'use client';

import React, { useState, useEffect } from 'react';

export type Metadata = {
  name: string;
  device: '맥북프로 14인치' | '갤럭시북4 프로 360' | '태블릿' | '개발 데스크톱';
  gender: '남' | '여';
  hat: 'X' | 'O';
  glasses: 'X' | 'O';
  resolution: { width: number; height: number};
};

type Props = {
  onSubmit: (data: Metadata) => void;
};

export default function MetadataStep({ onSubmit }: Props) {
  const [metadata, setMetadata] = useState<Metadata>({
    name: '',
    device: '맥북프로 14인치',
    gender: '남',
    hat: 'X',
    glasses: 'X',
    resolution: { width: 0, height: 0}
  });

  useEffect(() => {
    setMetadata(prev => ({
      ...prev,
      resolution: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }));
  }, []);

  const handleChange = (field: keyof Metadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value as any }));
  };

  const isValid = metadata.name.trim() !== '';

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <div className="text-2xl font-semibold">메타데이터 입력</div>
      <div className="flex flex-col gap-4 w-80">
        <label>
          이름:
          <input
            className="w-full border px-2 py-1 rounded"
            type="text"
            value={metadata.name}
            onChange={e => handleChange('name', e.target.value)}
          />
        </label>

        <label>
          장치:
           <select
            className="w-full border px-2 py-1 rounded"
            value={metadata.device}
            onChange={e => handleChange('device', e.target.value)}
          >
            <option value="맥북프로 14인치">맥북프로 14인치</option>
            <option value="갤럭시북4 프로 360">갤럭시북4 프로 360</option>
            <option value="태블릿">태블릿</option>
            <option value="개발 테스크톱">개발 테스크톱</option>
          </select>
        </label>

        <label>
          성별:
          <select
            className="w-full border px-2 py-1 rounded"
            value={metadata.gender}
            onChange={e => handleChange('gender', e.target.value)}
          >
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </label>

        <label>
          모자:
          <select
            className="w-full border px-2 py-1 rounded"
            value={metadata.hat}
            onChange={e => handleChange('hat', e.target.value)}
          >
            <option value="X">X</option>
            <option value="O">O</option>
          </select>
        </label>

        <label>
          안경:
          <select
            className="w-full border px-2 py-1 rounded"
            value={metadata.glasses}
            onChange={e => handleChange('glasses', e.target.value)}
          >
            <option value="X">X</option>
            <option value="O">O</option>
          </select>
        </label>
      </div>

      <button
        className={`px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 ${!isValid && 'opacity-50 pointer-events-none'}`}
        onClick={() => onSubmit(metadata)}
      >
        다음
      </button>
    </div>
  );
}
