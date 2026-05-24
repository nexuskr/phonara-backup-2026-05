import React, { ReactNode } from 'react';

interface SlimShellProps {
  children: ReactNode;
}

const SlimShell: React.FC<SlimShellProps> = ({ children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0b12',
      color: '#fff'
    }}>
      {children}
    </div>
  );
};

export default SlimShell;