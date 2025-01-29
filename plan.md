# WhatsApp Number Sender Development Plan

## 1. Project Setup
- Initialize TypeScript project with necessary dependencies
```bash
mkdir wa-sender-node
cd wa-sender-node
pnpm init -y
pnpm add whatsapp-web.js qrcode-terminal dotenv puppeteer typescript @types/node ts-node @types/qrcode-terminal
pnpm add -D @types/puppeteer
pnpm tsc --init
```

## 2. Project Structure
```
wa-sender-node/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── services/
│   │   └── whatsapp.service.ts
│   ├── utils/
│   │   └── validator.ts
│   └── index.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 3. Environment Configuration
Create `.env` file:
```env
HEADLESS=false
SESSION_PATH=./config/session
```

## 4. Core Implementation

### 4.1 Environment Types (src/config/env.ts)
```typescript
import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  HEADLESS: boolean;
  SESSION_PATH: string;
}

export const config: Config = {
  HEADLESS: process.env.HEADLESS === 'true',
  SESSION_PATH: process.env.SESSION_PATH || './config/session'
};
```

### 4.2 Phone Number Validation (src/utils/validator.ts)
```typescript
export function validatePhoneNumber(number: string): boolean {
  // Remove any non-numeric characters
  const cleanNumber = number.replace(/[^\d]/g, '');

  // Basic validation for international format
  // Must start with country code and be between 10-15 digits
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(cleanNumber);
}

export function formatPhoneNumber(number: string): string {
  // Remove any non-numeric characters
  const cleanNumber = number.replace(/[^\d]/g, '');

  // Ensure number has country code
  if (!cleanNumber.startsWith('62')) {
    return `62${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;
  }
  return cleanNumber;
}
```

### 4.3 WhatsApp Service (src/services/whatsapp.service.ts)
```typescript
import { Client, LocalAuth } from 'whatsapp-web.js';
import { config } from '../config/env';
import { validatePhoneNumber, formatPhoneNumber } from '../utils/validator';

export class WhatsAppService {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: config.SESSION_PATH
      }),
      puppeteer: {
        headless: config.HEADLESS,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('QR Code received. Scan with WhatsApp:');
      // Generate QR in terminal
      require('qrcode-terminal').generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('Client is ready to send messages!');
    });

    this.client.on('authenticated', () => {
      console.log('Authenticated successfully!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
    });
  }

  public async initialize() {
    await this.client.initialize();
  }

  public async sendMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const formattedNumber = formatPhoneNumber(phoneNumber);
      const chatId = `${formattedNumber}@c.us`;

      // Check if number exists on WhatsApp
      const numberDetails = await this.client.getNumberId(formattedNumber);
      if (!numberDetails) {
        throw new Error('Phone number is not registered on WhatsApp');
      }

      await this.client.sendMessage(chatId, message);
      console.log(`Message sent successfully to ${formattedNumber}`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}
```

### 4.4 Main Application (src/index.ts)
```typescript
import { WhatsAppService } from './services/whatsapp.service';

async function main() {
  const whatsapp = new WhatsAppService();

  try {
    await whatsapp.initialize();

    // Example usage (uncomment to test):
    // await whatsapp.sendMessage('6281234567890', 'Hello from WhatsApp Sender!');
  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
}

main();
```

## 5. Build Configuration
Update tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 6. Scripts (package.json)
Add scripts:
```json
{
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "serve": "node dist/index.js"
  }
}
```

## 7. Testing Procedure
1. Start the application: `pnpm dev`
2. First time setup:
   - Scan QR code with WhatsApp mobile
   - Wait for "Client is ready" message
3. Test sending message:
   ```typescript
   await whatsapp.sendMessage('6281234567890', 'Test message');
   ```

## 8. Error Handling Strategy
- Phone number validation before sending
- WhatsApp number existence check
- Session persistence using LocalAuth
- Automatic reconnection on disconnection
- Detailed error logging

## 9. Security Considerations
- Store sensitive data in .env
- Use LocalAuth for secure session management
- Validate phone numbers before sending
- Handle errors gracefully
- Don't expose internal errors to users

## 10. Future Enhancements
1. Add rate limiting
2. Implement message queuing
3. Add message templates
4. Add bulk sending capability
5. Add delivery status tracking
