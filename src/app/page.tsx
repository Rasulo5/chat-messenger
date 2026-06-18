"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface User {
  id: string;
  name: string;
  avatar_color: string;
}

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const user: User = {
      id: uuidv4(),
      name: name.trim(),
      avatar_color: getRandomColor(),
    };

    localStorage.setItem("chat_user", JSON.stringify(user));

    const allUsers: User[] = JSON.parse(
      localStorage.getItem("chat_users") || "[]",
    );
    allUsers.push(user);
    localStorage.setItem("chat_users", JSON.stringify(allUsers));

    router.push(`/chat?userId=${user.id}`);
  };

  function getRandomColor() {
    const colors = [
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="glass rounded-2xl shadow-soft p-8 w-full max-w-md transform hover:scale-105 transition duration-300">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 mb-4 shadow-glow animate-glow">
            <span className="text-5xl">💬</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Simple Chat</h1>
          <p className="text-gray-600">Быстрый чат без регистрации</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваше имя
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Иван"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition text-lg shadow-sm hover:shadow-md"
                autoFocus
                maxLength={20}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            🚀 Начать общение
          </button>
        </form>

        <div className="mt-8 p-4 glass-dark rounded-xl">
          <h3 className="font-bold text-gray-800 mb-3 text-center">
            ✨ Возможности:
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Личные и групповые чаты
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Сообщения и изображения
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Смайлики и эмодзи
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Индикатор набора текста
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
