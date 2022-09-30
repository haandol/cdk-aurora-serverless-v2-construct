import * as path from 'path';
import * as joi from 'joi';
import * as dotenv from 'dotenv';
import { VpcValidator } from './validators';

interface IConfig {
  Aws: {
    AccountId: string;
    Region: string;
  };
  DefaultDatabaseName: string;
  VpcId: string;
  Stage: string;
  Ns: string;
}

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

const schema = joi
  .object({
    AWS_ACCOUNT_ID: joi.number().required(),
    AWS_REGION: joi.string().required(),
    DEFAULT_DATABASE_NAME: joi.string().required(),
    VPC_ID: joi.string().custom(VpcValidator).required(),
    STAGE: joi.string().valid('Dev', 'Prod').required(),
    NS: joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = schema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const Config: IConfig = {
  Aws: {
    AccountId: `${envVars.AWS_ACCOUNT_ID}`,
    Region: envVars.AWS_REGION,
  },
  DefaultDatabaseName: envVars.DEFAULT_DATABASE_NAME,
  VpcId: envVars.VPC_ID,
  Stage: envVars.STAGE,
  Ns: `${envVars.NS}${envVars.STAGE}`,
};
