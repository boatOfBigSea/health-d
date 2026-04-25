
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen pb-32">
      {/* 80x80 Reserved Safe Area for Native Back Button */}
      <div className="safe-area-top-left pointer-events-none" aria-hidden="true" />
      
      <main className="max-w-2xl mx-auto px-6">
        {/* 
          We push the main header content to the right or down. 
          To look good with the 80x80 gap, we ensure our content title 
          doesn't start until below the 80px threshold or shifts right.
        */}
        <div className="pt-24 sm:pt-28">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
