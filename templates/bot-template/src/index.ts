/**
 * MEV Arbitrage Bot - Main Entry Point
 */

import { Kafka, Consumer, Producer } from 'kafkajs';
import { JsonRpcProvider, Wallet } from 'ethers';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { executeTrade } from './executor';

const logger = createLogger('main');

interface ExecutionPlan {
  planId: string;
  asset: string;
  size: string;
  side: 'buy' | 'sell';
  entryVenue: string;
  exitVenue: string;
  expectedEv: number;
}

async function main() {
  const config = getConfig();
  
  logger.info({ config: { ...config, privateKey: '***' }}, 'Starting MEV Arbitrage Bot');
  
  // Initialize Kafka
  const kafka = new Kafka({
    clientId: 'mev-arbitrage-bot',
    brokers: config.kafkaBrokers,
  });
  
  const consumer = kafka.consumer({ groupId: 'mev-arbitrage-group' });
  const producer = kafka.producer();
  
  await Promise.all([consumer.connect(), producer.connect()]);
  
  // Initialize blockchain
  let provider: JsonRpcProvider | null = null;
  let wallet: Wallet | null = null;
  
  if (!config.dryRun && config.privateKey) {
    provider = new JsonRpcProvider(config.chainARpcUrl);
    wallet = new Wallet(config.privateKey, provider);
    logger.info('Connected to blockchain');
  } else {
    logger.info({ dryRun: true }, 'Running in dry-run mode');
  }
  
  // Subscribe to execution plans
  await consumer.subscribe({ topic: config.inputTopic, fromBeginning: false });
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      
      try {
        const plan: ExecutionPlan = JSON.parse(message.value.toString());
        logger.info({ planId: plan.planId }, 'Received execution plan');
        
        // Execute the trade
        const result = await executeTrade(plan, config, wallet);
        
        // Publish result
        await producer.send({
          topic: config.outputTopic,
          messages: [{
            key: plan.planId,
            value: JSON.stringify(result),
          }],
        });
        
        logger.info({ planId: plan.planId, success: result.success }, 'Trade executed');
      } catch (error) {
        logger.error({ error }, 'Error processing message');
      }
    },
  });
  
  logger.info('Bot started, waiting for execution plans...');
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
