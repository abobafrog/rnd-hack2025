import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [, setLocation] = useLocation();
  const createRoomMutation = trpc.room.create.useMutation();

  useEffect(() => {
    const savedUser = localStorage.getItem("conference_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.isDemo) {
        setIsGuest(true);
      }
    }
  }, []);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    
    setError(null);
    
    try {
      const result = await createRoomMutation.mutateAsync({ name: roomName });
      setLocation(`/room/${result.roomCode}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setError("Не удалось создать комнату. Попробуйте снова.");
    }
  };

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="w-96 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Создать комнату</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-center">
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-yellow-200 mb-4">
                Гостевой режим не позволяет создавать комнаты
              </p>
              <p className="text-xs text-yellow-300 mb-4">
                Для создания комнаты необходимо войти или зарегистрироваться
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Вернуться на главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <Card className="w-96 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Создать комнату</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Название комнаты"
            value={roomName}
            onChange={(e) => {
              setRoomName(e.target.value);
              setError(null);
            }}
            onKeyPress={(e) => e.key === "Enter" && handleCreate()}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          
          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={handleCreate} 
              className="w-full"
              disabled={createRoomMutation.isPending || !roomName.trim()}
            >
              {createRoomMutation.isPending ? "Создание..." : "Создать"}
            </Button>
            
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="w-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

