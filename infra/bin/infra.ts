#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DbStack } from '../lib/stacks/db-stack';
import { Config } from '../lib/configs/loader';

const app = new cdk.App();
new DbStack(app, `${Config.Ns}DbStack`, {
  vpcId: Config.VpcId,
  env: {
    account: Config.Aws.AccountId,
    region: Config.Aws.Region,
  },
});
