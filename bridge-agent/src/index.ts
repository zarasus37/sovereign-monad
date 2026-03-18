import { BridgeAgent } from './service';

const agent = new BridgeAgent();

async function main() {
  console.log('Starting Bridge Agent...');
  
  await agent.start();
  
  console.log('Bridge Agent started successfully');
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Bridge Agent...');
    await agent.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('Shutting down Bridge Agent...');
    await agent.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start Bridge Agent:', error);
  process.exit(1);
});
