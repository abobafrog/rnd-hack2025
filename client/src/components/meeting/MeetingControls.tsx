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
  onShowRegister 
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
      const response = await fetch('/api/trpc/room.get?input=' + encodeURIComponent(JSON.stringify({ roomCode: code })), {
        credentials: 'include'
      });
      
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
        if (errorData?.error?.message?.includes("Room not found") || errorData?.error?.message?.includes("not found")) {
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
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="w-full max-w-2xl">
          <h2 className="text-4xl font-normal text-white mb-4 text-center">
            Премьер-встреча в высоком качестве теперь бесплатна для всех
          </h2>
          <p className="text-lg text-gray-300 mb-8 text-center">
            Мы пересмотрели приложение для видеовстреч, чтобы сделать его более безопасным, легким и лучше подходящим для всех.
          </p>
          
          {/* Action buttons */}
          <div className="space-y-4">
            {user.isDemo ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-300 mb-2">
                  Для создания комнаты необходимо войти или зарегистрироваться
                </p>
                <Button
                  onClick={() => {
                    onLogout();
                    onShowRegister();
                  }}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Зарегистрироваться
                </Button>
              </div>
            ) : (
              <Button
                onClick={onCreateMeeting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Новая встреча
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Введите код встречи"
                value={roomCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setRoomCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleJoinMeeting()}
                className={`flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 ${error ? 'border-red-500 focus-visible:border-red-500' : ''}`}
              />
              <Button
                onClick={handleJoinMeeting}
                variant="outline"
                disabled={!roomCode.trim() || checkingRoom}
                className="h-9 border-gray-700 text-gray-300 hover:bg-gray-800"
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
                  <p className="text-xs text-red-300 mt-1">Проверьте правильность кода и попробуйте снова</p>
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
      </div>
    </div>
  );
}
