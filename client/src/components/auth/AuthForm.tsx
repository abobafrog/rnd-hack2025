import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: { name: string; email: string; password: string }) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export default function AuthForm({
  mode,
  onSubmit,
  onBack,
  loading,
  error,
}: AuthFormProps) {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: formName, email: formEmail, password: formPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F5F5F5' }}>
      <Card className="w-full max-w-md p-8 shadow-xl border-2" style={{ backgroundColor: '#4a6255', borderColor: '#4a6255' }}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            {mode === "login" ? (
              <LogIn className="w-6 h-6 text-white" />
            ) : (
              <UserPlus className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === "login" ? "Вход в аккаунт" : "Регистрация"}
          </h2>
          <p className="text-gray-300 text-sm">
            {mode === "login"
              ? "Войдите в свой аккаунт"
              : "Создайте новый аккаунт"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <Input
              type="text"
              placeholder="Ваше имя"
              value={formName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormName(e.target.value)
              }
              required
              className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={formEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormEmail(e.target.value)
            }
            required
            className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={formPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormPassword(e.target.value)
            }
            required
            className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full h-11 font-semibold" 
              style={{ backgroundColor: '#506E5A', color: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a6255'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#506E5A'; }}
              disabled={loading}
            >
              {loading
                ? mode === "login"
                  ? "Вход..."
                  : "Регистрация..."
                : mode === "login"
                  ? "Войти"
                  : "Зарегистрироваться"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full text-gray-300 hover:text-white hover:bg-gray-700"
            >
              ← Назад
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
