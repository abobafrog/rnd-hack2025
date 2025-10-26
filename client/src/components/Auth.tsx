import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthProps {
  onAuth: (user: { id: string; name: string; email: string }) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);

    // Имитируем авторизацию
    setTimeout(() => {
      const user = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
      };

      // Сохраняем в localStorage
      localStorage.setItem("conference_user", JSON.stringify(user));

      onAuth(user);
      setLoading(false);
    }, 1000);
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: "demo",
      name: "Демо Пользователь",
      email: "demo@example.com",
    };

    localStorage.setItem("conference_user", JSON.stringify(demoUser));
    onAuth(demoUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isLogin ? "Вход" : "Регистрация"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={isLogin ? "login" : "register"}
            onValueChange={value => setIsLogin(value === "login")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleDemoLogin}
              variant="outline"
              className="w-full"
            >
              Демо вход
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

