import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Edit } from "lucide-react";
import { APP_TITLE } from "@/const";

interface HeaderProps {
  user: { name: string; email?: string; isDemo?: boolean; avatar?: string };
  onEditProfile: () => void;
  onLogout: () => void;
}

export default function Header({
  user,
  onEditProfile,
  onLogout,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="border-b border-gray-700" style={{ backgroundColor: '#506E5A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="https://iili.io/KrLHwYu.md.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl font-normal text-white">{APP_TITLE}</h1>
          </div>

          <div className="flex items-center space-x-3">
            {user.isDemo && (
              <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full font-medium">
                ГОСТЬ
              </span>
            )}
            <div className="profile-menu-container relative">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors" 
                style={{ backgroundColor: '#7B4A5A' }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B3D4A'} 
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7B4A5A'}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-lg shadow-lg border border-gray-700 z-50" style={{ backgroundColor: '#506E5A' }}>
                  <div
                    className="p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={onEditProfile}
                  >
                    <p className="text-sm font-semibold text-white">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-400">{user.email}</p>
                    )}
                  </div>
                  {!user.isDemo && (
                    <button
                      onClick={onEditProfile}
                      className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать профиль
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900 transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
