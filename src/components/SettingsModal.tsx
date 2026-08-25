import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportDatabaseBackup, importDatabaseBackup, seedInitialDataIfNeeded, db } from '../db/indexedDB';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    settings,
    updateUserSettings,
    syncStatus,
    syncNow,
    showToast,
    theme,
    setTheme,
  } = useApp();

  const [dailyLimit, setDailyLimit] = useState<number>(settings.dailyExpenseLimit || 150);
  const [enableRollover, setEnableRollover] = useState<boolean>(settings.enableRollover || false);
  const [currency, setCurrency] = useState<string>(settings.currency || '৳');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsModalOpen) return null;

  const handleSaveGeneral = async () => {
    await updateUserSettings({
      dailyExpenseLimit: Number(dailyLimit) || 150,
      enableRollover,
      currency,
    });
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `hisab-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('1-Click backup downloaded successfully', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const result = await importDatabaseBackup(text);
      if (result.success) {
        showToast(
          `Imported ${result.count.tx} transactions and ${result.count.ldg} ledgers!`,
          'success'
        );
        window.location.reload();
      } else {
        showToast(result.error || 'Import failed', 'error');
      }
    } catch (err: any) {
      showToast('Failed to parse backup JSON', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDemo = async () => {
    await db.transactions.clear();
    await db.ledgers.clear();
    await seedInitialDataIfNeeded();
    showToast('Database reset and re-seeded', 'info');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div
        id="settings-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Settings & Data Control</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage limits, currency, backups & sync</p>
            </div>
          </div>
          <button
            onClick={closeSettingsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Daily Budget & Currency Settings */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Budget & Preferences
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily Expense Limit */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Daily Expense Limit
              </label>
              <input
                type="number"
                min="10"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="৳">৳ (BDT - Taka)</option>
                <option value="$">$ (USD - Dollar)</option>
                <option value="₹">₹ (INR - Rupee)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - Pound)</option>
              </select>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              App Appearance (থিম মোড)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Rollover Toggle */}
          <label className="flex items-center justify-between cursor-pointer py-1">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Enable Daily Budget Rollover
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Carry forward unspent balance to next day
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableRollover}
              onChange={(e) => setEnableRollover(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </label>

          <button
            onClick={handleSaveGeneral}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-sm"
          >
            Save Budget Preferences
          </button>
        </div>

        {/* 2. 1-Click Backup & Restore */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Offline Data Control
          </span>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Your transactions and ledgers are stored locally in IndexedDB on this device. Export a
            complete JSON backup anytime or restore on another device.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* 1-Click Export */}
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isExporting ? 'Exporting...' : '1-Click Backup (.json)'}
            </button>

            {/* 1-Click Import / Restore */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              {isImporting ? 'Importing...' : 'Restore from JSON'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* 3. Cloud Sync & Diagnostics */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cloud Sync Engine
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                syncStatus.isOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
            <div>
              Pending Outbox Records:{' '}
              <span className="text-slate-900 dark:text-white font-bold">{syncStatus.pendingOutboxCount}</span>
            </div>
            <div>
              Last Synced:{' '}
              <span className="text-slate-700 dark:text-slate-300">
                {syncStatus.lastSyncedAt
                  ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>

          <button
            onClick={syncNow}
            disabled={syncStatus.isSyncing}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            {syncStatus.isSyncing ? 'Syncing...' : 'Force Sync Now'}
          </button>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Database to Starter Demo Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        title="Reset Database (সব ডাটা রিসেট করবেন?)"
        description="Are you sure you want to reset your local database? All current transactions and ledger entries will be replaced with fresh starter data."
        confirmText="Yes, Reset (রিসেট করুন)"
        cancelText="Cancel (বাতিল)"
        onConfirm={handleResetDemo}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
