import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionDoc extends Document {
  id: string;
  userId: string;
  type: 'expense' | 'income' | 'note';
  amount: number;
  category: string;
  affectsDailyLimit: boolean;
  isBusiness: boolean;
  note: string;
  date: string;
  deleted?: boolean;
  updatedAt: string;
}

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['expense', 'income', 'note'], required: true },
    amount: { type: Number, default: 0 },
    category: { type: String, default: 'general' },
    affectsDailyLimit: { type: Boolean, default: true },
    isBusiness: { type: Boolean, default: false },
    note: { type: String, default: '' },
    date: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    updatedAt: { type: String, required: true, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

export interface IRepayment {
  id?: string;
  type?: 'initial' | 'due_added' | 'repayment';
  date: string;
  amount: number;
  note: string;
  isCashHandled?: boolean;
}

export interface ILedgerDoc extends Document {
  id: string;
  userId: string;
  name: string;
  contactType: 'shop' | 'friend';
  ledgerType: 'i_owe' | 'they_owe';
  originalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  history: IRepayment[];
  status: 'active' | 'settled';
  deleted?: boolean;
  updatedAt: string;
}

const LedgerSchema = new Schema<ILedgerDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    contactType: { type: String, enum: ['shop', 'friend'], default: 'friend' },
    ledgerType: { type: String, enum: ['i_owe', 'they_owe'], required: true },
    originalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, required: true },
    history: [
      {
        id: { type: String },
        type: { type: String, enum: ['initial', 'due_added', 'repayment'], default: 'repayment' },
        date: { type: String, required: true },
        amount: { type: Number, required: true },
        note: { type: String, default: '' },
        isCashHandled: { type: Boolean, default: true },
      },
    ],
    status: { type: String, enum: ['active', 'settled'], default: 'active' },
    deleted: { type: Boolean, default: false },
    updatedAt: { type: String, required: true, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

export interface IUserSettingsDoc extends Document {
  userId: string;
  dailyExpenseLimit: number;
  enableRollover: boolean;
  currency: string;
  categories: Array<{ id: string; label: string; color: string; icon: string }>;
  updatedAt: string;
}

const UserSettingsSchema = new Schema<IUserSettingsDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    dailyExpenseLimit: { type: Number, default: 150 },
    enableRollover: { type: Boolean, default: false },
    currency: { type: String, default: '৳' },
    categories: {
      type: [
        {
          id: String,
          label: String,
          color: String,
          icon: String,
        },
      ],
      default: [],
    },
    updatedAt: { type: String, required: true, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

export interface IUserDoc extends Document {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

const UserSchema = new Schema<IUserDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false }
);

export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransactionDoc>('Transaction', TransactionSchema);
export const LedgerModel = mongoose.models.Ledger || mongoose.model<ILedgerDoc>('Ledger', LedgerSchema);
export const UserSettingsModel = mongoose.models.UserSettings || mongoose.model<IUserSettingsDoc>('UserSettings', UserSettingsSchema);
export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);

