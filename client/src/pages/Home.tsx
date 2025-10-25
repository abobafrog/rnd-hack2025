import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import AuthSelect from "@/components/auth/AuthSelect";
import AuthForm from "@/components/auth/AuthForm";
import EditProfile from "@/components/auth/EditProfile";
import Header from "@/components/layout/Header";
import MeetingControls from "@/components/meeting/MeetingControls";
import { 
  UserData, 
  RegisteredUser, 
  getRegisteredUsers, 
  saveRegisteredUser, 
  checkUserExists, 
  updateRegisteredUser, 
  clearAllData 
} from "@/lib/auth";

type AuthMode = 'select' | 'login' | 'register' | 'demo';

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [showAuthOptions, setShowAuthOptions] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // Форма для входа/регистрации
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Состояние для редактирования профиля
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    // Функция для загрузки пользователя
    const loadUser = () => {
      const savedUser = localStorage.getItem("conference_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setShowAuthOptions(false);
      } else {
        setShowAuthOptions(true);
      }
    };

    loadUser();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "conference_user") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Периодически проверяем изменения
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
    setShowAuthOptions(false);
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

  const handleFormSubmit = async (data: { name: string; email: string; password: string }) => {
    setFormError(null);
    
    // Проверяем обязательные поля в зависимости от режима
    if (authMode === 'register') {
      if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
        setFormError("Все поля обязательны для заполнения");
        return;
      }
    } else {
      if (!data.email.trim() || !data.password.trim()) {
        setFormError("Email и пароль обязательны для заполнения");
        return;
      }
    }

    setLoading(true);
    
    if (authMode === 'register') {
      // Регистрация - проверяем, не существует ли уже пользователь с таким email
      const existingUser = checkUserExists(data.email.trim());
      if (existingUser) {
        setFormError("Пользователь с таким email уже зарегистрирован");
        setLoading(false);
        return;
      }
      
      // Сохраняем нового пользователя
      const newUser: RegisteredUser = {
        id: Date.now().toString(),
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password.trim()
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
    } else {
      // Вход - проверяем существование пользователя и правильность пароля
      const existingUser = checkUserExists(data.email.trim());
      
      if (!existingUser) {
        setFormError("Пользователь с таким email не найден");
        setLoading(false);
        return;
      }
      
      if (existingUser.password !== data.password.trim()) {
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
    }
    
    setLoading(false);
  };

  const handleJoinMeeting = (code: string) => {
    setLocation(`/room/${code}`);
  };

  const handleCreateMeeting = () => {
    setLocation("/create");
  };

  const handleLogout = () => {
    const isGuest = user?.isDemo;
    localStorage.removeItem("conference_user");
    setUser(null);
    setAuthMode('select');
    setShowAuthOptions(true);
    if (!isGuest) {
      toast.info("Вы вышли из аккаунта");
    }
  };

  const handleClearAllData = () => {
    if (confirm("Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.")) {
      clearAllData();
      setUser(null);
      setAuthMode('select');
      setShowAuthOptions(true);
      toast.success("Все данные успешно очищены");
    }
  };

  const handleEditProfileClick = () => {
    if (user && !user.isDemo) {
      setEditError(null);
      setShowEditProfile(true);
    }
  };

  const handleSaveProfile = async (data: { name: string; email: string; password: string; avatar: string }) => {
    if (!user || user.isDemo) return;

    setEditError(null);
    setEditLoading(true);

    // Проверяем обязательные поля
    if (!data.name.trim() || !data.email.trim()) {
      setEditError("Имя и email обязательны для заполнения");
      setEditLoading(false);
      return;
    }

    // Проверяем, если email изменился, что новый email не занят
    if (data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = checkUserExists(data.email);
      if (existingUser) {
        setEditError("Пользователь с таким email уже существует");
        setEditLoading(false);
        return;
      }
    }

    try {
      // Обновляем данные в localStorage для зарегистрированных пользователей
      const updates: Partial<RegisteredUser> = {
        name: data.name.trim(),
        email: data.email.trim(),
      };

      // Добавляем пароль только если он указан
      if (data.password.trim()) {
        updates.password = data.password.trim();
      }

      // Добавляем аватар если указан
      if (data.avatar.trim()) {
        updates.avatar = data.avatar.trim();
      }

      updateRegisteredUser(user.id, updates);

      // Обновляем текущего пользователя
      const updatedUser: UserData = {
        id: user.id,
        name: data.name.trim(),
        email: data.email.trim(),
        isDemo: false,
        avatar: data.avatar.trim() || undefined
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

  // Если нужно показать способы входа и пользователь не авторизован
  if (showAuthOptions && !user) {
    if (authMode === 'select') {
      return (
        <AuthSelect
          onDemoLogin={handleDemoLogin}
          onLoginClick={() => setAuthMode('login')}
          onRegisterClick={() => setAuthMode('register')}
        />
      );
    }

    return (
      <AuthForm
        mode={authMode as 'login' | 'register'}
        onSubmit={handleFormSubmit}
        onBack={() => setAuthMode('select')}
        loading={loading}
        error={formError}
      />
    );
  }

  // Если пользователь авторизован, показываем основной интерфейс
  if (user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header
          user={user}
          onEditProfile={handleEditProfileClick}
          onLogout={handleLogout}
          onClearData={handleClearAllData}
        />

        <MeetingControls
          user={user}
          onCreateMeeting={handleCreateMeeting}
          onJoinMeeting={handleJoinMeeting}
          onLogout={handleLogout}
          onShowRegister={() => setAuthMode('register')}
        />

        {/* Modal для редактирования профиля */}
        {showEditProfile && (
          <EditProfile
            user={user}
            onSave={handleSaveProfile}
            onClose={() => setShowEditProfile(false)}
            loading={editLoading}
            error={editError}
          />
        )}
      </div>
    );
  }

  return null;
}