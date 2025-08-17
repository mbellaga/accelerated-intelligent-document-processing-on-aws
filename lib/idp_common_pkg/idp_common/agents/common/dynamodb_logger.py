# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""
DynamoDB integration for logging agent messages asynchronously.
"""

import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class DynamoDBMessageLogger:
    """
    Asynchronous DynamoDB logger for agent messages.

    This class handles writing agent conversation messages to DynamoDB
    in a non-blocking manner to avoid impacting agent performance.
    """

    def __init__(self, table_name: str, max_workers: int = 2):
        """
        Initialize the DynamoDB message logger.

        Args:
            table_name: Name of the DynamoDB table
            max_workers: Maximum number of worker threads for async operations
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.sequence_counter = 0

        logger.info(f"DynamoDB message logger initialized for table: {table_name}")

    def log_message_async(
        self, job_id: str, user_id: str, message_data: Dict[str, Any]
    ) -> None:
        """
        Asynchronously log a message to DynamoDB.

        Args:
            job_id: The analytics job ID
            user_id: The user ID who owns the job
            message_data: The message data to log
        """
        # Add sequence number
        self.sequence_counter += 1
        message_data["sequence_number"] = self.sequence_counter

        # Submit the write operation to the thread pool
        future = self.executor.submit(
            self._write_message_to_dynamodb, job_id, user_id, message_data
        )

        # Add error callback
        future.add_done_callback(self._handle_write_result)

    def _write_message_to_dynamodb(
        self, job_id: str, user_id: str, message_data: Dict[str, Any]
    ) -> None:
        """
        Write a message to DynamoDB by appending to a JSON string.

        Args:
            job_id: The analytics job ID
            user_id: The user ID who owns the job
            message_data: The message data to log
        """
        try:
            pk = f"analytics#{user_id}"
            sk = job_id

            # First, try to get the existing agent_messages to append to it
            try:
                response = self.table.get_item(Key={"PK": pk, "SK": sk})
                item = response.get("Item", {})
                existing_messages_str = item.get("agent_messages", "[]")

                # Parse existing messages
                try:
                    existing_messages = json.loads(existing_messages_str)
                    if not isinstance(existing_messages, list):
                        existing_messages = []
                except json.JSONDecodeError:
                    logger.warning(
                        f"Invalid JSON in agent_messages for job {job_id}, starting fresh"
                    )
                    existing_messages = []

            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code")
                if error_code == "ResourceNotFoundException":
                    logger.warning(
                        f"Job record not found for job {job_id}, user {user_id}"
                    )
                    return
                else:
                    logger.error(
                        f"Error getting existing messages for job {job_id}: {e}"
                    )
                    existing_messages = []

            # Append the new message
            existing_messages.append(message_data)

            # Serialize back to JSON string
            updated_messages_str = json.dumps(existing_messages)

            # Update the record with the new JSON string
            self.table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression="SET agent_messages = :messages",
                ExpressionAttributeValues={":messages": updated_messages_str},
                ReturnValues="NONE",
            )

            logger.debug(
                f"Successfully logged message for job {job_id}, sequence {message_data.get('sequence_number')}"
            )

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "ResourceNotFoundException":
                logger.warning(
                    f"DynamoDB table {self.table_name} not found for job {job_id}"
                )
            elif error_code == "ConditionalCheckFailedException":
                logger.warning(f"Job record not found for job {job_id}, user {user_id}")
            else:
                logger.error(f"DynamoDB error logging message for job {job_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error logging message for job {job_id}: {e}")

    def log_throttling_event_async(
        self, job_id: str, user_id: str, throttling_info: Dict[str, Any]
    ) -> None:
        """
        Asynchronously log a throttling event to DynamoDB as a mock agent message.

        Args:
            job_id: The analytics job ID
            user_id: The user ID who owns the job
            throttling_info: The throttling event information
        """
        # Create a mock agent message for throttling events
        # This allows the UI to identify and display throttling issues
        mock_message_data = {
            "timestamp": throttling_info.get("timestamp", datetime.now().isoformat()),
            "role": "system",
            "content": f"⚠️ Throttling Event: {throttling_info.get('error_code', 'Unknown')} - {throttling_info.get('error_message', 'Throttling occurred')}",
            "message_type": "throttling_event",
            "throttling_details": throttling_info,
            "sequence_number": None,  # Will be set in log_message_async
        }

        # Log using the existing message logging mechanism
        self.log_message_async(job_id, user_id, mock_message_data)

    def _handle_write_result(self, future) -> None:
        """
        Handle the result of an async write operation.

        Args:
            future: The completed Future object
        """
        try:
            future.result()  # This will raise any exception that occurred
        except Exception as e:
            logger.error(f"Async DynamoDB write failed: {e}")

    def shutdown(self) -> None:
        """
        Shutdown the thread pool executor.
        """
        logger.info("Shutting down DynamoDB message logger")
        self.executor.shutdown(wait=True)


class DynamoDBMessageTracker:
    """
    Message tracker that integrates with DynamoDB logging.

    This class combines the MessageTracker functionality with
    DynamoDB logging capabilities and throttling monitoring.
    """

    def __init__(
        self,
        job_id: str,
        user_id: str,
        table_name: Optional[str] = None,
        enabled: bool = True,
        include_debug_tool_output: bool = False,
    ):
        """
        Initialize the DynamoDB message tracker.

        Args:
            job_id: The analytics job ID
            user_id: The user ID who owns the job
            table_name: DynamoDB table name (defaults to ANALYTICS_TABLE env var)
            enabled: Whether monitoring is enabled
            include_debug_tool_output: Whether to include debug_tool_output in tool result messages
        """
        self.job_id = job_id
        self.user_id = user_id
        self.enabled = enabled
        self.include_debug_tool_output = include_debug_tool_output
        self.messages = []
        self.logger = logging.getLogger(f"{__name__}.DynamoDBMessageTracker")

        if not enabled:
            self.logger.info("Agent monitoring disabled")
            self.db_logger = None
            self.throttling_monitor = None
            return

        # Get table name from environment if not provided
        if table_name is None:
            table_name = os.environ.get("ANALYTICS_TABLE")

        if not table_name:
            self.logger.error(
                "No DynamoDB table name provided and ANALYTICS_TABLE env var not set"
            )
            self.enabled = False
            self.db_logger = None
            self.throttling_monitor = None
            return

        try:
            self.db_logger = DynamoDBMessageLogger(table_name)

            # Initialize throttling monitor with the same DB logger
            from .monitoring import ThrottlingMonitor

            self.throttling_monitor = ThrottlingMonitor(
                job_id=job_id, user_id=user_id, db_logger=self.db_logger
            )

            self.logger.info(f"DynamoDB message tracker initialized for job {job_id}")
        except Exception as e:
            self.logger.error(f"Failed to initialize DynamoDB logger: {e}")
            self.enabled = False
            self.db_logger = None
            self.throttling_monitor = None

    def register_hooks(self, registry, **kwargs: Any) -> None:
        """Register the message tracking and throttling monitoring callbacks."""
        if not self.enabled:
            return

        from strands.hooks.events import MessageAddedEvent

        # Register message tracking
        registry.add_callback(MessageAddedEvent, self.on_message_added)

        # Register throttling monitoring if available
        if self.throttling_monitor:
            self.throttling_monitor.register_hooks(registry, **kwargs)
            # Override the throttling monitor's exception handler to also log to DynamoDB as agent messages
            self.throttling_monitor._handle_model_exception = (
                self._handle_throttling_with_agent_message
            )

    def _handle_throttling_with_agent_message(self, exception: Exception) -> None:
        """Handle throttling exceptions and log them as agent messages."""
        from botocore.exceptions import ClientError

        # Initialize variables for error details
        error_code = "Unknown"
        error_message = str(exception)

        if isinstance(exception, ClientError):
            error_code = exception.response.get("Error", {}).get("Code", "")
            error_message = exception.response.get("Error", {}).get("Message", "")
        else:
            # For non-ClientError exceptions, extract error info from string
            exception_str = str(exception)

            # Try to extract error code from the exception string
            if "ThrottlingException" in exception_str:
                error_code = "ThrottlingException"
            elif "ModelThrottledException" in exception_str:
                error_code = "ModelThrottledException"
            elif "ServiceQuotaExceededException" in exception_str:
                error_code = "ServiceQuotaExceededException"
            elif "RequestLimitExceeded" in exception_str:
                error_code = "RequestLimitExceeded"
            else:
                error_code = type(exception).__name__

        # Check if this is a throttling-related error
        throttling_patterns = [
            "ThrottlingException",
            "ModelThrottledException",
            "ServiceQuotaExceededException",
            "RequestLimitExceeded",
            "Too many requests",
            "throttl",  # catch variations
        ]

        exception_str = str(exception)
        is_throttling = any(
            pattern.lower() in exception_str.lower() for pattern in throttling_patterns
        )

        if is_throttling:
            # Create a mock agent message for the throttling event
            throttling_message_data = {
                "timestamp": datetime.now().isoformat(),
                "role": "exception",
                "content": f"⚠️ Throttling Event: {error_code} - {error_message}",
                "message_type": "throttling_exception",
                "throttling_details": {
                    "error_code": error_code,
                    "error_message": error_message,
                    "exception_type": type(exception).__name__,
                    "job_id": self.job_id,
                    "user_id": self.user_id,
                },
            }

            # Store locally
            self.messages.append(throttling_message_data)

            # Log to DynamoDB asynchronously
            if self.db_logger:
                self.db_logger.log_message_async(
                    self.job_id, self.user_id, throttling_message_data
                )

            # Log to CloudWatch
            self.logger.warning(
                f"🚫 Throttling detected for job {self.job_id}: {error_code} - {error_message}"
            )
            self.logger.info(
                f"Throttling event logged to DynamoDB as agent message for job {self.job_id}"
            )

    def on_message_added(self, event) -> None:
        """Handle message added events."""
        if not self.enabled or not self.db_logger:
            return

        try:
            from .monitoring import AgentMonitor

            # Create a temporary monitor instance to use its message parsing logic
            temp_monitor = AgentMonitor(
                include_debug_tool_output=self.include_debug_tool_output
            )
            message_data = {
                "timestamp": datetime.now().isoformat(),
                **temp_monitor._get_message_preview(event.message),
            }

            # Store locally
            self.messages.append(message_data)

            # Log to DynamoDB asynchronously
            self.db_logger.log_message_async(self.job_id, self.user_id, message_data)

            # Log the message
            role = message_data["role"]
            content_preview = (
                message_data["content"][:100] + "..."
                if len(message_data["content"]) > 100
                else message_data["content"]
            )
            self.logger.info(
                f"📝 Message tracked: [{role}] {content_preview} (Total: {len(self.messages)})"
            )

        except Exception as e:
            self.logger.error(f"Error tracking message: {e}")

    def get_messages(self) -> list:
        """Get all tracked messages."""
        return self.messages.copy()

    def get_throttling_events(self) -> list:
        """Get all throttling events if throttling monitor is available."""
        if self.throttling_monitor:
            return self.throttling_monitor.get_throttling_events()
        return []

    def clear_messages(self) -> None:
        """Clear all tracked messages."""
        self.messages.clear()

    def shutdown(self) -> None:
        """Shutdown the tracker and its resources."""
        if self.db_logger:
            self.db_logger.shutdown()
