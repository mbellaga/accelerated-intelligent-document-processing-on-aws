# GenAI IDP IAM Role

This directory contains a CloudFormation template that creates a least-privilege IAM role for operating GenAI IDP solution patterns. This template enables selected users to deploy and modify the 3 patterns offered by the IDP solution without requiring full administrator access.

To use this role, users must be members of a specific user group that has permission to assume the role (in our example, the `GenAI-IDP-Deployers-Secure` group). The role provides secure access while maintaining security through group membership and stack name restrictions.

## All Patterns Deployer Role

The `all-patterns-deployer-secure-role.yaml` CloudFormation template creates a secure, least-privilege IAM role that allows authorized users to deploy and manage all three GenAI IDP patterns:
- **Pattern 1**: Business Document Automation (BDA)
- **Pattern 2**: Textract + Bedrock integration
- **Pattern 3**: UDOP (Unified Document Processing)

This role provides the minimum permissions necessary for pattern deployment while maintaining strict security controls.

### Key Features:
- **Group-based access control** - Users must be in the deployer group to assume the role
- **All patterns support** - Can deploy Pattern 1 (BDA), Pattern 2 (Textract+Bedrock), and Pattern 3 (UDOP)
- **Stack name restrictions** - Only allows modifications to stacks with the master stack name prefix, preventing access to unrelated resources
- **Comprehensive permissions** - All AWS services needed for IDP pattern switching

- **Tested and working** - Successfully validated with real pattern switching

### Deployment:
```bash
aws cloudformation create-stack \
  --stack-name all-patterns-deployer-role-secure \
  --template-body file://all-patterns-deployer-role-secure.yaml \
  --parameters ParameterKey=MasterStackName,ParameterValue=YOUR_MASTER_STACK_NAME \
               ParameterKey=DeployerGroupName,ParameterValue=GenAI-IDP-Deployers-Secure \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Note:** The file path `file://all-patterns-deployer-secure-role.yaml` assumes the template is in your current directory. Adjust the path to match your actual file location.

### Usage:
```bash
# Add users to the group
aws iam add-user-to-group --group-name GenAI-IDP-Deployers-Secure --user-name USERNAME

# Assume role (get ROLE_ARN from stack outputs or IAM console)
aws sts assume-role \
  --role-arn ROLE_ARN \
  --role-session-name PatternSwitch \
  --region us-east-1

# Export credentials and switch patterns
export AWS_ACCESS_KEY_ID=<AccessKeyId>
export AWS_SECRET_ACCESS_KEY=<SecretAccessKey>
export AWS_SESSION_TOKEN=<SessionToken>

# Switch to Pattern 2
aws cloudformation update-stack \
  --stack-name YOUR_MASTER_STACK_NAME \
  --use-previous-template \
  --parameters 'ParameterKey=IDPPattern,ParameterValue="Pattern2 - Packet processing with Textract and Bedrock"' \
               'ParameterKey=AdminEmail,UsePreviousValue=true' \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region us-east-1
```

### Security & Access Control:
The role implements multiple layers of security while maintaining simplicity:
- **Group Membership Required**: Users must be in the `GenAI-IDP-Deployers-Secure` group to assume the role
- **Stack Name Restrictions**: CloudFormation operations limited to stacks matching the master stack name pattern (prevents access to unrelated resources)
- **Regional Restrictions**: Role can only be assumed in the deployment region
- **Comprehensive Service Coverage**: All AWS services needed for IDP patterns with appropriate permissions

This approach prevents unauthorized access while keeping the role assumption process simple and user-friendly.

### Testing:
Refer to `TESTING_GUIDE.md` for comprehensive testing procedures including:
- Role assumption validation
- Permission boundary testing
- Security restriction verification
- Pattern switching validation

### Monitoring & Cost Management:
The role enables access to services that should be monitored for performance and cost:

**Key Services to Monitor:**
- **SageMaker Endpoints** (Pattern 3) - GPU instances can be expensive
- **Lambda Functions** - Execution duration and invocation count
- **Bedrock Models** - Token usage and model invocations
- **Textract** - Document processing volume
- **Step Functions** - Workflow executions and state transitions
- **DynamoDB** - Read/write capacity and storage
- **S3** - Storage usage and data transfer
- **CloudWatch Logs** - Log retention and storage costs

**Recommended Billing Alarms:**
```bash
# Set up cost alerts for high-cost services
aws cloudwatch put-metric-alarm \
  --alarm-name "SageMaker-High-Cost" \
  --alarm-description "Alert when SageMaker costs exceed threshold" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold

# Monitor Bedrock token usage
aws cloudwatch put-metric-alarm \
  --alarm-name "Bedrock-High-Usage" \
  --alarm-description "Alert on high Bedrock token consumption" \
  --metric-name InputTokens \
  --namespace AWS/Bedrock \
  --statistic Sum \
  --period 3600 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold
```

**Cost Optimization Tips:**
- Use SageMaker auto-scaling to minimize idle endpoint costs
- Set appropriate CloudWatch log retention periods
- Monitor and optimize Bedrock prompt efficiency
- Use AWS Cost Explorer to track pattern-specific spending