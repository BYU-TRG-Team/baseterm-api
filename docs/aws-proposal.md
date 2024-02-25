# Proposal to migrate to AWS for BaseTerm and MQM Scorecard

## Motivation

### Identity Management

The primary goal of moving to Amazon Web Services (AWS) is to integrate with an identity management service. Identity management for BaseTerm and MQM Scorecard is currently done "in-house".

#### Current setup 

- Use a custom built user management library [express-user-management](https://github.com/BYU-TRG-Team/express-user-management) to configure endpoints and middleware for API auth.
- Store user data in the application's PostgreSQL database.
- Integrate with a third-party email service to drive account verification and password reset.

#### Concerns 

- Time consuming and decentralized setup for user.
    - Configure database
    - Create an account with a supported email provider
- Security 
    - Security vulnerabilities and standards all need to be managed by the BYU TRG team
    - No support for MFA
    - No rotation of encryption keys
- Scalability
    - No support for integrating with OIDC identity providers

### Configurability of infrastructure

Heroku is a fantastic service for PoCs and very simple "Hello World" applications, but it abstracts so much configuration that it becomes a bottleneck when an application needs to scale. Moving to AWS is a necessary step to empower developers and users of MQM Scorecard and BaseTerm.



## Proposed Design

The following services can be used to provide a complete migration of MQM Scorecard and BaseTerm to AWS:

- AWS Cognito
- AWS RDS for PostgreSQL
- ECS w/ ALB as a reverse proxy


### AWS Cognito

The following features can be used to emulate the current identity management flow used in our applications:

- Cognito user groups can be used as a replacement for a user "role" 
- The [cognito-express](https://www.npmjs.com/package/cognito-express) library can be used to integrate the auth flow with the application, replacing the express-user-management library.
- Cognito will expose endpoints and UIs for login, logout, password reset, etc. This will replace pages we manage in our frontends. 


### AWS RDS for PostgreSQL

AWS Relational Database Service (RDS) is a highly available, scalable service. RAM, disk space, and encryption settings can all be configured for an instance. See the docs for AWS RDS for more features. 


### ECS

Elastic Container Service (ECS) is a container management service that uses the Docker engine. Moving our apps to use ECS achieves two main benefits: 

- Containerized applications increases portability, isolation, and (usually) better resource utilization
- Automatic scaling based on defined policies

Additionally, the underlying ec2 instances used by ECS can be configured with desired RAM, disk space, etc. 

ECS will need to be configured with an Application Load Balancer (ALB) as a reverse proxy, and container images will need to be uploaded to AWS Elastic Container Registry (ECR) to work with ECS. 
