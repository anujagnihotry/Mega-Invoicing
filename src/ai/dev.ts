import { config } from 'dotenv';
config();

import '@/ai/flows/invoice-readability.ts';
import '@/ai/flows/send-email.ts';
import '@/ai/flows/generate-stripe-payment-link.ts';
