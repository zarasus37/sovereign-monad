/**
 * Health Monitor
 * 
 * Monitors service health and sends alerts
 */

interface Service {
  name: string;
  url: string;
  expectedStatus: number;
}

const SERVICES: Service[] = [
  { name: 'Dashboard', url: 'http://localhost:8501', expectedStatus: 200 },
  { name: 'Kafka', url: 'http://localhost:9092', expectedStatus: 200 },
  { name: 'API', url: 'http://localhost:3000/health', expectedStatus: 200 },
];

async function checkService(service: Service): Promise<boolean> {
  try {
    const response = await fetch(service.url);
    return response.status === service.expectedStatus;
  } catch {
    return false;
  }
}

async function monitor(): Promise<void> {
  console.log('🔍 Checking services...');
  
  for (const service of SERVICES) {
    const healthy = await checkService(service);
    const status = healthy ? '✅' : '❌';
    console.log(`${status} ${service.name}: ${healthy ? 'OK' : 'DOWN'}`);
    
    if (!healthy) {
      console.log(`⚠️ ALERT: ${service.name} is down!`);
      // Send alert (Discord, Telegram, etc.)
    }
  }
}

// Check every 60 seconds
setInterval(monitor, 60000);
monitor(); // Initial check

export {};
