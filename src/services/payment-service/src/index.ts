import dotenv from 'dotenv';
import { PaymentServiceApp } from './app';

// Load environment variables
dotenv.config();

async function startService() {
  const app = new PaymentServiceApp();
  
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('Failed to start payment service:', error);
    process.exit(1);
  }
}

// Start the service
startService();