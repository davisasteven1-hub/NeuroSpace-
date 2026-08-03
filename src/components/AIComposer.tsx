import React, { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';
import AIFileDropzone from './AIFileDropzone';
import type { UploadedFile } from '../types/notes';

export default function AIComposer({
  draft,
  setDraft,
  sending,
  onSend,
  fileInputRef,
  handleFilesSelected,
  getFilesForNote,
  selectedAttachmentIds,
  setSelectedAttachmentIds,
  deleteFile,
  uploading,
}: {
  draft: string;
  setDraft: (s: string) => void;
  sending: boolean;
  onSend: (content?: string) => Promise<void> | void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFilesSelected: (files: FileList | null) => Promise<void>;
  getFilesForNote: (noteId: string) => UploadedFile[];
  selectedAttachmentIds: string[];
  setSelectedAttachmentIds: (ids: string[]) => void;
  deleteFile: (id: string) => void;
  uploading?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  const onAttachClick = () => fileInputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    await handleFilesSelected(files);
  };

  const files = getFilesForNote('ai');

  const selectedFiles = files.filter((f) => selectedAttachmentIds.includes(f.id));

  return (
    <AIFileDropzone onFiles={onFiles}>
      <div ref={composerRef} className={`border-t border-gray-800 p-3 sm:p-4 bg-surface/30 ${dragging ? 'ring-2 ring-safe/30' : ''}`}>
        {/* hidden file input so the paperclip button can open the file chooser */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx,image/*"
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
          multiple
        />

        {/* uploading indicator */}
        {uploading && <div className="mb-2 text-[10px] text-gray-400">Uploading files…</div>}

        {/* attachment previews inside composer */}
        {selectedFiles.length > 0 && (
          <div className="mb-2 space-y-2">
            {selectedFiles.map((f) => <AttachmentPreview key={f.id} file={f} onRemove={(id) => { deleteFile(id); setSelectedAttachmentIds((cur) => cur.filter((x) => x !== id)); }} selected onSelect={(id) => { setSelectedAttachmentIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]); }} />)}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button type="button" onClick={onAttachClick} aria-label="Attach files" className="w-10 h-10 flex items-center justify-center border border-safe text-safe hover:bg-safe/10 focus:ring-2 focus:ring-safe/30">
            <Paperclip size={16} />
          </button>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={4000} placeholder="Ask about your academic life..." className="min-w-0 flex-1 resize-none bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-safe disabled:opacity-50" />
          <button type="button" onClick={() => void onSend()} disabled={sending && !selectedAttachmentIds.length} aria-label="Send" className="w-10 h-10 flex items-center justify-center border border-safe text-safe hover:bg-safe/10 disabled:opacity-40">
            <Send size={15} />
          </button>
        </div>
      </div>
    </AIFileDropzone>
  );
}
