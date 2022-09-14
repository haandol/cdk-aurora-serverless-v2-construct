import { RemovalPolicy, CfnResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as customResources from 'aws-cdk-lib/custom-resources';
import * as logs from 'aws-cdk-lib/aws-logs';

interface IProps {
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly cluster: {
    instanceCount: number;
    username: string;
    scalingConfiguration: {
      MinCapacity: number;
      MaxCapacity: number;
    };
  };
}

export class ServerlessV2PostgresCluster extends Construct {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const cluster = new rds.DatabaseCluster(this, 'DbCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_3,
      }),
      instances: props.cluster.instanceCount,
      instanceProps: {
        instanceType: new ec2.InstanceType('serverless'),
        securityGroups: [props.securityGroup],
        vpc: props.vpc,
      },
      credentials: rds.Credentials.fromUsername(props.cluster.username),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.SIX_MONTHS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Declare the configuration
    const customResourceAwsSdkCall: customResources.AwsSdkCall = {
      service: 'RDS',
      action: 'modifyDBCluster',
      parameters: {
        DBClusterIdentifier: cluster.clusterIdentifier,
        ServerlessV2ScalingConfiguration: props.cluster.scalingConfiguration,
      },
      physicalResourceId: customResources.PhysicalResourceId.of(
        cluster.clusterIdentifier
      ),
    };

    // Create a Custom Resource to apply scailing configuration
    const dbScalingConfigure = new customResources.AwsCustomResource(
      scope,
      'DbScalingConfigure',
      {
        functionName: `${id}ScalingConfigure`,
        onCreate: customResourceAwsSdkCall,
        onUpdate: customResourceAwsSdkCall,
        policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
          resources: customResources.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );

    // Create DB cluster for prevent the circulation reference
    const cfnDbCluster = cluster.node.defaultChild as rds.CfnDBCluster;
    cfnDbCluster.addPropertyOverride('EngineMode', 'provisioned');

    // Make the writer instance are created after the dbScalingConfigure.
    const dbScalingConfigureTarget = dbScalingConfigure.node.findChild(
      'Resource'
    ).node.defaultChild as CfnResource;
    dbScalingConfigure.node.addDependency(cfnDbCluster);

    for (let i = 1; i <= props.cluster.instanceCount; i++) {
      const writerInstance: rds.CfnDBInstance = cluster.node.findChild(
        `Instance${i}`
      ) as rds.CfnDBInstance;
      writerInstance.addDependsOn(dbScalingConfigureTarget);
    }

    this.cluster = cluster;
  }
}
