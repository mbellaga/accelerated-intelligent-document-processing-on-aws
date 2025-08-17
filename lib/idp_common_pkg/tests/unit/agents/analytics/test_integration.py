# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

"""
Integration tests for the analytics agent functionality.
"""

# ruff: noqa: E402, I001
# The above line disables E402 (module level import not at top of file) and I001 (import block sorting) for this file

import sys
from unittest.mock import MagicMock, patch

import pytest

# Mock strands modules before importing analytics modules
sys.modules["strands"] = MagicMock()
sys.modules["strands.models"] = MagicMock()

# Mock bedrock_agentcore modules before importing analytics modules
sys.modules["bedrock_agentcore"] = MagicMock()
sys.modules["bedrock_agentcore.tools"] = MagicMock()
sys.modules["bedrock_agentcore.tools.code_interpreter_client"] = MagicMock()

from idp_common.agents.analytics import (
    create_analytics_agent,
    get_analytics_config,
)


@pytest.mark.unit
class TestAnalyticsIntegration:
    """Integration tests for analytics agent functionality."""

    @patch.dict(
        "os.environ",
        {
            "ATHENA_DATABASE": "test_db",
            "ATHENA_OUTPUT_LOCATION": "s3://test-bucket/results/",
            "AWS_REGION": "us-east-1",
        },
    )
    @patch("idp_common.agents.analytics.agent.Agent")
    @patch("boto3.Session")
    def test_end_to_end_agent_creation(self, mock_session, mock_agent_class):
        """Test end-to-end agent creation with configuration."""
        mock_agent_instance = MagicMock()
        mock_agent_class.return_value = mock_agent_instance
        mock_session_instance = MagicMock()
        mock_session.return_value = mock_session_instance

        # Get configuration
        config = get_analytics_config()

        # Create agent
        agent = create_analytics_agent(config, mock_session_instance)

        # Verify agent was created
        assert agent == mock_agent_instance
        mock_agent_class.assert_called_once()

        # Verify configuration was loaded correctly
        assert config["athena_database"] == "test_db"
        assert config["athena_output_location"] == "s3://test-bucket/results/"
        assert config["aws_region"] == "us-east-1"

    @patch.dict(
        "os.environ",
        {
            "ATHENA_DATABASE": "test_db",
            "ATHENA_OUTPUT_LOCATION": "s3://test-bucket/results/",
            "AWS_REGION": "us-east-1",
        },
    )
    def test_configuration_validation(self):
        """Test that configuration validation works correctly."""
        config = get_analytics_config()

        # Verify all required configuration is present
        assert "athena_database" in config
        assert "athena_output_location" in config
        assert "aws_region" in config

        # Verify default values are set
        assert config["max_polling_attempts"] == 30
        assert config["query_timeout_seconds"] == 300

    def test_missing_configuration_raises_error(self):
        """Test that missing configuration raises appropriate error."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError) as exc_info:
                get_analytics_config()

            assert "Missing required environment variables" in str(exc_info.value)
