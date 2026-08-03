import React, { useState } from 'react';

export default function AIFileDropzone({ onFiles, children }: { onFiles: (files: FileList | null) => Promise<void> | void; children?: React.ReactNode }) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    await onFiles(e.dataTransfer.files);
  };

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`w-full ${dragging ? 'ring-2 ring-safe/40' : ''}`}>
      {children ?? null}
      {dragging && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-void/70 border border-safe/30 px-3 py-2 rounded">Drop files to attach</div></div>}
    </div>
  );
}
