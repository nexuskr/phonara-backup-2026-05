import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f0f1a',
      color: '#fff',
      textAlign: 'center',
      padding: '40px'
    }}>
      <h1 style={{ fontSize: '72px', margin: 0 }}>404</h1>
      <h2>페이지를 찾을 수 없습니다</h2>
      <p style={{ color: '#aaa', marginBottom: '40px' }}>
        요청하신 페이지가 존재하지 않거나 삭제되었습니다.
      </p>
      <Link 
        to="/" 
        style={{
          padding: '12px 32px',
          backgroundColor: '#00d4ff',
          color: '#000',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 600
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
};

export default NotFound;