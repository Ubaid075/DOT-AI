import React, { useState, useContext, useRef } from 'react';
import Modal from './Modal';
import { AuthContext } from '../context/AuthContext';
import { CreditPlan } from '../types';
import { PAYONEER_ACCOUNT_DETAILS } from '../constants';
import { SpinnerIcon, CheckCircleIcon, ClipboardIcon, CheckIcon, UploadIcon, DocumentIcon, XCircleIcon } from './Icons';

interface PaymentRequestModalProps {
  plan: CreditPlan;
  onClose: () => void;
}

const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({ plan, onClose }) => {
  const { requestCredits } = useContext(AuthContext);
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState(plan.price.toString());
  const [dateOfPayment, setDateOfPayment] = useState(new Date().toISOString().split('T')[0]);
  const [userNote, setUserNote] = useState('');
  const [paymentProof, setPaymentProof] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setFormError('Invalid file. Use JPG, PNG, WEBP, or PDF.');
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setFormError('File is too large. Max size is 5MB.');
        return;
      }
      setFormError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof({ file, url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!paymentProof) {
      setFormError('Please upload your payment proof.');
      return;
    }
    if (!transactionId.trim() || transactionId.length < 5) {
      setFormError('Please enter a valid Transaction ID.');
      return;
    }
    const paidAmount = parseFloat(amountPaid);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      setFormError('Please enter a valid amount paid.');
      return;
    }
    if (paidAmount < plan.price) {
      setFormError(`Amount paid cannot be less than the plan price of $${plan.price}.`);
      return;
    }
    
    setLoading(true);
    try {
      await requestCredits(plan, transactionId, parseFloat(amountPaid), dateOfPayment, paymentProof.url, userNote);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(PAYONEER_ACCOUNT_DETAILS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSubmitDisabled = loading || !transactionId.trim() || !amountPaid || isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0 || !paymentProof;

  return (
    <Modal isOpen={true} onClose={onClose} title={!isSuccess ? `Purchase: ${plan.name} Plan` : "Request Sent"}>
      {isSuccess ? (
        <div className="text-center space-y-6 py-8">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto"/>
          <div>
            <h3 className="text-xl font-bold">Success!</h3>
            <p className="text-secondary-light dark:text-secondary-dark mt-2">Your payment request has been sent for approval. Credits will be added to your account shortly.</p>
          </div>
          <button onClick={onClose} className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-lg">
            <p className="text-sm text-center text-secondary-light dark:text-secondary-dark mb-3">1. Send <strong>${plan.price} USD</strong> to our Payoneer account:</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-light dark:text-secondary-dark">Payoneer Account:</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-primary-light dark:text-primary-dark tracking-wider">{PAYONEER_ACCOUNT_DETAILS}</span>
                <button type="button" onClick={handleCopy} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Copy account number">
                  {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-center text-secondary-light dark:text-secondary-dark">
            2. After paying, upload proof and submit your Transaction ID below for approval.
          </p>
          <form onSubmit={handleSubmitRequest} className="space-y-4 pt-4 border-t border-border-light dark:border-border-dark animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Upload Payment Proof</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp, application/pdf" />
              {!paymentProof ? (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-24 bg-light dark:bg-dark border-2 border-dashed border-border-light dark:border-border-dark rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <UploadIcon className="w-6 h-6 text-secondary-light dark:text-secondary-dark mb-1" />
                  <p className="font-semibold text-sm">Click to upload proof</p>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark">JPG, PNG, WEBP, or PDF (Max 5MB)</p>
                </div>
              ) : (
                <div className="w-full p-2 bg-light dark:bg-dark border border-border-light dark:border-border-dark rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {paymentProof.file.type.startsWith('image/') ? (
                      <img src={paymentProof.url} alt="Proof preview" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <DocumentIcon className="w-6 h-6 text-secondary-light dark:text-secondary-dark" />
                      </div>
                    )}
                    <div className="flex-grow overflow-hidden">
                      <p className="text-sm font-medium truncate" title={paymentProof.file.name}>{paymentProof.file.name}</p>
                      <p className="text-xs text-secondary-light dark:text-secondary-dark">{(paymentProof.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPaymentProof(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-2" aria-label="Remove proof">
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="txid" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Payoneer Transaction ID</label>
              <input type="text" id="txid" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter the ID from your receipt" required className="w-full p-2.5 bg-transparent border border-border-light dark:border-border-dark rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Amount Paid (USD)</label>
              <input type="number" id="amount" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={`e.g., ${plan.price}`} step="0.01" required className="w-full p-2.5 bg-transparent border border-border-light dark:border-border-dark rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Date of Payment</label>
              <input type="date" id="date" value={dateOfPayment} onChange={e => setDateOfPayment(e.target.value)} required className="w-full p-2.5 bg-transparent border border-border-light dark:border-border-dark rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none" />
            </div>
            <div>
              <label htmlFor="userNote" className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Optional Note to Admin</label>
              <textarea id="userNote" value={userNote} onChange={e => setUserNote(e.target.value)} rows={2} placeholder="e.g., Please process this quickly." className="w-full p-2.5 bg-transparent border border-border-light dark:border-border-dark rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none"></textarea>
            </div>
            <div className="h-5 text-center">
              {formError && <p key={formError} className="text-red-500 text-sm animate-shake">{formError}</p>}
            </div>
            <button type="submit" disabled={isSubmitDisabled} className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center">
              {loading && <SpinnerIcon className="animate-spin mr-2 h-5 w-5" />}
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
};

export default PaymentRequestModal;