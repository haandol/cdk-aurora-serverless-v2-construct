import * as joi from 'joi';

export const VpcValidator: joi.CustomValidator = (value: string, helpers) => {
  if (!value.startsWith('vpc-')) {
    return helpers.error('VPC_ID should starts with `vpc-`');
  }
  return value;
};

export const SubnetValidator: joi.CustomValidator = (
  value: string,
  helpers
) => {
  if (!value.startsWith('subnet-')) {
    return helpers.error('SUBNET_IDS should starts with `subnet-`');
  }
  return value;
};
