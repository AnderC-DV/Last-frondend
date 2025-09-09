import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChangePasswordPanel from './ChangePasswordPanel';

const MainLayout = ({ user }) => {
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} onOpenChangePassword={() => setIsPasswordPanelOpen(true)} />
      <main className="flex-grow overflow-y-auto">
        <Outlet context={{ user }} />
      </main>
  <ChangePasswordPanel isOpen={isPasswordPanelOpen} onClose={() => setIsPasswordPanelOpen(false)} />
    </div>
  );
};

export default MainLayout;
