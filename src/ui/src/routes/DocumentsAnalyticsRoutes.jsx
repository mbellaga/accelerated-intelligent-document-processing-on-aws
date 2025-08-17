// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { Logger } from 'aws-amplify';

// Import the component directly from the file instead of the directory
import DocumentsAnalyticsLayout from '../components/document-analytics-layout/DocumentsAnalyticsLayout';
import GenAIIDPLayout from '../components/genaiidp-layout';

const logger = new Logger('DocumentsAnalyticsRoutes');

const DocumentsAnalyticsRoutes = () => {
  const { path } = useRouteMatch();
  logger.info('path ', path);

  return (
    <Switch>
      <Route path={path}>
        <GenAIIDPLayout>
          <DocumentsAnalyticsLayout />
        </GenAIIDPLayout>
      </Route>
    </Switch>
  );
};

export default DocumentsAnalyticsRoutes;
