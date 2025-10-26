import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, X, Plus } from "lucide-react";

interface MeetingControlsProps {
  user: { isDemo?: boolean };
  onCreateMeeting: () => void;
  onJoinMeeting: (code: string) => void;
  onLogout: () => void;
  onShowRegister: () => void;
}

export default function MeetingControls({
  user,
  onCreateMeeting,
  onJoinMeeting,
  onLogout,
  onShowRegister,
}: MeetingControlsProps) {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  const handleJoinMeeting = async () => {
    const code = roomCode.trim();
    if (!code) return;

    setError(null);
    setCheckingRoom(true);

    try {
      // Проверяем существование комнаты через tRPC
      const response = await fetch(
        "/api/trpc/room.get?input=" +
          encodeURIComponent(JSON.stringify({ roomCode: code })),
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Проверяем что данные есть
        if (data.result?.data) {
          // Комната существует, переходим
          onJoinMeeting(code);
        } else {
          setError("Комната с таким кодом не найдена");
        }
      } else {
        // Попробуем получить детали ошибки
        const errorData = await response.json().catch(() => null);
        if (
          errorData?.error?.message?.includes("Room not found") ||
          errorData?.error?.message?.includes("not found")
        ) {
          setError("Комната с таким кодом не найдена");
        } else {
          // Другая ошибка - возможно база данных недоступна, но в демо-режиме пропускаем
          onJoinMeeting(code);
        }
      }
    } catch (err) {
      // При ошибке запроса не переходим
      setError("Не удалось проверить комнату. Попробуйте снова.");
    } finally {
      setCheckingRoom(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Основной блок с текстом и изображением */}
      <div className="flex flex-col md:flex-row items-center justify-center mb-12 gap-8">
        {/* Текстовый блок */}
        <div className="w-full max-w-2xl">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gray-400 rounded-[50%] opacity-20 -z-10" style={{ borderRadius: '50%', padding: '20px' }}></div>
            <h2 className="text-4xl font-normal mb-4 text-left relative" style={{ color: '#4A4A4A' }}>
              Премьер-встреча в высоком качестве теперь бесплатна для всех
            </h2>
          </div>
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gray-400 rounded-[50%] opacity-20 -z-10" style={{ borderRadius: '50%', padding: '20px' }}></div>
            <p className="text-lg mb-8 text-left relative" style={{ color: '#4A4A4A' }}>
              Мы пересмотрели приложение для видеовстреч, чтобы сделать его более
              безопасным, легким и лучше подходящим для всех.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            {user.isDemo ? (
              <div className="rounded-lg p-4 text-center border-2" style={{ backgroundColor: '#8FAF9C', borderColor: '#8FAF9C' }}>
                <p className="text-sm text-white mb-2 font-medium">
                  Для создания комнаты необходимо войти или зарегистрироваться
                </p>
                <Button
                  onClick={() => {
                    onLogout();
                    onShowRegister();
                  }}
                  className="font-semibold"
                  style={{ backgroundColor: '#506E5A', borderColor: '#506E5A', color: 'white' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a6255'; e.currentTarget.style.borderColor = '#4a6255'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#506E5A'; e.currentTarget.style.borderColor = '#506E5A'; }}
                >
                  Зарегистрироваться
                </Button>
              </div>
            ) : (
              <Button
                onClick={onCreateMeeting}
                className="w-full text-white h-12 text-base flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#506E5A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F5A49'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#506E5A'}
              >
                <Plus className="w-5 h-5 mr-2" />
                Новая встреча
              </Button>
            )}
          </div>

          {/* Блок с полем ввода кода */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Введите код встречи"
                value={roomCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setRoomCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && handleJoinMeeting()
                }
                className={`flex-1 bg-gray-300 border-gray-400 text-gray-700 placeholder-gray-500 ${error ? "border-red-500 focus-visible:border-red-500" : ""}`}
              />
              <Button
                onClick={handleJoinMeeting}
                disabled={!roomCode.trim() || checkingRoom}
                className="h-9 text-white overflow-hidden"
                style={{ backgroundColor: '#506E5A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F5A49'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#506E5A'}
              >
                {checkingRoom ? "Проверка..." : "Присоединиться"}
              </Button>
            </div>

            {/* Плашка с ошибкой */}
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-200 font-medium">{error}</p>
                  <p className="text-xs text-red-300 mt-1">
                    Проверьте правильность кода и попробуйте снова
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-200 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Изображение справа */}
        <div className="flex-shrink-0">
          <div className="block" style={{ backgroundColor: '#F5F5F5' }}>
            <img 
              src="https://iili.io/KrscKs2.md.jpg" 
              alt="Meeting" 
              className="w-full max-w-md rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
