import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ServerlessV2PostgresCluster } from '../constructs/serverless-v2-cluster';

interface IProps extends StackProps {
  vpcId: string;
}

export class DbStack extends Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, `Vpc`, {
      vpcId: props.vpcId,
    });
    const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, { vpc });
    securityGroup.connections.allowInternally(ec2.Port.tcp(5432));

    new ServerlessV2PostgresCluster(this, `ServerlessV2PostgresCluster`, {
      vpc,
      securityGroup,
      cluster: {
        instanceCount: 1,
        username: 'postgres',
        scalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 5,
        },
      },
    });
  }
}
