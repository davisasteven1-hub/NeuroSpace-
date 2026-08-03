import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, LogOut, Save, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { verifyAdminAccess } from '../services/adminApi';

export default function Settings() {
  const { user, session, profile, avatarUrl, signOut, updateCurrentProfile, uploadAvatar, removeAvatar } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOwnerTools, setShowOwnerTools] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  useEffect(() => {
    let cancelled = false;

    const loadOwnerTools = async () => {
      if (!session?.access_token || !user) {
        if (!cancelled) setShowOwnerTools(false);
        return;
      }

      try {
        const result = await verifyAdminAccess(session.access_token);
        const isOwnerAdmin = result.authenticatedUserId === user.id && result.adminUserId === user.id;
        if (!cancelled) setShowOwnerTools(isOwnerAdmin);
      } catch {
        if (!cancelled) setShowOwnerTools(false);
      }
    };

    void loadOwnerTools();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, user]);

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateCurrentProfile(displayName);
      setMessage('Display name saved.');
    } catch {
      setError('Unable to save display name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const uploadPicture = async (file: File) => {
    if (!user || !file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) {
      setError('Choose an image smaller than 4MB.');
      return;
    }

    setSaving(true);
    setError('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await uploadAvatar(String(reader.result));
        setMessage('Profile picture updated.');
      } catch {
        setError('Profile image upload failed. Please try again.');
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => {
      setSaving(false);
      setError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  const deletePicture = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await removeAvatar();
      setMessage('Profile picture removed.');
    } catch {
      setError('Unable to remove profile picture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 font-display">
      <div className="border-b border-gray-800 pb-4">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
          Account Control
        </span>
        <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
          Settings
        </h1>
      </div>

      <section className="flex flex-col gap-5 border border-gray-800 bg-surface p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative h-20 w-20 overflow-hidden border-2 border-gray-800 bg-void hover:border-safe"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="m-auto text-gray-600" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100">
              <Camera size={18} className="text-safe" />
            </span>
          </button>

          <div>
            <p className="text-sm font-bold text-white">Profile picture</p>
            <p className="mt-1 font-mono text-xs text-gray-500">Image files up to 4MB.</p>
            {avatarUrl && (
              <button
                type="button"
                onClick={deletePicture}
                className="mt-2 text-[10px] uppercase tracking-widest text-panic"
              >
                Remove picture
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadPicture(file);
              event.target.value = '';
            }}
          />
        </div>

        <form onSubmit={saveName} className="flex flex-col gap-3">
          <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Display Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              className="mt-1.5 w-full border border-gray-800 bg-void px-3 py-2 text-xs text-gray-200 outline-none focus:border-safe"
            />
          </label>

          <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Email
            <input
              value={user?.email ?? ''}
              disabled
              className="mt-1.5 w-full border border-gray-900 bg-void px-3 py-2 text-xs text-gray-500 outline-none"
            />
          </label>

          <button
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 border border-safe px-4 py-2 text-[10px] uppercase tracking-widest text-safe disabled:opacity-50 sm:w-auto sm:self-start"
          >
            <Save size={13} />
            Save profile
          </button>
        </form>

        {error && <p className="font-mono text-xs text-panic">{error}</p>}
        {message && <p className="font-mono text-xs text-safe">{message}</p>}
      </section>

      {showOwnerTools && (
        <section className="flex flex-col gap-3 border border-safe/40 bg-surface p-5 shadow-[0_0_24px_rgba(34,197,94,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-safe/40 bg-safe/10 text-safe">
              <Shield size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-safe">Owner Tools</h2>
              <p className="mt-1 font-mono text-xs text-gray-500">
                Restricted control surface for owner-level administration only.
              </p>
            </div>
          </div>

          <Link
            to="/admin/dashboard"
            className="flex w-full items-center justify-center gap-2 border border-safe bg-safe/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-safe transition-colors hover:bg-safe/15 sm:w-auto sm:self-start"
          >
            <Shield size={14} />
            Admin Control Center
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-3 border border-panic/40 bg-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-panic">Session</h2>
        <p className="font-mono text-xs text-gray-500">Sign out securely on this device.</p>
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 border border-panic px-4 py-2 text-[10px] uppercase tracking-widest text-panic sm:w-auto sm:self-start"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </section>
    </div>
  );
}
