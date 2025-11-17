import React from 'react';
import { CreditIcon, XCircleIcon } from './Icons';

interface LowCreditWarningProps {
  onDismiss: () => void;
  onBuyCredits: () => void;
}

const LowCreditWarning: React.FC<LowCreditWarningProps> = ({ onDismiss, onBuyCredits }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg p-4 bg-yellow-400 text-black rounded-lg shadow-lg flex items-center justify-between animate-slide-in-up space-x-4">
      <div className="flex items-center space-x-3">
        <CreditIcon className="w-6 h-6 text-black/50 flex-shrink-0" />
        <div>
          <p className="font-bold">You're low on credits!</p>
          <p className="text-sm">Consider topping up to continue creating without interruption.</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button 
          onClick={onBuyCredits} 
          className="px-3 py-1.5 text-sm font-semibold bg-black text-white rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          Buy Credits
        </button>
        <button 
          onClick={onDismiss} 
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss warning"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default LowCreditWarning;
