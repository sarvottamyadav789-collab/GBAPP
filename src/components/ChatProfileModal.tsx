import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  User,
  Check,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface StudentProfileData {
  name: string;
  age: string;
  avatar: string;
}

interface ChatProfileModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  initialProfile?: StudentProfileData | null;
  onSave: (profile: StudentProfileData) => void;
  onClose?: () => void;
}

// Preset modern student avatars for fast selection
const PRESET_AVATARS = [
  { id: 'av-1', label: 'Topper Boy', emoji: '👨‍🎓', bg: 'from-blue-500 to-sky-600' },
  { id: 'av-2', label: 'Scholar Girl', emoji: '👩‍🎓', bg: 'from-pink-500 to-rose-600' },
  { id: 'av-3', label: 'Coder', emoji: '🧑‍💻', bg: 'from-emerald-500 to-teal-600' },
  { id: 'av-4', label: 'Scientist', emoji: '👩‍🔬', bg: 'from-purple-500 to-indigo-600' },
  { id: 'av-5', label: 'Aspirant', emoji: '🎯', bg: 'from-amber-500 to-orange-600' },
  { id: 'av-6', label: 'Champion', emoji: '⚡', bg: 'from-cyan-500 to-blue-600' },
];

export const ChatProfileModal: React.FC<ChatProfileModalProps> = ({
  isOpen,
  isMandatory = true,
  initialProfile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState(initialProfile?.age || '');
  const [avatar, setAvatar] = useState(initialProfile?.avatar || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('कृपया कोई मान्य फोटो या इमेज फ़ाइल चुनें');
      return;
    }

    setIsProcessingPhoto(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & crop avatar to compact 250x250 square for crisp clarity
        const canvas = document.createElement('canvas');
        const size = 250;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(dataUrl);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setIsProcessingPhoto(false);
        setErrorMsg('फ़ोटो लोड करने में त्रुटि हुई');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_AVATARS[0]) => {
    // Generate high-resolution SVG avatar
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0369a1"/></linearGradient></defs><rect width="200" height="200" rx="100" fill="url(#g)"/><text x="50%" y="54%" font-size="95" text-anchor="middle" dominant-baseline="middle">${preset.emoji}</text></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    setAvatar(dataUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanAge = age.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)');
      return;
    }

    const numAge = parseInt(cleanAge, 10);
    if (!cleanAge || isNaN(numAge) || numAge < 8 || numAge > 80) {
      setErrorMsg('कृपया अपनी मान्य उम्र (Age) दर्ज करें (उदा. 18)');
      return;
    }

    if (!avatar) {
      setErrorMsg('कृपया अपनी प्रोफ़ाइल फ़ोटो अपलोड करें या नीचे से अवतार चुनें');
      return;
    }

    setErrorMsg('');
    onSave({
      name: cleanName,
      age: cleanAge,
      avatar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[32px] bg-[#0e1422] border-2 border-sky-500/40 p-6 flex flex-col shadow-[0_20px_60px_rgba(56,189,248,0.25)] relative max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Optional close button if not strictly mandatory (e.g. edit profile) */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400/20 to-blue-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 mb-3 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            GB Chat Student Verification
          </h3>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            चैट बॉक्स में प्रवेश करने के लिए अपना <b className="text-sky-300">नाम</b>, <b className="text-amber-300">उम्र</b> और <b className="text-emerald-300">फ़ोटो</b> सेट करें
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Avatar Upload / Selector */}
          <div className="flex flex-col items-center space-y-2.5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-sky-400/80 bg-black/60 p-1 shadow-lg flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Student Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <User className="w-9 h-9 text-slate-400" />
                    <span className="text-[9px] font-bold mt-0.5 text-slate-400">फ़ोटो चुनें</span>
                  </div>
                )}
              </div>

              {/* Camera icon button to trigger upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="फोटो अपलोड करें"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{avatar ? 'फ़ोटो बदलें (Change)' : 'फ़ोटो अपलोड करें'}</span>
              </button>
            </div>

            {/* Quick Avatar Presets */}
            <div className="w-full pt-1">
              <div className="text-[11px] font-bold text-slate-400 text-center mb-1.5">
                या नीचे से कोई भी छात्र अवतार चुनें:
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-sky-500/20 border border-slate-700 hover:border-sky-400 text-lg flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title={p.label}
                  >
                    {p.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              आपका पूरा नाम (Student Name) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. राहुल कुमार / अमन यादव"
              className="w-full px-4 py-2.5 rounded-xl bg-[#162035] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 font-medium"
            />
          </div>

          {/* Student Age (Umar) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                आपकी उम्र (Age in Years) *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">उदा. 16, 18, 21</span>
            </div>
            <input
              type="number"
              required
              min="8"
              max="80"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="अपनी उम्र लिखें (उदा. 18)"
              className="w-full px-4 py-2.5 rounded-xl bg-[#162035] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400 font-medium"
            />

            {/* Quick Age Chips */}
            <div className="flex gap-1.5 mt-2">
              {['16', '17', '18', '19', '20', '22'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAge(val)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    age === val
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit & Enter Chat Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_rgba(56,189,248,0.3)] transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>प्रोफ़ाइल सेव करें और चैट में प्रवेश करें 🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
};
