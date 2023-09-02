import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker";

const config = new pulumi.Config();

const vpc = pulumi
  .output(aws.ec2.getVpc({ id: "vpc-0f604e2fcec0877ba" }))
  .apply((vpc) => vpc);

const securityGroupIds = vpc
  .apply((vpc) =>
    aws.ec2.getSecurityGroups({
      filters: [{ name: "vpc-id", values: ["vpc-0f604e2fcec0877ba"] }],
    })
  )
  .apply((secs) => secs.ids);

const subnetIds = vpc
  .apply((vpc) => aws.ec2.getSubnetIds({ vpcId: "vpc-0f604e2fcec0877ba" }))
  .apply((subnetIds) => subnetIds.ids);

// Create an ECR repository for frontend and backend images.
const frontendRepo = new aws.ecrpublic.Repository("xlr8-frontend", {
  repositoryName: "xlr8-frontend",
  tags: {
    env: "dev",
  },
});

const backendRepo = new aws.ecrpublic.Repository("xlr8-backend", {
  repositoryName: "xlr8-backend",
  tags: {
    env: "dev",
  },
});

export const frontendRepoUrl = frontendRepo.repositoryUri;
const frontendImage = new docker.Image("xlr8-frontend", {
  build: {
    context: "..",
    dockerfile: "../Dockerfile.frontend",
  },
  imageName: pulumi.interpolate`${frontendRepoUrl}:latest`,
});

export const backendRepoUrl = backendRepo.repositoryUri;
const backendImage = new docker.Image("xlr8-backend", {
  build: {
    context: "..",
    dockerfile: "../Dockerfile.backend",
  },
  imageName: pulumi.interpolate`${backendRepoUrl}:latest`,
});

const cluster = new aws.ecs.Cluster("xlr8");

const frontendTaskDef = new aws.ecs.TaskDefinition("frontend-task-definition", {
  family: "frontend",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: "256",
  memory: "512",
  executionRoleArn: "arn:aws:iam::363187237379:role/ecsTaskExecutionRole",
  containerDefinitions: JSON.stringify([
    {
      name: "xlr8-frontend",
      image: "public.ecr.aws/g9g6s4e4/xlr8-frontend",
      essential: true,
      portMappings: [{ containerPort: 3000 }],
    },
  ]),
});
const frontendService = new aws.ecs.Service("frontend-service", {
  cluster: cluster.arn,
  taskDefinition: frontendTaskDef.arn,
  launchType: "FARGATE",
  desiredCount: 1,
  networkConfiguration: {
    subnets: subnetIds, // Use your desired subnets
    securityGroups: securityGroupIds,
  },
});

const backendTaskDef = new aws.ecs.TaskDefinition("backend-task-definition", {
  family: "backend",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  cpu: "256",
  memory: "512",
  executionRoleArn: "arn:aws:iam::363187237379:role/ecsTaskExecutionRole",
  containerDefinitions: JSON.stringify([
    {
      name: "xlr8-backend",
      image: "public.ecr.aws/g9g6s4e4/xlr8-backend:latest",
      essential: true,
      portMappings: [{ containerPort: 5000 }],
    },
  ]),
});
const backendService = new aws.ecs.Service("backend-service", {
  cluster: cluster.arn,
  taskDefinition: backendTaskDef.arn,
  launchType: "FARGATE",
  desiredCount: 1,
  networkConfiguration: {
    subnets: subnetIds,
    securityGroups: securityGroupIds,
  },
});
