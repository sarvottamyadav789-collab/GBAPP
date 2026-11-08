import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  X,
  Crown,
  CheckCheck,
  Trash2,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { ChatMessage } from '../types.ts';
import {
  subscribeToMessages,
  sendMessageToDb,
  deleteMessageFromDb,
} from '../services/firestoreService.ts';
import { ChatProfileModal, StudentProfileData } from './ChatProfileModal.tsx';

interface GBChatProps {
  currentUser: {
    name: string;
    id: string;
    isOwner?: boolean;
    isAdmin?: boolean;
    email?: string;
  };
}

export const GBChat: React.FC<GBChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Student Profile State (Mandatory Gate: Name, Age, Profile Photo)
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(() => {
    if (currentUser.isOwner) {
      return {
        name: currentUser.name || 'Sarvottam Yadav',
        age: 'Owner',
        avatar: '/assets/gb_study_icon.png',
      };
    }
    try {
      const saved = localStorage.getItem('gb_student_chat_profile');
      if (saved) {
        const parsed = JSON.parse(saved) as StudentProfileData;
        if (parsed.name && parsed.age && parsed.avatar) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [showProfileModal, setShowProfileModal] = useState(() => {
    // If not owner and profile is missing, open mandatory gate modal immediately
    return !currentUser.isOwner && !studentProfile;
  });

  // Subscribe to real-time messages from Firestore
  useEffect(() => {
    const unsub = subscribeToMessages((liveMessages) => {
      setMessages(liveMessages);
    });
    return () => unsub();
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('कृपया कोई फ़ोटो फ़ाइल चुनें');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setAttachedImage(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (profile: StudentProfileData) => {
    setStudentProfile(profile);
    try {
      localStorage.setItem('gb_student_chat_profile', JSON.stringify(profile));
    } catch (e) {}
    setShowProfileModal(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce Profile Gate: Cannot send message without completing profile
    if (!currentUser.isOwner && (!studentProfile || !studentProfile.name || !studentProfile.age || !studentProfile.avatar)) {
      setShowProfileModal(true);
      return;
    }

    const textToSend = inputText.trim();
    const imageToSend = attachedImage;
    if (!textToSend && !imageToSend) return;

    const senderName = studentProfile?.name || currentUser.name || 'Student';
    const senderAge = studentProfile?.age || undefined;
    const senderAvatar = studentProfile?.avatar || (currentUser.isOwner ? '/assets/gb_study_icon.png' : undefined);

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      text: textToSend || undefined,
      imageUrl: imageToSend || undefined,
      senderName,
      senderAge,
      senderId: currentUser.id || 'student-user',
      senderEmail: currentUser.email || '',
      isOwner: currentUser.isOwner || false,
      isAdmin: currentUser.isAdmin || false,
      avatar: senderAvatar,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update: instantly append to chat so it shows up immediately
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setInputText('');
    setAttachedImage(null);
    setIsSending(true);

    try {
      await sendMessageToDb(newMsg);
    } catch (err) {
      console.error('Failed to send message to Firestore, kept in local session:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm('Delete this message?')) {
      try {
        await deleteMessageFromDb(msgId);
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isProfileComplete = Boolean(currentUser.isOwner || (studentProfile && studentProfile.name && studentProfile.age && studentProfile.avatar));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a11] text-white relative overflow-hidden select-text">
      {/* MANDATORY STUDENT PROFILE REGISTRATION GATE */}
      <ChatProfileModal
        isOpen={showProfileModal || !isProfileComplete}
        isMandatory={!isProfileComplete}
        initialProfile={studentProfile}
        onSave={handleSaveProfile}
        onClose={() => {
          if (isProfileComplete) {
            setShowProfileModal(false);
          }
        }}
      />

      {/* Telegram-style Top Header */}
      <div className="px-3.5 py-2.5 bg-[#0f1422] border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-sky-400/40 p-0.5 bg-black shrink-0">
            <img
              src="/assets/gb_study_icon.png"
              alt="Group Icon"
              className="w-full h-full object-cover rounded-full"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white leading-tight truncate">
                GB Study Group
              </h2>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                Official
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="text-emerald-400 font-bold">128 online</span>
              <span>•</span>
              <span>3,420 members</span>
            </div>
          </div>
        </div>

        {/* Student Profile Badge with Edit Button */}
        {studentProfile ? (
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#162035] border border-slate-700/80 hover:border-sky-400/60 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="प्रोफ़ाइल बदलें"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-sky-400/60 bg-black shrink-0">
              <img
                src={studentProfile.avatar || '/assets/gb_study_icon.png'}
                alt="My Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white max-w-[80px] truncate leading-tight">
                {studentProfile.name}
              </span>
              {studentProfile.age && studentProfile.age !== 'Owner' && (
                <span className="text-[9px] text-sky-300 font-semibold leading-none">
                  {studentProfile.age} वर्ष
                </span>
              )}
            </div>
            <Edit2 className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        ) : (
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>प्रोफ़ाइल बनाएँ</span>
          </button>
        )}
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {/* Date Divider */}
        <div className="flex justify-center my-1.5">
          <span className="px-3 py-0.5 rounded-full bg-[#12192a]/90 border border-slate-800 text-[10px] font-semibold text-slate-400 shadow-sm">
            Today
          </span>
        </div>

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser.id;
          const isOwnerMsg = msg.isOwner || msg.senderEmail === 'sarvottamyadav789@gmail.com';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Circular Avatar of the sender */}
              <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 bg-black/60 shrink-0 p-0.5 shadow-sm mb-1">
                <img
                  src={msg.avatar || (isOwnerMsg ? '/assets/gb_study_icon.png' : '/assets/gb_study_icon.png')}
                  alt={msg.senderName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[82%] rounded-[20px] p-3 shadow-md relative transition-all ${
                  isMine
                    ? 'bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-br-xs'
                    : isOwnerMsg
                    ? 'bg-[#151c2d] border border-amber-500/50 text-slate-100 rounded-bl-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : 'bg-[#141b2a] border border-slate-800 text-slate-100 rounded-bl-xs'
                }`}
              >
                {/* Sender Name, Age & Badges */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        isMine
                          ? 'text-sky-200'
                          : isOwnerMsg
                          ? 'text-amber-400 font-black flex items-center gap-1'
                          : 'text-sky-400'
                      }`}
                    >
                      {msg.senderName}
                    </span>

                    {/* Age Badge */}
                    {msg.senderAge && !isOwnerMsg && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                        {msg.senderAge} yr
                      </span>
                    )}

                    {/* Owner Crown */}
                    {isOwnerMsg && (
                      <span className="px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[9px] tracking-wider uppercase flex items-center gap-0.5 shadow-sm">
                        <Crown className="w-2.5 h-2.5" />
                        <span>Owner</span>
                      </span>
                    )}
                  </div>

                  {/* Delete button (Owner or Sender) */}
                  {(isMine || currentUser.isOwner) && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity p-0.5"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Attached Photo */}
                {msg.imageUrl && (
                  <div
                    onClick={() => setSelectedImageModal(msg.imageUrl || null)}
                    className="rounded-xl overflow-hidden my-1.5 cursor-pointer max-h-60 bg-black/40 border border-black/30"
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Attachment"
                      className="w-full h-full object-cover rounded-xl hover:scale-102 transition-transform"
                    />
                  </div>
                )}

                {/* Message Text */}
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Timestamp & Read Checkmark */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMine ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  <span>{formatTime(msg.createdAt)}</span>
                  <CheckCheck className="w-3 h-3 text-sky-300" />
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview before Sending */}
      {attachedImage && (
        <div className="px-4 py-2 bg-[#0e1422] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-sky-400/50 bg-black">
              <img
                src={attachedImage}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-sky-300 font-medium">Photo attached</span>
          </div>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Telegram-style Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[#0e1422] border-t border-slate-800/90 flex items-center gap-2 shrink-0 mb-20 relative z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
      >
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Attach Photo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Input Text Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            currentUser.isOwner
              ? 'Write message as Sarvottam Yadav (Owner 👑)...'
              : 'Write a message to GB Study students...'
          }
          className="flex-1 px-4 py-2.5 rounded-full bg-[#162035] border border-slate-700/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && !attachedImage)}
          className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center transition-all disabled:opacity-40 shadow-md cursor-pointer active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4 fill-current translate-x-0.5" />
        </button>
      </form>

      {/* Fullscreen Image Preview Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg max-h-[85vh]">
            <img
              src={selectedImageModal}
              alt="Full Preview"
              className="w-full h-full object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
