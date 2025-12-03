import React, { useEffect, useState } from 'react';

export const MagicHover: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: mousePos.x - 200,
        top: mousePos.y - 200,
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(132, 0, 255, 0.15) 0%, rgba(132, 0, 255, 0.05) 50%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 9999,
        transition: 'all 0.1s ease-out',
      }}
    />
  );
};