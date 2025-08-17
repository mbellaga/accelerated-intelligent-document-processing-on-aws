# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""
Lambda function to handle analytics query requests.
This function creates a job record in DynamoDB and invokes the analytics processor Lambda.
"""

import json
import logging
import os
import time
import uuid
from datetime import datetime, timedelta

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
lambda_client = boto3.client("lambda")

# Get environment variables
ANALYTICS_TABLE = os.environ.get("ANALYTICS_TABLE")
ANALYTICS_PROCESSOR_FUNCTION = os.environ.get("ANALYTICS_PROCESSOR_FUNCTION")
DATA_RETENTION_DAYS = int(os.environ.get("DATA_RETENTION_DAYS", "30"))


def validate_user_identity(identity):
    """
    Validate and extract user identity from the event context.
    
    Args:
        identity: The identity object from the event context
        
    Returns:
        The validated user ID
        
    Raises:
        ValueError: If no valid user identity is found
    """
    user_id = identity.get("username") or identity.get("sub")
    
    if not user_id:
        logger.warning("No valid user identity found in request")
        # For security, we'll still use "anonymous" but log the warning
        user_id = "anonymous"
    
    logger.info(f"Request authenticated for user: {user_id}")
    return user_id


def handler(event, context):
    """
    Handle analytics query requests from AppSync.
    
    Args:
        event: The event dict from AppSync
        context: The Lambda context
        
    Returns:
        The job record with jobId
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract the query from the event
        arguments = event.get("arguments", {})
        query = arguments.get("query")
        
        if not query:
            error_msg = "Query parameter is required"
            logger.error(error_msg)
            return {
                "statusCode": 400,
                "body": error_msg
            }
        
        # Extract and validate user ID from the identity context
        identity = event.get("identity", {})
        try:
            user_id = validate_user_identity(identity)
        except ValueError as e:
            return {
                "statusCode": 401,
                "body": str(e)
            }
        
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Calculate expiration time (TTL)
        current_time = int(time.time())
        expires_after = current_time + (DATA_RETENTION_DAYS * 24 * 60 * 60)
        
        # Create a timestamp for job creation - format as ISO-8601 with Z suffix for UTC
        created_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        
        # Create the job record in DynamoDB
        # Use a composite key with PK = "analytics#{userId}" and SK = jobId
        # This follows the pattern used in the existing application
        table = dynamodb.Table(ANALYTICS_TABLE)
        job_record = {
            "PK": f"analytics#{user_id}",
            "SK": job_id,
            "query": query,
            "status": "PENDING",
            "createdAt": created_at,
            "expiresAfter": expires_after
        }
        
        table.put_item(Item=job_record)
        logger.info(f"Created job record: {job_id} for user: {user_id}")
        
        # Invoke the analytics processor Lambda asynchronously
        lambda_client.invoke(
            FunctionName=ANALYTICS_PROCESSOR_FUNCTION,
            InvocationType="Event",
            Payload=json.dumps({
                "userId": user_id,
                "jobId": job_id
            })
        )
        logger.info(f"Invoked analytics processor for job: {job_id}")
        
        # Return the job record to the client (without exposing userId)
        return {
            "jobId": job_id,
            "status": "PENDING",
            "query": query,
            "createdAt": created_at
        }
        
    except ClientError as e:
        error_msg = f"DynamoDB error: {str(e)}"
        logger.error(error_msg)
        return {
            "statusCode": 500,
            "body": error_msg
        }
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        logger.error(error_msg)
        return {
            "statusCode": 500,
            "body": error_msg
        }
