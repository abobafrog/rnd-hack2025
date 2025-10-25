export type UserData = {id: string, name: string, email: string, isDemo?: boolean, avatar?: string};
export type RegisteredUser = {id: string, name: string, email: string, password: string, avatar?: string};

// Функции для работы с зарегистрированными пользователями
export const getRegisteredUsers = (): RegisteredUser[] => {
  const users = localStorage.getItem("registered_users");
  return users ? JSON.parse(users) : [];
};

export const saveRegisteredUser = (user: RegisteredUser) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem("registered_users", JSON.stringify(users));
};

export const checkUserExists = (email: string): RegisteredUser | null => {
  const users = getRegisteredUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const updateRegisteredUser = (userId: string, updates: Partial<RegisteredUser>) => {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem("registered_users", JSON.stringify(users));
  }
};

export const clearAllData = () => {
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
};
