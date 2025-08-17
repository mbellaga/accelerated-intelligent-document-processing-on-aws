// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import PropTypes from 'prop-types';
import { StatusIndicator, Box, SpaceBetween } from '@awsui/components-react';

const getStatusIndicator = (status) => {
  switch (status) {
    case 'PENDING':
      return <StatusIndicator type="pending">Job created, waiting to start processing</StatusIndicator>;
    case 'PROCESSING':
      return <StatusIndicator type="in-progress">Processing your query</StatusIndicator>;
    case 'COMPLETED':
      return <StatusIndicator type="success">Processing complete</StatusIndicator>;
    case 'FAILED':
      return <StatusIndicator type="error">Processing failed</StatusIndicator>;
    default:
      return null;
  }
};

const AnalyticsJobStatus = ({ jobId, status, error }) => {
  if (!jobId) {
    return null;
  }

  return (
    <Box padding={{ vertical: 'xs' }}>
      <SpaceBetween direction="vertical" size="xs">
        <div>{getStatusIndicator(status)}</div>
        {error && (
          <div>
            <strong>Error:</strong> {error}
          </div>
        )}
      </SpaceBetween>
    </Box>
  );
};

AnalyticsJobStatus.propTypes = {
  jobId: PropTypes.string,
  status: PropTypes.string,
  error: PropTypes.string,
};

AnalyticsJobStatus.defaultProps = {
  jobId: null,
  status: null,
  error: null,
};

export default AnalyticsJobStatus;
