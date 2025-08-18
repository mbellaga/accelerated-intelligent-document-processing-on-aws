// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import { Container, SpaceBetween } from '@awsui/components-react';
import useSettingsVersions from '../../hooks/use-settings-versions';
import VersionSelector from './VersionSelector';
import VersionManagementPanel from './VersionManagementPanel';

// Simple test component to verify version management works
const TestVersionManagement = () => {
  const versionsHook = useSettingsVersions();

  const handleVersionChange = (version) => {
    versionsHook.setActiveVersion(version.id);
    console.log('Version changed to:', version);
  };

  return (
    <Container>
      <SpaceBetween size="l">
        <h2>Version Management Test</h2>
        
        <VersionSelector
          versions={versionsHook.versions}
          activeVersion={versionsHook.activeVersion}
          onVersionChange={handleVersionChange}
        />
        
        <VersionManagementPanel {...versionsHook} />
      </SpaceBetween>
    </Container>
  );
};

export default TestVersionManagement;
