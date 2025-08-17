// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Container, Header, SpaceBetween, Alert } from '@awsui/components-react';
import { Logger } from 'aws-amplify';

import PlotDisplay from './PlotDisplay';
import TableDisplay from './TableDisplay';
import TextDisplay from './TextDisplay';

const logger = new Logger('AnalyticsResultDisplay');

const AnalyticsResultDisplay = ({ result, query }) => {
  if (!result) {
    return null;
  }

  logger.debug('Raw result received:', result);
  logger.debug('Result type:', typeof result);

  // Helper function to safely parse JSON strings with multiple levels
  const safeJsonParse = (data, fallback = null) => {
    if (data === null || data === undefined) {
      return fallback;
    }

    // If it's already an object, return as is
    if (typeof data === 'object') {
      return data;
    }

    // If it's a string, try to parse it
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        // If the parsed result is still a string, try parsing again (double-encoded JSON)
        if (typeof parsed === 'string') {
          try {
            return JSON.parse(parsed);
          } catch (innerError) {
            logger.debug('Inner JSON parse failed, returning first parse result:', innerError);
            return parsed;
          }
        }
        return parsed;
      } catch (error) {
        logger.warn('Failed to parse JSON string:', error);
        logger.debug('Failed string was:', data);
        return fallback;
      }
    }

    return data;
  };

  // Parse the result with enhanced logic
  let parsedResult = safeJsonParse(result, result);

  logger.debug('Parsed result:', parsedResult);

  // Handle case where result might be wrapped in a "result" property (from DynamoDB)
  if (parsedResult && typeof parsedResult === 'object' && parsedResult.result) {
    logger.debug('Found nested result property, extracting...');
    parsedResult = safeJsonParse(parsedResult.result, parsedResult.result);
    logger.debug('Extracted nested result:', parsedResult);
  }

  logger.debug('Parsed result:', parsedResult);

  const renderResultContent = () => {
    const { responseType } = parsedResult;

    logger.debug('Rendering result with responseType:', responseType);

    switch (responseType) {
      case 'plotData': {
        logger.debug('Rendering plot data:', parsedResult);
        // Extract the first plot data item from the array
        const plotData = parsedResult.plotData && parsedResult.plotData.length > 0 ? parsedResult.plotData[0] : null;
        return plotData ? <PlotDisplay plotData={plotData} /> : <div>No plot data available</div>;
      }

      case 'table': {
        logger.debug('Rendering table data:', parsedResult);
        // Extract the nested tableData
        const tableData = parsedResult.tableData || parsedResult;
        return tableData ? <TableDisplay tableData={tableData} /> : <div>No table data available</div>;
      }

      case 'text': {
        logger.debug('Rendering text data:', parsedResult);
        // Extract the nested textData or use the whole object if it has content
        const textData = parsedResult.textData || parsedResult;
        return textData ? <TextDisplay textData={textData} /> : <div>No text data available</div>;
      }

      default:
        // Fallback for legacy format or unknown response types
        logger.warn('Unknown or missing responseType:', responseType);
        logger.debug('Full parsed result for fallback:', parsedResult);
        return (
          <Box padding="m">
            <Header variant="h3">Raw Response</Header>
            <Alert type="warning">Unknown response type: {responseType || 'undefined'}</Alert>
            <Box padding="s">
              <Header variant="h4">Debug Information:</Header>
              <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(parsedResult, null, 2)}
              </pre>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Container
      header={
        <Header variant="h2">
          Results for: <i>{query}</i>
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Alert type="info">
          Response type: <strong>{parsedResult.responseType || 'Unknown'}</strong>
        </Alert>

        {renderResultContent()}
      </SpaceBetween>
    </Container>
  );
};

AnalyticsResultDisplay.propTypes = {
  result: PropTypes.oneOfType([
    PropTypes.string, // For JSON strings
    PropTypes.object, // For parsed objects
  ]),
  query: PropTypes.string,
};

AnalyticsResultDisplay.defaultProps = {
  result: null,
  query: '',
};

export default AnalyticsResultDisplay;
