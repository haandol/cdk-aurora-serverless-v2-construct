# CDK Aurora ServerlessV2 example

# Prerequisite

- setup awscli
- node 16.x
- cdk 2.x

# Installation

## Setup awscli

```bash
$ aws configure
AWS Access Key ID [****************NCHZ]:
AWS Secret Access Key [****************AwoB]:
Default region name [us-east-1]:
Default output format [json]:
```

## Install dependencies

```bash
$ cd infra
$ npm i -g aws-cdk@2.43.1
$ npm i
```

## Configuration

open [**infra/env/dev.env**](/infra/env/dev.env) and fill the blow fields

- `VPC_ID`: vpc id
- `AWS_ACCOUNT_ID`: 12 digit account id
- `AWS_REGION`: e.g. ap-northeast-2

and copy `env/dev.env` file to project root as `.env`

```bash
$ cd infra
$ cp env/dev.env .env
```

bootstrap cdk if no one has run it on the target region

```bash
$ cdk bootstrap
```

deploy infra

```
$ cdk deploy "*" --require-approval never
```
