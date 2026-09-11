/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Home, CalendarCheck, ShieldCheck } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  vaultLocked: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  vaultLocked,
}) => {
  const tabs = [
    {
      id: 'home' as NavigationTab,
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      description: 'Folders & Uploads',
      activeColor: '#6366f1',
    },
    {
      id: 'study' as NavigationTab,
      label: 'Study',
      icon: <CalendarCheck className="w-5 h-5" />,
      description: 'Calendar & Questions',
      activeColor: '#a855f7',
    },
    {
      id: 'vault' as NavigationTab,
      label: 'Vault',
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'Encrypted Records',
      activeColor: '#10b981',
      badge: vaultLocked ? '🔒' : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-2 transition-colors shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition relative min-h-[48px] cursor-pointer ${
                isActive
                  ? 'font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium'
              }`}
              style={
                isActive
                  ? {
                      color: tab.activeColor,
                      backgroundColor: `${tab.activeColor}18`,
                      border: `1px solid ${tab.activeColor}35`,
                      boxShadow: `0 2px 10px ${tab.activeColor}15`,
                    }
                  : {}
              }
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 text-[9px] leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-[2px] w-9 h-[3px] rounded-full"
                  style={{
                    backgroundColor: tab.activeColor,
                    boxShadow: `0 0 10px ${tab.activeColor}`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
