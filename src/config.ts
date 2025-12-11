import dotenv from 'dotenv';

dotenv.config();

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  trud: {
    apiKey: process.env.TRUD_API_KEY || '',
    itemId: process.env.TRUD_ITEM_ID || '24',
    baseUrl: 'https://isd.digital.nhs.uk/trud3/api/v1',
  },
  // Batch size for Supabase inserts (max ~1000 recommended)
  batchSize: 1000,
};

export function validateConfig(): void {
  const missing: string[] = [];
  
  if (!config.supabase.url) missing.push('SUPABASE_URL');
  if (!config.supabase.serviceKey) missing.push('SUPABASE_SERVICE_KEY');
  if (!config.trud.apiKey) missing.push('TRUD_API_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

