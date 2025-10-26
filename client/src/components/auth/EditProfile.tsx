import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, X, Camera, Edit } from "lucide-react";

interface EditProfileProps {
  user: { id: string; name: string; email: string; avatar?: string };
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    avatar: string;
  }) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

export default function EditProfile({
  user,
  onSave,
  onClose,
  loading,
  error,
}: EditProfileProps) {
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPassword, setEditPassword] = useState("");
  const [editAvatar, setEditAvatar] = useState(user.avatar || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: editName,
      email: editEmail,
      password: editPassword,
      avatar: editAvatar,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Редактировать профиль
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Аватар */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Аватар (URL)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#7B4A5A' }}>
                  {editAvatar ? (
                    <img
                      src={editAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditAvatar(e.target.value)
                  }
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Имя */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Имя</label>
              <Input
                type="text"
                placeholder="Ваше имя"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditName(e.target.value)
                }
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={editEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditEmail(e.target.value)
                }
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Пароль */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Новый пароль (необязательно)
              </label>
              <Input
                type="password"
                placeholder="Оставьте пустым, чтобы не менять"
                value={editPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditPassword(e.target.value)
                }
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 text-white"
                style={{ backgroundColor: '#5A323F' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A2A35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5A323F'}
              >
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
