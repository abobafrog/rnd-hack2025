import { Button } from "@/components/ui/button";
import { Video, Play, LogIn, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { APP_TITLE } from "@/const";

interface AuthSelectProps {
  onDemoLogin: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export default function AuthSelect({ onDemoLogin, onLoginClick, onRegisterClick }: AuthSelectProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl bg-gray-800 border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{APP_TITLE}</h1>
          <p className="text-gray-300">Выберите способ входа</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onDemoLogin}
            className="w-full h-14 text-base justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Play className="w-5 h-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Гостевой режим</div>
              <div className="text-xs opacity-90">Попробовать без регистрации</div>
            </div>
          </Button>

          <Button
            onClick={onLoginClick}
            variant="outline"
            className="w-full h-14 text-base justify-start border-2 border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white"
          >
            <LogIn className="w-5 h-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Войти</div>
              <div className="text-xs text-gray-400">Войти в существующий аккаунт</div>
            </div>
          </Button>

          <Button
            onClick={onRegisterClick}
            variant="outline"
            className="w-full h-14 text-base justify-start border-2 border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white"
          >
            <UserPlus className="w-5 h-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Регистрация</div>
              <div className="text-xs text-gray-400">Создать новый аккаунт</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
