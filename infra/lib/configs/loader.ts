import * as path from 'path';
import * as joi from 'joi';
import * as dotenv from 'dotenv';
import { VpcValidator } from './validators';

interface IConfig {
  Ns: string;
  Stage: string;
  VpcId: string;
  DefaultDatabaseName: string;
  AWS: {
    AccountId: string;
    Region: string;
  };
}

dotenv.config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

const schema = joi
  .object({
    NS: joi.string().required(),
    STAGE: joi.string().valid('Dev', 'Prod').required(),
    VPC_ID: joi.string().custom(VpcValidator).required(),
    DEFAULT_DATABASE_NAME: joi.string().required(),
    AWS_ACCOUNT_ID: joi.number().required(),
    AWS_REGION: joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = schema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const Config: IConfig = {
  Ns: `${envVars.NS}${envVars.STAGE}`,
  Stage: envVars.STAGE,
  DefaultDatabaseName: envVars.DEFAULT_DATABASE_NAME,
  VpcId: envVars.VPC_ID,
  AWS: {
    AccountId: `${envVars.AWS_ACCOUNT_ID}`,
    Region: envVars.AWS_REGION,
  },
};
