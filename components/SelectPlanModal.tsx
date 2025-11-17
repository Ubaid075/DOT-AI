import React from 'react';
import Modal from './Modal';
import { CreditPlan } from '../types';
import { CREDIT_PLANS } from '../constants';

interface SelectPlanModalProps {
  onClose: () => void;
  onSelectPlan: (plan: CreditPlan) => void;
}

const SelectPlanModal: React.FC<SelectPlanModalProps> = ({ onClose, onSelectPlan }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Purchase Credits">
      <div className="space-y-3">
        <p className="text-sm text-center text-secondary-light dark:text-secondary-dark pb-2">
          Choose a credit package that suits your needs.
        </p>
        {CREDIT_PLANS.map(plan => (
          <button 
            key={plan.id} 
            onClick={() => onSelectPlan(plan)} 
            className="w-full text-left p-4 border rounded-lg transition-all duration-200 flex-col items-start shadow-sm hover:shadow-md hover:scale-105 active:scale-100 relative border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-500 bg-transparent"
          >
            {plan.id === 'plan_standard' && (
              <div className="absolute top-[-10px] right-3 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Recommended</div>
            )}
            <div className="w-full flex justify-between items-baseline">
              <div className="font-semibold text-primary-light dark:text-primary-dark">{plan.name} - {plan.credits} Credits</div>
              <div className="font-semibold text-lg text-primary-light dark:text-primary-dark">${plan.price}</div>
            </div>
            <div className="text-sm text-secondary-light dark:text-secondary-dark mt-1">{plan.notes}</div>
          </button>
        ))}
         <p className="text-xs text-center text-secondary-light dark:text-secondary-dark pt-4">
            After selecting a plan, you will be asked to provide payment details from your Payoneer transaction.
        </p>
      </div>
    </Modal>
  );
};

export default SelectPlanModal;
