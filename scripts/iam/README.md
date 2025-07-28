# GenAI IDP IAM Roles

This directory contains IAM role definitions for operating GenAI IDP solution patterns with least-privilege access.

## All Patterns Deployer Role

The `all-patterns-deployer-role.yaml` CloudFormation template creates a least-privilege IAM role for deploying all three GenAI IDP patterns (1, 2, and 3). This role is designed for users who need to deploy and manage patterns but don't have administrator rights.

### Key Features:
- **Tag-based access control** - Users must be in the deployer group and use required tags
- **All patterns support** - Can deploy Pattern 1 (BDA), Pattern 2 (Textract+Bedrock), and Pattern 3 (UDOP)
- **CloudFormation compatible** - Can be used with `--role-arn` parameter
- **Least privilege** - Only permissions needed for pattern deployment
- **Secure by design** - Multiple layers of access control (group membership + session tags)

### Deployment:
```bash
aws cloudformation create-stack \
  --stack-name genai-idp-deployer-role \
  --template-body file://iam/all-patterns-deployer-role.yaml \
  --parameters ParameterKey=MasterStackName,ParameterValue=YOUR_MASTER_STACK_NAME \
               ParameterKey=DeployerGroupName,ParameterValue=GenAI-IDP-Deployers \
  --capabilities CAPABILITY_NAMED_IAM
```

### Usage:
```bash
# Add users to the group
aws iam add-user-to-group --group-name GenAI-IDP-Deployers --user-name username

# Assume role with required tags
aws sts assume-role \
  --role-arn ROLE_ARN \
  --role-session-name Deployment \
  --tags Key=Department,Value=GenAI-IDP

# Deploy patterns using CloudFormation
aws cloudformation create-stack \
  --role-arn ROLE_ARN \
  --template-body file://template.yaml
```

### Security Model:
The role uses a two-layer security approach:
1. **Group Membership**: Users must be in the `GenAI-IDP-Deployers` group
2. **Session Tags**: Users must tag their session with `Department=GenAI-IDP` when assuming the role

This prevents unauthorized access even if someone gains access to user credentials but isn't in the proper group or doesn't know the required tags.

### Access Restrictions:
- **Resource Scoping**: All permissions limited to resources with master stack name prefix
- **Stack Name Validation**: CloudFormation operations restricted to IDP-related stack names
- **Regional Restrictions**: Role can only be assumed in the deployment region
- **Service Constraints**: Specific conditions on sensitive operations (e.g., IAM PassRole)

### Testing:
Refer to `TESTING_GUIDE.md` for comprehensive testing procedures including:
- Role assumption validation (with and without tags)
- Permission boundary testing
- Security restriction verification

## Pattern 3 Operator Role

The `pattern3-operator-role.yaml` CloudFormation template creates a least-privilege IAM role specifically for Pattern 3 operations. This role allows updating, modifying, and deploying Pattern 3 components from an already deployed master IDP solution.

### What This Role Can Do

**Pattern 3 Specific Operations:**
- Update Pattern 3 CloudFormation stack and SageMaker classifier stack
- Manage Pattern 3 Lambda functions (OCR, Classification, Extraction, Assessment, ProcessResults, Summarization)
- Deploy and manage UDOP model on SageMaker endpoints
- Update Step Functions state machine for Pattern 3 workflow
- Configure auto-scaling for SageMaker endpoints
- Update configuration in DynamoDB tables
- Access Bedrock models for extraction and assessment
- Use Textract for OCR processing
- Monitor through CloudWatch logs and metrics

**What This Role Cannot Do:**
- Modify Pattern 1 or Pattern 2 components
- Change core infrastructure (S3 buckets, Cognito, AppSync API structure)
- Modify IAM roles or policies
- Access other AWS accounts or regions
- Delete the master stack or other pattern stacks

### Deployment Instructions

1. **Prerequisites:**
   - Master GenAI IDP stack must be already deployed by an administrator
   - You need the exact stack name of the master deployment
   - Administrator privileges to create the IAM role initially

2. **Deploy the IAM Role:**
   ```bash
   aws cloudformation create-stack \
     --stack-name pattern3-operator-role \
     --template-body file://iam/pattern3-operator-role.yaml \
     --parameters ParameterKey=MasterStackName,ParameterValue=YOUR_MASTER_STACK_NAME \
                  ParameterKey=OperatorUserName,ParameterValue=pattern3-operator \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Get the Credentials:**
   ```bash
   # Get the access key and role ARN from stack outputs
   aws cloudformation describe-stacks \
     --stack-name pattern3-operator-role \
     --query 'Stacks[0].Outputs'
   ```

4. **Configure AWS CLI:**
   ```bash
   # Configure a new profile with the operator credentials
   aws configure --profile pattern3-operator
   # Enter the AccessKeyId and SecretAccessKey from stack outputs
   ```

5. **Assume the Role:**
   ```bash
   # Assume the operator role
   aws sts assume-role \
     --role-arn arn:aws:iam::ACCOUNT:role/MASTER_STACK_NAME-Pattern3-Operator \
     --role-session-name Pattern3Operations \
     --profile pattern3-operator
   
   # Export the temporary credentials
   export AWS_ACCESS_KEY_ID=<AssumedRoleAccessKeyId>
   export AWS_SECRET_ACCESS_KEY=<AssumedRoleSecretAccessKey>
   export AWS_SESSION_TOKEN=<AssumedRoleSessionToken>
   ```

### Usage Examples

**Update UDOP Model:**
```bash
# Update the Pattern 3 stack with a new UDOP model
aws cloudformation update-stack \
  --stack-name YOUR_MASTER_STACK_NAME-PATTERN3STACK-XXXXX \
  --template-body file://patterns/pattern-3/template.yaml \
  --parameters ParameterKey=UDOPModelArtifactPath,ParameterValue=s3://your-bucket/new-model.tar.gz
```

**Update Lambda Function Code:**
```bash
# Update a specific Lambda function
aws lambda update-function-code \
  --function-name YOUR_MASTER_STACK_NAME-ClassificationFunction-XXXXX \
  --zip-file fileb://new-function-code.zip
```

**Monitor Pattern 3 Operations:**
```bash
# Check SageMaker endpoint status
aws sagemaker describe-endpoint \
  --endpoint-name YOUR_MASTER_STACK_NAME-SageMaker-Endpoint

# View Step Functions executions
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:REGION:ACCOUNT:stateMachine:YOUR_MASTER_STACK_NAME-DocumentProcessingWorkflow
```

### Security Features

1. **Least Privilege:** Only permissions needed for Pattern 3 operations
2. **Resource Scoping:** Limited to resources with the master stack name prefix
3. **Service Constraints:** KMS access only through specific AWS services
4. **Regional Restrictions:** Role can only be assumed in the deployment region
5. **Read-Only Base:** Includes ReadOnlyAccess for troubleshooting without modification rights

### Troubleshooting

**Common Issues:**

1. **Access Denied Errors:**
   - Verify you're using the correct master stack name
   - Ensure the role is assumed correctly
   - Check that resources exist with the expected naming pattern

2. **CloudFormation Update Failures:**
   - Verify template syntax and parameters
   - Check that you're updating the correct nested stack
   - Ensure UDOP model artifacts are accessible

3. **SageMaker Endpoint Issues:**
   - Verify model artifacts are in the correct S3 location
   - Check instance type availability in your region
   - Monitor CloudWatch logs for detailed error messages

**Getting Help:**
- Check CloudWatch logs for detailed error messages
- Use AWS CLI with `--debug` flag for verbose output
- Verify resource names match the expected pattern: `MASTER_STACK_NAME-*`

### Cost Considerations

This role allows operations that can incur costs:
- SageMaker endpoint instances (especially GPU instances for UDOP)
- Lambda function executions
- Bedrock model invocations
- CloudWatch logs and metrics storage

Monitor usage through AWS Cost Explorer and set up billing alerts as needed.