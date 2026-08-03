import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronDown, Copy, FileText, LoaderCircle, MessageSquarePlus, Pencil, Send, Sparkles, Trash2, Upload, WandSparkles, Paperclip, Menu } from 'lucide-react';
import { useAIChats } from '../hooks/useAIChats';
import { useFileStorage } from '../hooks/useFileStorage';
import { useAuth } from '../context/AuthContext';
import { analyseAIImport, applyAIImport } from '../services/aiImportService.fixed';
import AIComposer from '../components/AIComposer';
import { readFileAsDataURL } from '../utils/notesUtils';
import MobileAIChatDrawer from '../components/MobileAIChatDrawer';
import type { AIImportPreview, AIImportTarget } from '../types/aiImport';
import type { AIMessage } from '../types/ai';

const QUICK_ACTIONS = [
  'Summarize Notes',
  'Generate Quiz',
  'Predict GPA',
  'Build Weekly Study Plan',
  "What's Due Today?",
  'Summarize PDF',
  'Explain Topic',
  'Generate Revision Plan',
  'Create CBT Questions',
  'Analyse Performance',
];

function MarkdownMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState<number | null>(null);
  const blocks = useMemo(() => content.split('```'), [content]);

  const copy = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return <div className="space-y-3 break-words">
    {blocks.map((block, index) => {
      if (index % 2 === 1) {
        const [language = '', ...codeLines] = block.replace(/^\n/, '').split('\n');
        const code = codeLines.join('\n');
        return <div key={index} className="relative border border-gray-800 bg-black/50 p-3 pr-12 overflow-x-auto"><span className="text-[9px] uppercase tracking-widest text-gray-600">{language || 'code'}</span><pre className="mt-2 text-[11px] text-gray-200 whitespace-pre-wrap font-mono">{code}</pre><button type="button" onClick={() => void copy(code, index)} aria-label="Copy code" className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-safe transition-colors">{copied === index ? <Check size={13} /> : <Copy size={13} />}</button></div>;
      }

      return block.split('\n').filter(Boolean).map((line, lineIndex) => {
        const key = `${index}-${lineIndex}`;
        if (line.startsWith('### ')) return <h4 key={key} className="font-bold text-white text-sm">{line.slice(4)}</h4>;
        if (line.startsWith('## ')) return <h3 key={key} className="font-bold text-white text-base">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={key} className="font-bold text-white text-lg">{line.slice(2)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={key} className="pl-4 before:content-['•'] before:mr-2 before:text-safe">{line.slice(2)}</p>;
        return <p key={key} className="leading-relaxed">{line.replace(/\*\*/g, '')}</p>;
      });
    })}
  </div>;
}

function ChatBubble({ message }: { message: AIMessage }) {
  const isAssistant = message.role === 'assistant';
  return <article className={`flex gap-3 ${isAssistant ? '' : 'justify-end'}`}>
    {isAssistant && <div className="mt-1 w-7 h-7 shrink-0 flex items-center justify-center border border-safe/40 bg-safe/10 text-safe"><Bot size={14} /></div>}
    <div className={`max-w-[90%] sm:max-w-[78%] border p-3 text-xs font-mono ${isAssistant ? 'border-gray-800 bg-surface text-gray-300' : 'border-safe/40 bg-safe/10 text-white'}`}>
      {isAssistant ? <MarkdownMessage content={message.content} /> : <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>}
    </div>
  </article>;
}

export default function AIAssistant() {
  const { chats, messages, activeChatId, setActiveChatId, loading, sending, error, startNewChat, sendMessage, renameChat, removeChat } = useAIChats();
  const { files, uploadFiles, getFilesForNote, deleteFile } = useFileStorage();
  const { user, session } = useAuth();
  const [draft, setDraft] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [aiFiles, setAiFiles] = useState<File[]>([]); // keep recently selected File objects for immediate analysis
  const [uploading, setUploading] = useState(false);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTarget, setImportTarget] = useState<AIImportTarget>('auto');
  const [importInstruction, setImportInstruction] = useState('');
  const [importPreview, setImportPreview] = useState<AIImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [applyingImport, setApplyingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pdfs = useMemo(() => files.filter((file) => file.type === 'application/pdf'), [files]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  const submit = async (content = draft) => {
    const message = content.trim();
    if (!message && selectedAttachmentIds.length === 0 && aiFiles.length === 0) return; // nothing to send
    if (sending) return;
    setDraft('');
    try {
      // If there are selected uploaded files, prefer sending their document IDs
      if (selectedAttachmentIds.length > 0) {
        await sendMessage(message || 'Please analyse attached documents.', selectedAttachmentIds[0]);
        setSelectedAttachmentIds([]);
        return;
      }

      // No uploaded selection, but there are local files (fallback): send inlineFiles as base64 (PDFs only supported here)
      if (aiFiles.length > 0) {
        // convert File[] to inlineFiles
        const inlineFiles: Array<{ name?: string; type?: string; data?: string }> = [];
        for (const f of aiFiles) {
          try {
            const dataUrl = await readFileAsDataURL(f);
            const base64 = dataUrl.split(',')[1] ?? '';
            inlineFiles.push({ name: f.name, type: f.type, data: base64 });
          } catch (err) {
            console.warn('Failed to read local file for inline upload', { name: f.name });
          }
        }
        // For now, skip inline file upload since it's not in the old working code
        console.warn('Inline file upload not supported in current version');
        setAiFiles([]);
        return;
      }

      // Default: simple message
      await sendMessage(message);
    } catch (err) {
      setDraft(message);
      console.error(err);
    }
  };

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); void submit(); };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); }
  };
  const analyseImport = async () => {
    if (!importFile || !session?.access_token) { setImportError(importFile ? 'Your session has expired. Please sign in again.' : 'Choose a document to import.'); return; }
    setImporting(true); setImportError(null); setImportSuccess(null);
    try { setImportPreview(await analyseAIImport(session.access_token, importFile, importTarget, importInstruction)); }
    catch (cause) { setImportPreview(null); setImportError(cause instanceof Error ? cause.message : 'Unable to analyse this document.'); }
    finally { setImporting(false); }
  };

  // Attachment / upload handlers
  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !user) return;
    const arr = Array.from(fileList);
    setUploading(true);
    setAiFiles((cur) => [...arr, ...cur].slice(0, 8));
    try {
      console.info('Starting file upload batch.', { fileCount: arr.length, noteId: 'ai' });
      const { succeeded, rejected, inlineFallbackFiles } = await uploadFiles('ai', arr);
      // reset file input so selecting same file again works
      try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}

      if (rejected && rejected.length) {
        console.warn('Some files were rejected during upload.', { rejected });
        alert(`Some files failed to upload:\n- ${rejected.join('\n- ')}`);
      }

      if (inlineFallbackFiles && inlineFallbackFiles.length) {
        console.info('Using inline fallback for files due to storage issues.', { fallbackCount: inlineFallbackFiles.length });
        // Keep the local files for inline processing
        setAiFiles((cur) => [...inlineFallbackFiles, ...cur].slice(0, 8));
      }

      // auto-select newly uploaded files for the next message
      if (succeeded && succeeded.length) {
        const storageUploads = succeeded.filter(f => !(f as any)._inlineFallback);
        const inlineFallbacks = succeeded.filter(f => (f as any)._inlineFallback);
        
        if (storageUploads.length) {
          setSelectedAttachmentIds((cur) => [...cur, ...storageUploads.map((s) => s.id)]);
          console.info('Auto-selected storage uploaded files.', { count: storageUploads.length });
        }
        
        if (inlineFallbacks.length) {
          console.info('Inline fallback files ready for processing.', { count: inlineFallbacks.length });
        }
      }

      if ((!succeeded || succeeded.length === 0) && (!rejected || rejected.length === 0)) {
        console.warn('No files were processed in upload batch.');
        alert('No files were uploaded. Please check your network and try again.');
      }
    } catch (err) {
      console.error('Upload batch failed with unexpected error.', err);
      alert(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    const dt = event.dataTransfer;
    await handleFilesSelected(dt.files);
  };
  const handleDragOver = (event: any) => { event.preventDefault(); };

  const fetchSignedUrlAsFile = async (fileMeta: { id: string, name: string, dataURL?: string, type?: string }) => {
    if (!fileMeta.dataURL) throw new Error('No signed URL available');
    const res = await fetch(fileMeta.dataURL);
    const blob = await res.blob();
    return new File([blob], fileMeta.name, { type: fileMeta.type ?? undefined });
  };

  const handleQuickActionForFile = async (action: string, fileMeta: any) => {
    try {
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
      // PDFs: use documentId in chat request
      if (fileMeta.type === 'application/pdf') {
        await sendMessage(action === 'Summarize' ? 'Summarize this document.' : action, fileMeta.id);
        return;
      }
      // other files: fetch file blob and run analyseAIImport then send a message with the preview summary
      const fileObj = await fetchSignedUrlAsFile(fileMeta);
      const preview = await analyseAIImport(session.access_token, fileObj, 'auto', 'Summarise the document');
      await sendMessage(preview.summary, undefined);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Unable to process this file.');
    }
  };

  const confirmImport = async () => {
    if (!user || !importPreview) return;
    setApplyingImport(true); setImportError(null);
    try {
      const imported = await applyAIImport(user.id, importPreview);
      if (!imported) throw new Error('No valid entries were found. Review the document and try a clearer scan.');
      setImportSuccess(`${imported} ${importPreview.target === 'gpa' ? 'semester' : 'item'}${imported === 1 ? '' : 's'} added to ${importPreview.target}. You can edit them on that page.`);
      setImportPreview(null); setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = '';
    } catch (cause) { setImportError(cause instanceof Error ? cause.message : 'Unable to apply this import.'); }
    finally { setApplyingImport(false); }
  };
  const clearActiveChat = async () => { if (activeChatId && window.confirm('Delete this conversation and all of its messages?')) await removeChat(activeChatId); };
  const renameActiveChat = async () => {
    const activeChat = chats.find((chat) => chat.id === activeChatId);
    if (!activeChat) return;
    const title = window.prompt('Conversation name', activeChat.title);
    if (title?.trim()) await renameChat(activeChat.id, title);
  };

  return <div className="flex h-[calc(100vh-7rem)] min-h-[560px] max-w-6xl mx-auto border border-gray-800 bg-void font-mono overflow-hidden">
    <aside className="hidden sm:flex w-52 sm:w-64 shrink-0 border-r border-gray-800 bg-surface/50 flex flex-col">
      <div className="p-3 border-b border-gray-800"><button type="button" onClick={startNewChat} className="w-full flex items-center justify-center gap-2 border border-safe text-safe px-3 py-2 text-[10px] uppercase tracking-widest hover:bg-safe/10 transition-colors"><MessageSquarePlus size={14} /> New chat</button></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? <p className="p-3 text-[10px] uppercase tracking-widest text-gray-600">Loading chats...</p> : chats.length === 0 ? <p className="p-3 text-[10px] leading-relaxed text-gray-600">Your conversations will appear here.</p> : chats.map((chat) => <button key={chat.id} type="button" onClick={() => setActiveChatId(chat.id)} className={`w-full text-left px-3 py-2 border text-[10px] truncate transition-colors ${activeChatId === chat.id ? 'border-safe/40 bg-safe/10 text-safe' : 'border-transparent text-gray-500 hover:border-gray-700 hover:text-gray-200'}`}>{chat.title}</button>)}
      </div>
      {activeChatId && <div className="p-2 border-t border-gray-800 flex gap-1"><button type="button" onClick={() => void renameActiveChat()} className="flex-1 flex justify-center p-2 text-gray-500 hover:text-safe" aria-label="Rename conversation"><Pencil size={13} /></button><button type="button" onClick={() => void clearActiveChat()} className="flex-1 flex justify-center p-2 text-gray-500 hover:text-panic" aria-label="Delete conversation"><Trash2 size={13} /></button></div>}
    </aside>

    <section className="min-w-0 flex-1 flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button className="sm:hidden p-1 text-gray-400 hover:text-safe" aria-label="Open conversations" onClick={() => setMobileDrawerOpen(true)}><Menu size={18} /></button>
        <div className="w-8 h-8 border border-safe/40 bg-safe/10 text-safe flex items-center justify-center"><Sparkles size={16} /></div>
        <div className="min-w-0 flex-1"><h1 className="text-sm font-bold uppercase tracking-widest text-white">AI Assistant</h1><p className="text-[9px] uppercase tracking-widest text-gray-600 truncate">Your private academic copilot</p></div>
        <button type="button" onClick={() => setImportOpen((open) => !open)} className="shrink-0 inline-flex items-center gap-1.5 border border-gray-700 px-2.5 py-2 text-[9px] uppercase tracking-widest text-gray-400 hover:border-safe hover:text-safe"><Upload size={12} /> {importOpen ? 'Hide import' : 'Import document'}</button>
      </header>
      <div className="px-3 py-2 border-b border-gray-900 flex gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_ACTIONS.map((action) => <button key={action} type="button" disabled={sending} onClick={() => void submit(action)} className="shrink-0 border border-gray-800 px-2 py-1 text-[9px] uppercase tracking-wider text-gray-500 hover:border-safe/40 hover:text-safe disabled:opacity-50">{action}</button>)}
      </div>
      {importOpen && (<>
      <div className="border-b border-gray-800 bg-surface/30 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-safe"><WandSparkles size={12} /> AI document import</p><p className="mt-1 text-[10px] text-gray-600">Upload a PDF, image, text file, or CSV. Review extracted data before it is added.</p></div>
          <input ref={importInputRef} type="file" accept="application/pdf,image/*,text/plain,text/csv,.csv" className="hidden" onChange={(event) => { setImportFile(event.target.files?.[0] ?? null); setImportPreview(null); setImportError(null); setImportSuccess(null); }} />
          <button type="button" onClick={() => importInputRef.current?.click()} disabled={importing || applyingImport} className="shrink-0 inline-flex items-center justify-center gap-1.5 border border-gray-700 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 hover:border-safe hover:text-safe disabled:opacity-50"><Upload size={13} /> {importFile ? importFile.name : 'Choose file'}</button>
        </div>
        <label className="mt-2 block">
          <span className="text-[9px] uppercase tracking-widest text-gray-600">Tell AI what to extract (optional)</span>
          <input value={importInstruction} onChange={(event) => setImportInstruction(event.target.value)} maxLength={1000} disabled={importing || applyingImport} placeholder="Example: Extract only records for matric number 23." className="mt-1 w-full bg-void border border-gray-800 px-3 py-2 text-xs text-gray-200 placeholder:text-gray-700 outline-none focus:border-safe disabled:opacity-50" />
        </label>        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select value={importTarget} onChange={(event) => { setImportTarget(event.target.value as AIImportTarget); setImportPreview(null); }} disabled={importing || applyingImport} className="bg-void border border-gray-800 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-300 outline-none focus:border-safe"><option value="auto">Detect destination automatically</option><option value="timetable">Timetable</option><option value="exams">Exams</option><option value="assignments">Assignments</option><option value="gpa">GPA</option><option value="notes">Notes</option></select>
          <button type="button" onClick={() => void analyseImport()} disabled={!importFile || importing || applyingImport} className="inline-flex items-center justify-center gap-1.5 border border-safe px-3 py-2 text-[10px] uppercase tracking-widest text-safe hover:bg-safe/10 disabled:opacity-40"><WandSparkles size={13} /> {importing ? 'Analysing...' : 'Analyse document'}</button>
        </div>
        {importError && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-panic"><AlertTriangle size={12} /> {importError}</p>}
        {importSuccess && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-safe"><CheckCircle2 size={12} /> {importSuccess}</p>}
        {importPreview && <div className="mt-3 border border-safe/30 bg-black/20 p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-widest text-safe">Review import: {importPreview.target}</p><p className="mt-1 text-xs text-gray-300">{importPreview.summary}</p>{importPreview.warnings.map((warning, index) => <p key={index} className="mt-1 text-[10px] text-caution">Warning: {warning}</p>)}</div><button type="button" onClick={() => void confirmImport()} disabled={applyingImport} className="shrink-0 inline-flex items-center justify-center gap-1.5 border border-safe px-3 py-2 text-[10px] uppercase tracking-widest text-safe hover:bg-safe/10 disabled:opacity-50"><Check size={13} /> {applyingImport ? 'Saving...' : `Apply ${importPreview.items.length} item${importPreview.items.length === 1 ? '' : 's'}`}</button></div><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap border border-gray-800 bg-void p-2 text-[10px] text-gray-400">{JSON.stringify(importPreview.items, null, 2)}</pre></div>}
      </div>
      </>)}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {!activeChatId && messages.length === 0 && !sending && <div className="h-full min-h-64 flex flex-col items-center justify-center text-center"><div className="w-14 h-14 mb-5 border-2 border-safe/40 bg-safe/10 flex items-center justify-center text-safe"><Bot size={26} /></div><h2 className="text-lg font-bold uppercase text-white">How can I help you study?</h2><p className="mt-3 max-w-md text-xs leading-relaxed text-gray-500">Ask about your real timetable, assignments, exams, GPA, notes, or attach an uploaded PDF for focused help.</p></div>}
        {messages.map((message) => <ChatBubble key={message.id} message={message} />)}
        {sending && <div className="flex items-center gap-2 text-safe text-[10px] uppercase tracking-widest"><LoaderCircle size={14} className="animate-spin" /> Analysing your academic context...</div>}
        {error && <div className="border border-panic/40 bg-panic/5 p-3 text-panic text-[10px] uppercase tracking-wider">{error}</div>}
        <div ref={endRef} />
      </div>
      {/* Composer component - unified composer */}
      <AIComposer
        draft={draft}
        setDraft={setDraft}
        sending={sending}
        uploading={uploading}
        onSend={() => void submit()}
        fileInputRef={fileInputRef}
        handleFilesSelected={handleFilesSelected}
        getFilesForNote={getFilesForNote}
        selectedAttachmentIds={selectedAttachmentIds}
        setSelectedAttachmentIds={setSelectedAttachmentIds}
        deleteFile={deleteFile}
      />

      <MobileAIChatDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} chats={chats} activeChatId={activeChatId} onSelectChat={(id) => setActiveChatId(id)} onNewChat={startNewChat} onRename={(id) => renameChat(id, window.prompt('Conversation name') ?? '')} onDelete={removeChat} />

    </section>
  </div>;
}
