// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { gql } from 'graphql-tag';

export default gql`
  query SubmitAnalyticsQuery($query: String!) {
    submitAnalyticsQuery(query: $query) {
      jobId
      status
      query
      createdAt
    }
  }
`;
