"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface User {
  id: string;
  name: string;
  avatar_color: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  participants: string[];
  messages: Message[];
  created_at: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("chat_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push("/");
    }

    // Загружаем всех пользователей
    const savedUsers = localStorage.getItem("chat_users");
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem("chat_conversations");
    if (saved) {
      const convs: Conversation[] = JSON.parse(saved);
      setConversations(convs.filter((c) => c.participants.includes(userId)));
    }
  }, [userId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "chat_conversations" && e.newValue) {
        const convs: Conversation[] = JSON.parse(e.newValue);
        if (userId) {
          setConversations(
            convs.filter((c) => c.participants.includes(userId)),
          );
        }
      }

      // Обработка индикатора набора текста
      if (e.key === "chat_typing" && selectedConversation) {
        const typingData = e.newValue ? JSON.parse(e.newValue) : null;
        if (
          typingData &&
          typingData.conversationId === selectedConversation &&
          typingData.userId !== userId
        ) {
          setTypingUsers([typingData.userName]);

          // Убираем индикатор через 2 секунды
          setTimeout(() => {
            setTypingUsers([]);
          }, 2000);
        } else {
          setTypingUsers([]);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userId, selectedConversation]);

  // Дополнительный таймер для очистки индикатора
  useEffect(() => {
    if (typingUsers.length > 0 && selectedConversation) {
      const interval = setInterval(() => {
        const typingData = localStorage.getItem("chat_typing");
        if (!typingData) {
          setTypingUsers([]);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [typingUsers, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedConversation]);

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const message: Message = {
      id: uuidv4(),
      conversation_id: selectedConversation,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar_color,
      content: messageInput.trim(),
      image_url: null,
      created_at: new Date().toISOString(),
    };

    const updated = conversations.map((c) => {
      if (c.id === selectedConversation) {
        return { ...c, messages: [...c.messages, message] };
      }
      return c;
    });
    localStorage.setItem("chat_conversations", JSON.stringify(updated));

    // Очищаем индикатор набора
    localStorage.removeItem("chat_typing");
    setTypingUsers([]);

    setConversations(updated);
    setMessageInput("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Отправляем событие что пользователь печатает
    if (selectedConversation && user) {
      const typingData = {
        conversationId: selectedConversation,
        userId: user.id,
        userName: user.name,
      };
      localStorage.setItem("chat_typing", JSON.stringify(typingData));

      // Очищаем таймер если он был
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Убираем индикатор через 2 секунды после последнего ввода
      typingTimeoutRef.current = setTimeout(() => {
        localStorage.removeItem("chat_typing");
      }, 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !user) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const message: Message = {
        id: uuidv4(),
        conversation_id: selectedConversation,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar_color,
        content: "",
        image_url: reader.result as string,
        created_at: new Date().toISOString(),
      };

      const updated = conversations.map((c) => {
        if (c.id === selectedConversation) {
          return { ...c, messages: [...c.messages, message] };
        }
        return c;
      });
      localStorage.setItem("chat_conversations", JSON.stringify(updated));
      setConversations(updated);
    };
    reader.readAsDataURL(file);
  };

  const createNewChat = () => {
    if (!user || selectedUsers.length === 0) return;

    // Если введено название группы или выбрано больше 1 участника - создаём группу
    const isGroup = newChatName.trim().length > 0 || selectedUsers.length > 1;
    const participantIds = [user.id, ...selectedUsers];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: isGroup ? newChatName.trim() || null : null,
      is_group: isGroup,
      participants: participantIds,
      messages: [],
      created_at: new Date().toISOString(),
    };

    const updated = [newConversation, ...conversations];
    setConversations(updated);
    localStorage.setItem("chat_conversations", JSON.stringify(updated));

    setSelectedConversation(newConversation.id);
    setShowNewChat(false);
    setNewChatName("");
    setSelectedUsers([]);
  };

  const handleLogout = () => {
    localStorage.removeItem("chat_user");
    router.push("/");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  if (!user) return null;

  return (
    <div className="h-screen flex relative z-10">
      {/* Sidebar */}
      <div className="w-80 glass border-r border-white/20 flex flex-col shadow-soft">
        <div className="p-4 gradient-primary">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Чаты
          </h2>
        </div>

        <div className="p-4 border-b border-gray-200/50">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full gradient-primary text-white py-3 rounded-xl hover:shadow-glow transition-all duration-300 font-semibold transform hover:scale-105"
          >
            ✨ Новый чат
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const otherParticipants = conv.participants.filter(
              (p) => p !== user.id,
            );
            const chatName =
              conv.name ||
              (conv.is_group
                ? "Группа"
                : allUsers.find((u) => u.id === otherParticipants[0])?.name) ||
              "Чат";
            const isSelected = selectedConversation === conv.id;

            // Проверяем есть ли пользователи которые печатают в этом чате
            const isTypingInThisChat = isSelected && typingUsers.length > 0;

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b border-gray-200/50 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500 shadow-sm"
                    : "hover:bg-white/50 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transform hover:scale-110 transition ${
                      conv.is_group
                        ? "bg-gradient-to-br from-purple-400 to-blue-500 text-white"
                        : "bg-gradient-to-br from-blue-400 to-purple-500 text-white"
                    }`}
                  >
                    {conv.is_group ? "👥" : "💬"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold truncate text-gray-800">
                        {chatName}
                      </h3>
                      {conv.name && conv.is_group && (
                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                          {conv.name}
                        </span>
                      )}
                    </div>
                    {isTypingInThisChat ? (
                      <p className="text-sm text-blue-600 italic">
                        {typingUsers.join(", ")} печатает
                        {typingUsers.length > 1 ? "ут" : ""}...
                      </p>
                    ) : lastMessage ? (
                      <p className="text-sm text-gray-500 truncate">
                        {lastMessage.image_url
                          ? "📷 Изображение"
                          : lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Нет сообщений</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200/50 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full text-red-500 hover:bg-red-50 py-3 rounded-xl transition font-medium flex items-center justify-center gap-2"
          >
            <span>🚪</span> Выйти
          </button>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col glass-dark">
        {selectedConversation && selectedConv ? (
          <>
            <div className="p-4 border-b border-gray-200/50 glass backdrop-blur-md flex items-center justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-lg gradient-text flex items-center gap-2">
                  {selectedConv.is_group && <span>👥</span>}
                  {selectedConv.name ||
                    (selectedConv.is_group
                      ? "Группа"
                      : allUsers.find(
                          (u) =>
                            u.id ===
                            selectedConv.participants.find(
                              (p) => p !== user.id,
                            ),
                        )?.name) ||
                    "Чат"}
                </h3>
                {selectedConv.is_group && selectedConv.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    👥 {selectedConv.participants.length} участник
                    {selectedConv.participants.length > 1 ? "а" : ""}
                  </p>
                )}
                {!selectedConv.is_group && !selectedConv.name && (
                  <p className="text-xs text-gray-400 mt-1">💬 Личный чат</p>
                )}
              </div>
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full animate-pulse">
                  <span className="text-purple-600 text-sm font-medium">
                    {typingUsers.join(", ")} печатает
                    {typingUsers.length > 1 ? "ут" : ""}...
                  </span>
                  <span className="text-purple-500">✏️</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConv.messages.map((msg, index) => {
                const isOwn = msg.user_id === user.id;
                const showAvatar =
                  index === 0 ||
                  selectedConv.messages[index - 1].user_id !== msg.user_id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {showAvatar && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: msg.user_avatar }}
                      >
                        {msg.user_name[0].toUpperCase()}
                      </div>
                    )}
                    {!showAvatar && <div className="w-10" />}
                    <div className={`max-w-md ${isOwn ? "text-right" : ""}`}>
                      {showAvatar && !isOwn && (
                        <p className="text-xs text-gray-600 mb-1">
                          {msg.user_name}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl p-3 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
                          isOwn
                            ? "gradient-primary text-white shadow-glow"
                            : "bg-white/80 border border-white/30"
                        }`}
                      >
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Attachment"
                            className="max-w-full rounded-lg mb-2 shadow-md hover:shadow-lg transition cursor-pointer transform hover:scale-105"
                            onClick={() =>
                              window.open(msg.image_url!, "_blank")
                            }
                          />
                        )}
                        {msg.content && (
                          <p className="leading-relaxed">{msg.content}</p>
                        )}
                        <p
                          className={`text-xs mt-2 ${isOwn ? "text-blue-100" : "text-gray-400"}`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/50 shadow-lg">
              {/* Панель эмодзи */}
              {showEmojiPicker && (
                <div className="mb-3 p-2 glass rounded-xl shadow-lg">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    lazyLoadEmojis
                    theme={"light" as any}
                  />
                </div>
              )}
              //no
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                    showEmojiPicker
                      ? "gradient-primary text-white shadow-glow"
                      : "bg-white/50 hover:bg-purple-50 text-gray-600"
                  }`}
                  title="Эмодзи"
                >
                  😊
                </button>
                <label
                  className="p-3 bg-white/50 hover:bg-blue-50 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-110 text-gray-600 hover:text-blue-600"
                  title="Изображение"
                >
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-3 bg-white/50 backdrop-blur border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="px-6 py-3 gradient-primary text-white rounded-xl hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-bold"
                >
                  🚀
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-2xl mb-2">💬</p>
              <p>Выберите чат или создайте новый</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl transform animate-glow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <span className="text-3xl">✨</span> Новый чат
              </h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 hover:bg-red-50 rounded-xl transition text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название группы (необязательно)
              </label>
              <input
                type="text"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="Например: Работа, Друзья..."
                className="w-full px-4 py-3 bg-white/50 backdrop-blur border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition shadow-sm"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                👥 Выберите участников:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-purple-100 rounded-xl p-3 bg-white/30">
                {allUsers.filter((u) => u.id !== user.id).length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    😔 Нет других пользователей
                  </p>
                ) : (
                  allUsers
                    .filter((u) => u.id !== user.id)
                    .map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-xl transition-all duration-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedUsers([...selectedUsers, u.id]);
                            else
                              setSelectedUsers(
                                selectedUsers.filter((id) => id !== u.id),
                              );
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-400"
                        />
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transform hover:scale-110 transition"
                          style={{ backgroundColor: u.avatar_color }}
                        >
                          {u.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">
                          {u.name}
                        </span>
                      </label>
                    ))
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewChat(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition"
              >
                Отмена
              </button>
              <button
                onClick={createNewChat}
                disabled={selectedUsers.length === 0}
                className="flex-1 px-4 py-3 gradient-primary text-white rounded-xl hover:shadow-glow disabled:opacity-50 font-semibold transition-all duration-300 transform hover:scale-105"
              >
                ✨ Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
