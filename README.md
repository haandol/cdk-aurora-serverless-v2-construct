# CDK Aurora ServerlessV2 example

# Prerequisite

- setup awscli
- node 16.x
- cdk 2.x

# Installation

open [**infra/envs/dev.env**](./infra/envs/dev.env) and fill the empty values

copy `envs/dev.env` file to `envs/.env`

```bash
$ cp envs/dev.env envs/.env
```

```bash
$ cd infra
$ npm i
```

bootstrap cdk if no one has run it on the target region

```bash
$ cdk bootstrap
```

deploy infra

```
$ cdk deploy "*" --require-approval never
```
