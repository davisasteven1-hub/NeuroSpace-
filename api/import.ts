import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from '../src/types/database';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
const TARGETS = ['auto', 'timetable', 'exams', 'assignments', 'gpa', 'notes'] as const;
type Target = typeof TARGETS[number];
type VercelRequest = IncomingMessage & { body?: unknown };
type ImportRequest = { target?: unknown; fileName?: unknown; mimeType?: unknown; data?: unknown; instruction?: unknown };

export const runtime = 'nodejs';
export const maxDuration = 60;

function sendJson(response: ServerResponse, body: unknown, status = 200): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

function token(request: VercelRequest): string | null {
  const value = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7).trim() || null : null;
}

async function body(request: VercelRequest): Promise<ImportRequest | null> {
  if (request.body && typeof request.body === 'object') return request.body as ImportRequest;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body) as ImportRequest; } catch { return null; }
  }
  return new Promise((resolve) => {
    let raw = '';
    request.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    request.on('end', () => { try { resolve(raw ? JSON.parse(raw) as ImportRequest : null); } catch { resolve(null); } });
    request.on('error', () => resolve(null));
  });
}

function isTarget(value: unknown): value is Target {
  return typeof value === 'string' && (TARGETS as readonly string[]).includes(value);
}

async function gemini(apiKey: string, model: string, payload: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Document analysis took too long. Try a smaller or clearer file.');
    throw new Error('Unable to reach Gemini for document analysis.');
  } finally { clearTimeout(timeout); }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('AI import Gemini rejection.', { status: response.status, model, detail: detail.slice(0, 1000) });
    if (response.status === 429) throw new Error('Gemini quota is currently exhausted. Try again later.');
    if (response.status === 404) throw new Error(`The configured Gemini model "${model}" is unavailable. Update GEMINI_MODEL in Vercel.`);
    throw new Error('Gemini could not analyse this document.');
  }
  return response.json();
}

function parseJson(payload: unknown): unknown {
  const response = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!raw) throw new Error('Gemini returned no import data.');
  const json = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(json); } catch { throw new Error('Gemini returned invalid import data. Please try another scan.'); }
}

export default async function handler(request: VercelRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST') { sendJson(response, { error: 'Method not allowed.' }, 405); return; }
  try {
    const accessToken = token(request);
    if (!accessToken) { sendJson(response, { error: 'Please sign in to import study documents.' }, 401); return; }
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    if (!supabaseUrl || !supabaseAnonKey || !apiKey) throw new Error('AI import configuration is incomplete.');
    const auth = createClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await auth.auth.getUser(accessToken);
    if (authError || !authData.user) { sendJson(response, { error: 'Your session has expired. Please sign in again.' }, 401); return; }
    const input = await body(request);
    if (!input || !isTarget(input.target) || typeof input.fileName !== 'string' || typeof input.mimeType !== 'string' || typeof input.data !== 'string' || (input.instruction !== undefined && typeof input.instruction !== 'string')) {
      sendJson(response, { error: 'Invalid import request.' }, 400); return;
    }
    const byteLength = Buffer.byteLength(input.data, 'base64');
    if (!byteLength || byteLength > MAX_FILE_BYTES) { sendJson(response, { error: 'Import files must be 4 MB or smaller.' }, 400); return; }
    const accepted = input.mimeType === 'application/pdf' || input.mimeType.startsWith('image/') || input.mimeType === 'text/plain' || input.mimeType === 'text/csv';
    if (!accepted) { sendJson(response, { error: 'Upload a PDF, image, text file, or CSV file for AI import.' }, 400); return; }

    const instruction = `You are extracting academic records from an uploaded document for NeuroSpace. Determine the best target when target is auto. Return ONLY valid JSON with this exact top-level shape: {"target":"timetable|exams|assignments|gpa|notes","summary":"short description","warnings":["uncertainties"],"items":[...]}. Never invent dates, grades, times, units, course codes, or names. Omit unreadable fields and add a warning. For timetable item fields use code,title,units,type(core|gst|lab),lecturer,venue,day,start(HH:MM),end(HH:MM). Use full English day names only: Monday, Tuesday, Wednesday, Thursday, Friday, or Saturday; never abbreviations such as MON or TUE. For exams use course_code,course_name,date(YYYY-MM-DD),time(HH:MM),duration,venue,instructor,notes,urgency. For assignments use title,courseCode,courseName,dueDate(YYYY-MM-DD),dueTime(HH:MM),priority,notes. For GPA use one item per semester with level,term,courses:[{code,title,units,grade(A-F),remarks}]. For notes use title,content,tags. Requested target: ${input.target}. User selection instruction: ${typeof input.instruction === 'string' && input.instruction.trim() ? input.instruction.trim().slice(0, 1000) : 'None'}. Follow the selection instruction exactly. If it identifies a specific student, matric number, name, course, or row, extract only matching records. Do not infer a match when the requested identifier is absent; return no items and add a warning instead.`;
    const result = await gemini(apiKey, model, {
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [{ text: `Analyse this file: ${input.fileName}` }, { inlineData: { mimeType: input.mimeType, data: input.data } }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
    });
    const preview = parseJson(result);
    console.info('AI import analysed.', { userId: authData.user.id, target: input.target, model });
    sendJson(response, { preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyse this document.';
    console.error('AI import failed.', { message });
    sendJson(response, { error: message }, 500);
  }
}
