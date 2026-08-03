import React from 'react';
import { X } from 'lucide-react';
import type { UploadedFile } from '../types/notes';

export default function AttachmentPreview({ file, onRemove, selected, onSelect }: { file: UploadedFile; onRemove: (id: string) => void; onSelect?: (id: string) => void; selected?: boolean }) {
  const humanSize = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-void border border-gray-800 rounded">
      <div className="w-8 h-8 flex items-center justify-center border border-gray-800 bg-surface text-gray-300 font-mono text-[11px]">{file.extension?.toUpperCase() || 'F'}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[11px] truncate">{file.name}</div>
        <div className="text-[9px] text-gray-500">{humanSize(file.size)}</div>
      </div>
      <div className="flex items-center gap-2">
        {onSelect && <button type="button" onClick={() => onSelect(file.id)} className={`px-2 py-1 text-[10px] rounded ${selected ? 'bg-safe/10 border border-safe text-safe' : 'border border-gray-700 text-gray-300 hover:border-safe hover:text-safe'}`}>{selected ? 'Selected' : 'Select'}</button>}
        <button type="button" onClick={() => onRemove(file.id)} aria-label={`Remove ${file.name}`} className="p-1.5 text-gray-500 hover:text-panic hover:bg-panic/5 hover:ring-2 hover:ring-panic/40 rounded transition-all"><X size={14} /></button>
      </div>
    </div>
  );
}
