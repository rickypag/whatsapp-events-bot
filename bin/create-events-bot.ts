#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CreateEventsBotStack } from '../lib/create-events-bot-stack';

const app = new cdk.App();
new CreateEventsBotStack(app, 'CreateEventsBotStack', {
  env: { region: 'us-east-1' }
});