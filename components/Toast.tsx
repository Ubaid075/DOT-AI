import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = "fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-xl animate-slide-in-up z-50 text-sm font-medium";
  const typeClasses = type === 'success' 
    ? 'bg-black dark:bg-white dark:text-black' 
    : 'bg-red-600';

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
    </div>
  );
};

export default Toast;
