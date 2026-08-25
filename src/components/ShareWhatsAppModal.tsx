import React, { useState } from 'react';
import { X, Share2, Copy, MessageSquare, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/parser';

export const ShareWhatsAppModal: React.FC = () => {
  const { shareTargetLedger, closeShareModal, settings, showToast } = useApp();
  const [language, setLanguage] = useState<'bengali' | 'english'>('bengali');
  const [copied, setCopied] = useState(false);

  if (!shareTargetLedger) return null;

  const isTheyOwe = shareTargetLedger.ledgerType === 'they_owe';
  const remaining = shareTargetLedger.remainingBalance;
  const original = shareTargetLedger.originalAmount;
  const paid = shareTargetLedger.paidAmount;

  // Bengali template
  const bengaliText = isTheyOwe
    ? `আসসালামু আলাইকুম ${shareTargetLedger.name},\nহিসাব অনুযায়ী আপনার কাছে মোট বকেয়া (পাওনা): ${settings.currency}${remaining}।\n(মূল হিসাব: ${settings.currency}${original}, পরিশোধিত: ${settings.currency}${paid})\nসুবিধাজনক সময়ে পরিশোধ করার জন্য অনুরোধ রইল। ধন্যবাদ!`
    : `আসসালামু আলাইকুম ${shareTargetLedger.name},\nহিসাব অনুযায়ী আপনার পাওনা (আমার দেনা): ${settings.currency}${remaining}।\n(মূল হিসাব: ${settings.currency}${original}, ইতিমধ্যে পরিশোধিত: ${settings.currency}${paid})\nধন্যবাদ!`;

  // English template
  const englishText = isTheyOwe
    ? `Hi ${shareTargetLedger.name},\nFriendly reminder regarding our ledger balance. Total remaining due: ${settings.currency}${remaining} (Total: ${settings.currency}${original}, Paid: ${settings.currency}${paid}).\nPlease settle at your convenience. Thank you!`
    : `Hi ${shareTargetLedger.name},\nHere is our updated ledger summary. Remaining balance I owe you: ${settings.currency}${remaining} (Total: ${settings.currency}${original}, Paid: ${settings.currency}${paid}). Thank you!`;

  const activeText = language === 'bengali' ? bengaliText : englishText;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activeText);
      setCopied(true);
      showToast('Summary copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(activeText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div
        id="share-whatsapp-modal"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Summary via WhatsApp</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">For {shareTargetLedger.name}</p>
            </div>
          </div>
          <button
            onClick={closeShareModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setLanguage('bengali')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'bengali'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            বাংলা (Bengali)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('english')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'english'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            English
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
          {activeText}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-102 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-102 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Send to WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
