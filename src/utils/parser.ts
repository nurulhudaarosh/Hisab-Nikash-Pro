import { ParsedShorthand, TransactionType } from '../types';

interface KeywordRule {
  keywords: string[];
  category: string;
  type?: TransactionType;
  affectsDailyLimit?: boolean;
}

const RULES: KeywordRule[] = [
  // Tea & Snacks
  {
    keywords: ['tea', 'cha', 'chai', 'coffee', 'snacks', 'toast', 'biscuit', 'singara', 'samosa', 'puri', 'fuchka', 'juice', 'pan'],
    category: 'tea_snacks',
    type: 'expense',
    affectsDailyLimit: true,
  },
  // Food & Meals
  {
    keywords: ['lunch', 'dinner', 'breakfast', 'khichuri', 'biryani', 'rice', 'fish', 'meat', 'chicken', 'beef', 'egg', 'kacchi', 'food', 'restaurant', 'meal', 'nasta'],
    category: 'food',
    type: 'expense',
    affectsDailyLimit: true,
  },
  // Commute
  {
    keywords: ['bus', 'rickshaw', 'cng', 'uber', 'pathao', 'auto', 'metro', 'train', 'fare', 'fuel', 'petrol', 'octane', 'ride', 'taxi', 'commute'],
    category: 'commute',
    type: 'expense',
    affectsDailyLimit: true,
  },
  // Shop due
  {
    keywords: ['due', 'baki', 'shop due', 'grocery due', 'store due', 'mudir dokan'],
    category: 'shop_due',
    type: 'expense',
    affectsDailyLimit: false,
  },
  // Bills & Utilities
  {
    keywords: ['bill', 'wifi', 'internet', 'electricity', 'current', 'gas', 'water', 'rent', 'recharge', 'mobile bill'],
    category: 'bills',
    type: 'expense',
    affectsDailyLimit: false,
  },
  // Health & Medicine
  {
    keywords: ['medicine', 'meds', 'doctor', 'hospital', 'pharmacy', 'tablet', 'syrup', 'test', 'clinic'],
    category: 'health',
    type: 'expense',
    affectsDailyLimit: false,
  },
  // Income / Salary
  {
    keywords: ['salary', 'income', 'bonus', 'deposit', 'received', 'got money', 'cash in'],
    category: 'salary',
    type: 'income',
    affectsDailyLimit: false,
  },
  // Freelance / Extra
  {
    keywords: ['freelance', 'client', 'project', 'gig', 'upwork', 'fiverr', 'reward', 'crypto'],
    category: 'freelance',
    type: 'income',
    affectsDailyLimit: false,
  },
];

export function parseQuickInput(input: string): ParsedShorthand {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      amount: null,
      category: 'general',
      type: 'expense',
      cleanedNote: '',
      affectsDailyLimit: true,
      isBusiness: false,
    };
  }

  // Check if it's explicitly a note (starts with Note: or 📌 or no numbers at all)
  const isExplicitNote = /^(note:|remember:|todo:|📌|memo:)/i.test(trimmed);

  // Look for number patterns (e.g. "৳150", "150tk", "150/=", "150", "$25", "45.50")
  // Regex to extract amount
  const amountMatch = trimmed.match(/(?:৳|\$|₹|£|€)?\s*(\d+(?:\.\d{1,2})?)\s*(?:tk|bdt|taka|\/=)?/i);

  let extractedAmount: number | null = null;
  let textWithoutAmount = trimmed;

  if (amountMatch && amountMatch[1]) {
    const parsedNum = parseFloat(amountMatch[1]);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      extractedAmount = parsedNum;
      // Remove the matched amount token from cleaned note string
      textWithoutAmount = trimmed.replace(amountMatch[0], '').trim();
    }
  }

  if (isExplicitNote || (extractedAmount === null && !/\d/.test(trimmed))) {
    const cleanedNote = trimmed.replace(/^(note:|remember:|todo:|📌|memo:)/i, '').trim();
    return {
      amount: extractedAmount || 0,
      category: 'general',
      type: 'note',
      cleanedNote: cleanedNote || trimmed,
      affectsDailyLimit: false,
      isBusiness: false,
    };
  }

  const lowerText = trimmed.toLowerCase();

  // Check for business keywords
  const isBusiness = /\b(business|office expense|client meeting|company|official)\b/i.test(lowerText);

  // Match against rules
  let matchedCategory = 'general';
  let matchedType: TransactionType = 'expense';
  let affectsDailyLimit = true;

  for (const rule of RULES) {
    const hasKeyword = rule.keywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lowerText);
    });

    if (hasKeyword) {
      matchedCategory = rule.category;
      if (rule.type) matchedType = rule.type;
      if (rule.affectsDailyLimit !== undefined) affectsDailyLimit = rule.affectsDailyLimit;
      break;
    }
  }

  // If business expense or income, affectsDailyLimit should be false
  if (isBusiness || matchedType === 'income') {
    affectsDailyLimit = false;
  }

  return {
    amount: extractedAmount,
    category: matchedCategory,
    type: matchedType,
    cleanedNote: textWithoutAmount || trimmed,
    affectsDailyLimit,
    isBusiness,
  };
}

export function formatCurrency(amount: number | undefined | null, currency: string = '৳', isMasked: boolean = false): string {
  if (isMasked) {
    return `${currency} ••••`;
  }
  const val = Number(amount || 0);
  return `${currency}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatRelativeDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  } catch {
    return isoDateString;
  }
}
