export type Condition = 'impecavel' | 'bom' | 'regular';
export type Urgency = 'normal' | 'rapida' | 'imediata';

export interface QuoteInput {
  category: string;
  model: string;
  newPriceAvg?: number;
  newPriceSources?: string[];
  usedPriceAvg?: number;
  usedPriceSources?: string[];
  yearsUsed: number;
  condition: Condition;
  hasBox: boolean;
  hasInvoice: boolean;
  urgency: Urgency;
  notes?: string;
  photos?: string[];
  priceMin?: number;
  priceMax?: number;
  chosenPrice?: number;
}

export interface Quote extends QuoteInput {
  slug: string;
  createdAt: string;
}
