import { Duration, Stack, StackProps, CfnResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Config, ClusterConfig } from '../constants/config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as customResources from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ServerlessV2Cluster extends Construct {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Aurora MySQL Serverless v2 cluster
    const cluster = this.createAuroraServerlessV2Cluster(this);
  }

  private createAuroraServerlessV2Cluster(
    scope: Construct
  ): rds.DatabaseCluster {
    const vpc = ec2.Vpc.fromLookup(scope, 'vpc', { vpcId: Config.VpcId });
    const securityGroup = ec2.SecurityGroup.fromLookupByName(
      scope,
      'sg',
      Config.SecurityGroupName,
      vpc
    );

    const cluster = new rds.DatabaseCluster(scope, ClusterConfig.Identifier, {
      clusterIdentifier: ClusterConfig.Identifier,
      instanceIdentifierBase: ClusterConfig.WriterInstanceName,
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_02_0,
      }),
      instances: ClusterConfig.InstanceCount,
      credentials: {
        username: ClusterConfig.UserName,
      },
      defaultDatabaseName: ClusterConfig.DefaultDatabaseName,
      instanceProps: {
        instanceType: new ec2.InstanceType('serverless'),
        securityGroups: [securityGroup],
        vpc,
      },
    });

    // Declare the configuration
    const customResourceAwsSdkCall: customResources.AwsSdkCall = {
      service: 'RDS',
      action: 'modifyDBCluster',
      parameters: {
        DBClusterIdentifier: cluster.clusterIdentifier,
        ServerlessV2ScalingConfiguration: ClusterConfig.ScailingConfiguration,
      },
      physicalResourceId: customResources.PhysicalResourceId.of(
        cluster.clusterIdentifier
      ),
    };

    // Create a Custom Resource to apply scailing configuration
    const dbScalingConfigure = new customResources.AwsCustomResource(
      scope,
      ClusterConfig.ScalingConfigureId,
      {
        functionName: ClusterConfig.ScalingConfigureFunctionName,
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
    for (let i = 1; i <= ClusterConfig.InstanceCount; i++) {
      const writerInstance: rds.CfnDBInstance = cluster.node.findChild(
        `Instance${i}`
      ) as rds.CfnDBInstance;
      writerInstance.addDependsOn(dbScalingConfigureTarget);
    }

    // Create reader instance
    const serverlessDBinstance = new rds.CfnDBInstance(
      scope,
      ClusterConfig.ReaderInstanceName,
      {
        dbInstanceIdentifier: ClusterConfig.ReaderInstanceName,
        dbClusterIdentifier: cluster.clusterIdentifier,
        dbInstanceClass: 'db.serverless',
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.02.0',
        monitoringInterval: 10,
        monitoringRoleArn: (
          cluster.node.findChild('MonitoringRole') as iam.Role
        ).roleArn,
      }
    );
    serverlessDBinstance.node.addDependency(dbScalingConfigureTarget);

    return cluster;
  }
}
