import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { Video, Plus, Menu, X, AlertCircle, User, LogIn, UserPlus, Play, Edit, Camera, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMode = 'select' | 'login' | 'register' | 'demo';
type UserData = {id: string, name: string, email: string, isDemo?: boolean, avatar?: string};
type RegisteredUser = {id: string, name: string, email: string, password: string, avatar?: string};

// Функции для работы с зарегистрированными пользователями
const getRegisteredUsers = (): RegisteredUser[] => {
  const users = localStorage.getItem("registered_users");
  return users ? JSON.parse(users) : [];
};

const saveRegisteredUser = (user: RegisteredUser) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem("registered_users", JSON.stringify(users));
};

const checkUserExists = (email: string): RegisteredUser | null => {
  const users = getRegisteredUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

const updateRegisteredUser = (userId: string, updates: Partial<RegisteredUser>) => {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem("registered_users", JSON.stringify(users));
  }
};

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [, setLocation] = useLocation();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  
  // Форма для входа/регистрации
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Состояние для редактирования профиля
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    // Функция для загрузки пользователя
    const loadUser = () => {
      const savedUser = localStorage.getItem("conference_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Загружаем пользователя (включая демо-режим)
        setUser(userData);
        setShowAuthOptions(false); // Если пользователь уже авторизован (включая демо), не показываем способы входа
      } else {
        setShowAuthOptions(true); // Если пользователь не авторизован, показываем способы входа
      }
    };

    // Загружаем пользователя при монтировании
    loadUser();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "conference_user") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Периодически проверяем изменения (для синхронизации в рамках одного окна)
    const interval = setInterval(() => {
      loadUser();
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Очищаем ошибку формы при смене режима
  useEffect(() => {
    setFormError(null);
  }, [authMode]);

  const handleAuth = (userData: UserData) => {
    setUser(userData);
    setAuthMode('select');
    setFormError(null);
    setShowAuthOptions(false); // После успешной авторизации скрываем способы входа
  };

  const handleDemoLogin = () => {
    const demoUser: UserData = {
      id: "demo",
      name: "Гость",
      email: "",
      isDemo: true
    };
    
    localStorage.setItem("conference_user", JSON.stringify(demoUser));
    handleAuth(demoUser);
    toast.success("Гостевой режим активирован", {
      description: "Вы можете использовать все функции без регистрации",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Проверяем обязательные поля в зависимости от режима
    if (authMode === 'register') {
      if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
        setFormError("Все поля обязательны для заполнения");
        return;
      }
    } else {
      if (!formEmail.trim() || !formPassword.trim()) {
        setFormError("Email и пароль обязательны для заполнения");
        return;
      }
    }

    setLoading(true);
    
    if (authMode === 'register') {
      // Регистрация - проверяем, не существует ли уже пользователь с таким email
      const existingUser = checkUserExists(formEmail.trim());
      if (existingUser) {
        setFormError("Пользователь с таким email уже зарегистрирован");
        setLoading(false);
        return;
      }
      
      // Сохраняем нового пользователя
      const newUser: RegisteredUser = {
        id: Date.now().toString(),
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim()
      };
      
      saveRegisteredUser(newUser);
      
      const userData: UserData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isDemo: false,
        avatar: newUser.avatar
      };
      
      localStorage.setItem("conference_user", JSON.stringify(userData));
      
      handleAuth(userData);
      toast.success("Вы успешно зарегистрировались");
      setLoading(false);
      
      // Очищаем форму
      setFormName("");
      setFormEmail("");
      setFormPassword("");
    } else {
      // Вход - проверяем существование пользователя и правильность пароля
      const existingUser = checkUserExists(formEmail.trim());
      
      if (!existingUser) {
        setFormError("Пользователь с таким email не найден");
        setLoading(false);
        return;
      }
      
      if (existingUser.password !== formPassword.trim()) {
        setFormError("Неверный пароль");
        setLoading(false);
        return;
      }
      
      const userData: UserData = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        isDemo: false,
        avatar: existingUser.avatar
      };
      
      localStorage.setItem("conference_user", JSON.stringify(userData));
      
      handleAuth(userData);
      toast.success("Вы успешно вошли");
      setLoading(false);
      
      // Очищаем форму
      setFormName("");
      setFormEmail("");
      setFormPassword("");
    }
  };

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
          setLocation(`/room/${code}`);
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
          setLocation(`/room/${code}`);
        }
      }
    } catch (err) {
      // При ошибке запроса не переходим
      setError("Не удалось проверить комнату. Попробуйте снова.");
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleCreateMeeting = () => {
    setLocation("/create");
  };

  const handleLogout = () => {
    const isGuest = user?.isDemo;
    localStorage.removeItem("conference_user");
    setUser(null);
    setAuthMode('select');
    setShowAuthOptions(true); // После выхода показываем способы входа
    // Не показываем уведомление для гостей
    if (!isGuest) {
      toast.info("Вы вышли из аккаунта");
    }
  };

  const handleClearAllData = () => {
    if (confirm("Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.")) {
      // Очищаем все данные из localStorage
      localStorage.removeItem("conference_user");
      localStorage.removeItem("registered_users");
      
      // Очищаем все данные о комнатах
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("room_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      setUser(null);
      setAuthMode('select');
      setShowAuthOptions(true);
      
      toast.success("Все данные успешно очищены");
    }
  };

  const handleEditProfileClick = () => {
    if (user && !user.isDemo) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPassword("");
      setEditAvatar(user.avatar || "");
      setEditError(null);
      setShowEditProfile(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isDemo) return;

    setEditError(null);
    setEditLoading(true);

    // Проверяем обязательные поля
    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Имя и email обязательны для заполнения");
      setEditLoading(false);
      return;
    }

    // Проверяем, если email изменился, что новый email не занят
    if (editEmail.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = checkUserExists(editEmail);
      if (existingUser) {
        setEditError("Пользователь с таким email уже существует");
        setEditLoading(false);
        return;
      }
    }

    try {
      // Обновляем данные в localStorage для зарегистрированных пользователей
      const updates: Partial<RegisteredUser> = {
        name: editName.trim(),
        email: editEmail.trim(),
      };

      // Добавляем пароль только если он указан
      if (editPassword.trim()) {
        updates.password = editPassword.trim();
      }

      // Добавляем аватар если указан
      if (editAvatar.trim()) {
        updates.avatar = editAvatar.trim();
      }

      updateRegisteredUser(user.id, updates);

      // Обновляем текущего пользователя
      const updatedUser: UserData = {
        id: user.id,
        name: editName.trim(),
        email: editEmail.trim(),
        isDemo: false,
        avatar: editAvatar.trim() || undefined
      };

      localStorage.setItem("conference_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowEditProfile(false);
      toast.success("Профиль успешно обновлен");
    } catch (error) {
      setEditError("Не удалось обновить профиль");
    } finally {
      setEditLoading(false);
    }
  };

  // Если нужно показать способы входа и пользователь не авторизован, показываем экран выбора режима
  if (showAuthOptions && !user) {
    if (authMode === 'select') {
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
                  onClick={handleDemoLogin}
                  className="w-full h-14 text-base justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Play className="w-5 h-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Гостевой режим</div>
                    <div className="text-xs opacity-90">Попробовать без регистрации</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setAuthMode('login')}
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
                  onClick={() => setAuthMode('register')}
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

    // Форма входа или регистрации
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl bg-gray-800 border-gray-700">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                {authMode === 'login' ? <LogIn className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              </h2>
              <p className="text-gray-300 text-sm">
                {authMode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {authMode === 'register' && (
                <Input
                  type="text"
                  placeholder="Ваше имя"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                className="h-11 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              
              {/* Отображение ошибки формы */}
              {formError && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{formError}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (authMode === 'login' ? 'Вход...' : 'Регистрация...') : (authMode === 'login' ? 'Войти' : 'Зарегистрироваться')}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAuthMode('select')}
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

  // Если пользователь в демо-режиме, показываем основной интерфейс
  if (user) {
    return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-normal text-white">{APP_TITLE}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {user.isDemo && (
                <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full font-medium">
                  ГОСТЬ
                </span>
              )}
              <Menu className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors relative group">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors" onClick={handleEditProfileClick}>
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                  </div>
                  {!user.isDemo && (
                    <button
                      onClick={handleEditProfileClick}
                      className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать профиль
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900 transition-colors"
                  >
                    Выйти
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-orange-900 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Очистить все данные
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Google Meet style content */}
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
                      handleLogout();
                      setAuthMode('register');
                    }}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Зарегистрироваться
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleCreateMeeting}
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
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
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

      {/* Modal для редактирования профиля */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Редактировать профиль</h2>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Аватар */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Аватар (URL)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                      {editAvatar ? (
                        <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <Input
                      type="text"
                      placeholder="https://example.com/avatar.jpg"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
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
                    onChange={(e) => setEditName(e.target.value)}
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
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Пароль */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Новый пароль (необязательно)</label>
                  <Input
                    type="password"
                    placeholder="Оставьте пустым, чтобы не менять"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Ошибка */}
                {editError && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{editError}</p>
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editLoading ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
    );
  }

  // Если дошли сюда, значит пользователь не авторизован
  return null;
}