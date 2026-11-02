import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Message } from '../../types';
import { StorageService } from '../../services/storage';
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  CheckCheck,
  Search,
  MessageCircle,
  PhoneCall,
  X
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const ChatView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    activeChatUserId, 
    setActiveChatUserId,
    setViewingProfileUserId,
    dataVersion,
    sendMessageToServer,
    markConversationRead
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; partnerName: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active chat partner
  const activePartner: User | undefined = users.find((u) => u.id === activeChatUserId);

  // Dynamic conversation ID: deterministic, symmetric between two users
  const getConvId = (userId1: string, userId2: string) => {
    return `conv_${[userId1, userId2].sort().join('_')}`;
  };

  const activeConvId = currentUser && activePartner ? getConvId(currentUser.id, activePartner.id) : null;

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConvId) {
      const msgs = StorageService.getConversationMessages(activeConvId);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
    if (activeConvId && activeChatUserId) markConversationRead(activeChatUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, activeChatUserId, dataVersion]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend?: string, imgUrl?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() && !imgUrl) return;
    if (!currentUser || !activeConvId || !activePartner) return;

    // Save sent message to database/storage
    const newMsg = StorageService.sendMessage(activeConvId, currentUser.id, text, imgUrl);
    setMessages((prev) => [...prev, newMsg]);
    sendMessageToServer(activePartner.id, { id: newMsg.id, text, imageUrl: imgUrl });
    setInputText('');
  };

  const sendVoiceNote = () => {
    handleSendMessage('🎤 Voice Message (0:14) [Audio Note]');
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSendMessage('Nagpadala ng larawan 📸', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Other registered users excluding current user
  const otherUsers = useMemo(() => {
    return users.filter((u) => u.id !== currentUser?.id);
  }, [users, currentUser]);

  // Active online users (excluding current user)
  const onlineUsers = useMemo(() => {
    return otherUsers.filter((u) => u.isOnline);
  }, [otherUsers]);

  // Active conversations with existing messages
  const activeConversations = useMemo(() => {
    if (!currentUser) return [];
    const allMsgs = StorageService.getMessagesMap();
    const list: { partner: User; lastMsg: Message; unreadCount: number }[] = [];

    otherUsers.forEach((partner) => {
      const convId = getConvId(currentUser.id, partner.id);
      const msgs = allMsgs[convId] || [];
      if (msgs.length > 0) {
        list.push({
          partner,
          lastMsg: msgs[msgs.length - 1],
          unreadCount: msgs.filter((m) => m.senderId !== currentUser.id && !m.isRead).length
        });
      }
    });

    return list;
  }, [currentUser, otherUsers, messages]);

  // Search filtered users
  const searchResults = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return [];
    return otherUsers.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.emailOrPhone || '').toLowerCase().includes(q)
      );
    });
  }, [searchFilter, otherUsers]);

  return (
    <div className="max-w-xl mx-auto h-[calc(100vh-105px)] bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800 flex flex-col transition-colors shadow-2xs">
      {/* In-App Simulated Call Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-xs w-full text-center shadow-xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3 animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tumatawag kay <span className="font-semibold text-gray-800 dark:text-gray-200">{activeCall.partnerName}</span>...
            </p>
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setActiveCall(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Ibaba ang Tawag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!activeChatUserId ? (
        // CONVERSATIONS LIST VIEW
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top search */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Mga Mensahe (Chats)
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Maghanap ng kausap..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Active online users horizontal scroll - only shown if real online users exist */}
          {onlineUsers.length > 0 && !searchFilter.trim() && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Aktibo Ngayon ({onlineUsers.length})
              </p>
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {onlineUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setActiveChatUserId(u.id)}
                    className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                  >
                    <div className="relative">
                      <Avatar
                        src={u.avatar}
                        alt={u.firstName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 max-w-[55px] truncate">
                      {u.firstName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Body: Search Results or Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {searchFilter.trim() ? (
              // SEARCH RESULTS VIEW
              <div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/40 text-[11px] font-bold text-gray-500">
                  Resulta para sa &quot;{searchFilter}&quot;
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setActiveChatUserId(u.id);
                        setSearchFilter('');
                      }}
                      className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar
                            src={u.avatar}
                            alt={u.firstName}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          {u.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {u.firstName} {u.lastName}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {u.bio || u.location || 'Konekta Member'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatUserId(u.id);
                          setSearchFilter('');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shrink-0"
                      >
                        Mensahe
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    Walang nahanap na user na may pangalang &quot;{searchFilter}&quot;
                  </div>
                )}
              </div>
            ) : activeConversations.length > 0 ? (
              // CONVERSATIONS LIST
              activeConversations.map(({ partner, lastMsg, unreadCount }) => (
                <div
                  key={partner.id}
                  onClick={() => setActiveChatUserId(partner.id)}
                  className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={partner.avatar}
                      alt={partner.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {partner.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {partner.firstName} {partner.lastName}
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {lastMsg.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[85%]">
                        {lastMsg.senderId === currentUser?.id ? 'Ikaw: ' : ''}
                        {lastMsg.text}
                      </p>
                      {unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // CLEAN EMPTY STATE: No messages yet
              <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                  Walang mensahe
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Wala ka pang aktibong usapan. Maghanap ng ibang rehistradong user sa search bar upang magsimula ng chat.
                </p>

                {otherUsers.length > 0 && (
                  <div className="mt-5 w-full text-left border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
                      Maaari mong simulan ang usapan:
                    </p>
                    <div className="space-y-2">
                      {otherUsers.slice(0, 5).map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setActiveChatUserId(u.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-gray-100 dark:border-gray-800/60"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={u.avatar}
                              alt={u.firstName}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {u.location || 'Konekta Member'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">
                            Chat
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ACTIVE CONVERSATION ROOM
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Room Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChatUserId(null)}
                className="p-1 -ml-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-full cursor-pointer"
                aria-label="Bumalik"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                onClick={() => activePartner && setViewingProfileUserId(activePartner.id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="relative">
                  <Avatar
                    src={activePartner?.avatar}
                    alt={activePartner?.firstName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  {activePartner?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                    {activePartner?.firstName} {activePartner?.lastName}
                  </h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {activePartner?.isOnline ? 'Aktibo Ngayon' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <button
                onClick={() => setActiveCall({ type: 'voice', partnerName: `${activePartner?.firstName} ${activePartner?.lastName}` })}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Tawag"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveCall({ type: 'video', partnerName: `${activePartner?.firstName} ${activePartner?.lastName}` })}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/50 dark:bg-gray-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <Avatar
                  src={activePartner?.avatar}
                  alt={activePartner?.firstName}
                  className="w-16 h-16 rounded-full object-cover mb-2 ring-2 ring-blue-500"
                />
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                  {activePartner?.firstName} {activePartner?.lastName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Magpadala ng pagbati o mensahe upang magsimula ang pag-uusap!
                </p>
                <button
                  onClick={() => handleSendMessage('Kamusta! 👋')}
                  className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs active:scale-95"
                >
                  Kamusta! 👋
                </button>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} text-xs`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2 rounded-2xl leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-xs border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      {/* Image inside chat */}
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="Attachment"
                          className="rounded-xl mb-1.5 max-h-48 w-full object-cover"
                        />
                      )}

                      {/* Text */}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-gray-400">
                      <span>{m.timestamp}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Bar */}
          <div className="px-3 py-1 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between text-base">
            {['❤️', '👍', '😂', '🔥', '🇵🇭', '☕'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendMessage(emoji)}
                className="hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Bottom Chat Composer Bar */}
          <div className="p-2.5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-1.5">
            <label
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-full cursor-pointer"
              title="Magpadala ng Larawan"
            >
              <ImageIcon className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handlePhotoFileUpload} className="hidden" />
            </label>

            <button
              onClick={sendVoiceNote}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-full cursor-pointer"
              title="Voice Message"
            >
              <Mic className="w-4 h-4" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Mag-type ng mensahe..."
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
