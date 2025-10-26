import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import AuthSelect from "@/components/auth/AuthSelect";
import { toast } from "sonner";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();
  const createRoomMutation = trpc.room.create.useMutation();

  useEffect(() => {
    const savedUser = localStorage.getItem("conference_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      if (userData.isDemo) {
        setIsGuest(true);
      }
    }
  }, []);

  const handleCreate = async () => {
    if (!roomName.trim()) return;

    setError(null);

    try {
      // Получаем текущего пользователя
      const savedUser = localStorage.getItem("conference_user");
      let userId = 1; // Дефолтное значение

      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Используем ID пользователя или генерируем уникальный ID на основе имени
        if (userData.id && !userData.isDemo) {
          userId =
            typeof userData.id === "string"
              ? parseInt(userData.id)
              : userData.id;
        } else {
          // Для демо-пользователей создаем уникальный ID на основе имени
          userId = userData.name
            ? userData.name
                .split("")
                .reduce(
                  (acc: number, char: string) => acc + char.charCodeAt(0),
                  0
                )
            : 1;
        }
      }

      const result = await createRoomMutation.mutateAsync({
        name: roomName,
        userId: userId,
      });

      // Сохраняем информацию о созданной комнате в localStorage
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        const roomOwners = JSON.parse(
          localStorage.getItem("room_owners") || "{}"
        );
        roomOwners[result.roomCode] =
          result.ownerId || userData.id || userData.name || "unknown";
        localStorage.setItem("room_owners", JSON.stringify(roomOwners));
      }

      setLocation(`/room/${result.roomCode}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setError("Не удалось создать комнату. Попробуйте снова.");
    }
  };

  // Если пользователь не авторизован, показываем выбор способа входа
  if (!user) {
    const handleDemoLogin = () => {
      const demoUser = {
        id: "demo",
        name: "Гость",
        email: "",
        isDemo: true,
      };
      localStorage.setItem("conference_user", JSON.stringify(demoUser));
      setUser(demoUser);
      toast.success("Гостевой режим активирован", {
        description: "Вы можете использовать все функции без регистрации",
      });
    };

    return (
      <AuthSelect
        onDemoLogin={handleDemoLogin}
        onLoginClick={() => setLocation("/")}
        onRegisterClick={() => setLocation("/")}
      />
    );
  }

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <Card className="w-96 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Создать комнату</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg p-4 text-center shadow-lg border-2" style={{ backgroundColor: '#8FAF9C', borderColor: '#8FAF9C' }}>
              <AlertCircle className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-sm text-white mb-4 font-medium">
                Гостевой режим не позволяет создавать комнаты
              </p>
              <p className="text-xs text-white mb-4 font-medium">
                Для создания комнаты необходимо войти или зарегистрироваться
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full font-semibold border-2"
                style={{ backgroundColor: '#506E5A', borderColor: '#506E5A', color: 'white' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a6255'; e.currentTarget.style.borderColor = '#4a6255'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#506E5A'; e.currentTarget.style.borderColor = '#506E5A'; }}
              >
                Зарегистрироваться
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <Card className="w-96 border-2" style={{ backgroundColor: '#8FAF9C', borderColor: '#8FAF9C' }}>
        <CardHeader>
          <CardTitle className="text-white">Создать комнату</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Название комнаты"
            value={roomName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRoomName(e.target.value);
              setError(null);
            }}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && handleCreate()
            }
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
              className="w-full font-semibold"
              style={{ backgroundColor: '#506E5A', color: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a6255'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#506E5A'; }}
              disabled={createRoomMutation.isPending || !roomName.trim()}
            >
              {createRoomMutation.isPending ? "Создание..." : "Создать"}
            </Button>

            <Button
              onClick={() => setLocation("/")}
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
