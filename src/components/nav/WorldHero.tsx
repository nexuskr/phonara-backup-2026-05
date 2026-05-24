import React from 'react';

interface WorldHeroProps {
  title?: string;
  subtitle?: string;
  streak?: number;
}

const WorldHero: React.FC<WorldHeroProps> = ({ 
  title = "PHONARA", 
  subtitle = "오늘도 부수입을 쌓아보세요",
  streak = 0 
}) => {
  return (
    <div style={{
      padding: '52px 20px 40px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, #0a0b14 0%, #0a0b12 100%)',
      borderBottom: '1px solid #1a1b24'
    }}>
      {streak > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            fontSize: '13px',
            padding: '6px 16px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 255, 200, 0.08)',
            color: '#00ffcc',
            border: '1px solid rgba(0, 255, 200, 0.2)',
            fontWeight: 500
          }}>
            🔥 {streak}일 연속 출석 중
          </span>
        </div>
      )}

      <h1 style={{
        fontSize: '38px',
        fontWeight: 800,
        margin: 0,
        letterSpacing: '-1px',
        background: 'linear-gradient(90deg, #ffffff, #c0c0ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {title}
      </h1>
      <p style={{ color: '#7a7a8a', marginTop: '8px', fontSize: '15px' }}>
        {subtitle}
      </p>
    </div>
  );
};

export default WorldHero;