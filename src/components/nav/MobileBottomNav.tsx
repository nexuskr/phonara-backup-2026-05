import React from 'react';
import { Home, Gift, Gamepad2, Users, User } from 'lucide-react';

const tabs = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'earn', label: '벌기', icon: Gift },
  { id: 'game', label: '게임', icon: Gamepad2 },
  { id: 'social', label: '소셜', icon: Users },
  { id: 'profile', label: '프로필', icon: User },
];

export default function MobileBottomNav() {
  const [activeTab, setActiveTab] = React.useState('home');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1 px-3 transition-all ${
                isActive ? 'text-white scale-110' : 'text-zinc-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
