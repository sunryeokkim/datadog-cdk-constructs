/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import { LambdaRestApi, LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Stack, StackProps, App } from "aws-cdk-lib";
import { DatadogLambda } from "../../../src/index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaJavaFunction = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.JAVA_11,
      code: lambda.Code.fromAsset(__dirname + "/../../lambda"),
      handler: "handleRequest",
    });

    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: lambdaJavaFunction,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      javaLayerVersion: 5,
      extensionLayerVersion: 25,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      sourceCodeIntegration: false,
      apiKey: "1234",
      site: "datadoghq.com",
    });
    datadogLambda.addLambdaFunctions([lambdaJavaFunction]);
    datadogLambda.addForwarderToNonLambdaLogGroups([restLogGroup]);
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "lambda-java-function-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
