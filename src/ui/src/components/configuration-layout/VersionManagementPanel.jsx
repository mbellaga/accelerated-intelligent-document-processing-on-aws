// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Container, Header, SpaceBetween, Button } from '@awsui/components-react';
import VersionTable from './VersionTable';
import VersionModal from './VersionModal';

const VersionManagementPanel = ({
  versions,
  activeVersion,
  createVersion,
  updateVersion,
  deleteVersion,
  duplicateVersion,
  setActiveVersion,
}) => {
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    mode: 'create',
    version: null,
  });

  const handleVersionAction = async (action, version) => {
    switch (action) {
      case 'activate':
        await setActiveVersion(version.id);
        break;
      case 'edit':
        setModalConfig({ visible: true, mode: 'edit', version });
        break;
      case 'duplicate':
        setModalConfig({ visible: true, mode: 'duplicate', version });
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${version.name}"?`)) {
          await deleteVersion(version.id);
        }
        break;
      default:
        break;
    }
  };

  const handleModalSubmit = async (formData) => {
    const { mode, version } = modalConfig;

    try {
      if (mode === 'create') {
        await createVersion(formData, activeVersion?.config || {});
      } else if (mode === 'edit') {
        await updateVersion(version.id, formData);
      } else if (mode === 'duplicate') {
        await duplicateVersion(version, formData);
      }
      setModalConfig({ visible: false, mode: 'create', version: null });
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <Button variant="primary" onClick={() => setModalConfig({ visible: true, mode: 'create', version: null })}>
              Create Version
            </Button>
          }
        >
          Version Management
        </Header>
      }
    >
      <SpaceBetween size="l">
        <VersionTable versions={versions} onVersionAction={handleVersionAction} />
      </SpaceBetween>

      <VersionModal
        visible={modalConfig.visible}
        mode={modalConfig.mode}
        version={modalConfig.version}
        onDismiss={() => setModalConfig({ visible: false, mode: 'create', version: null })}
        onSubmit={handleModalSubmit}
      />
    </Container>
  );
};

VersionManagementPanel.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      isActive: PropTypes.bool,
      isDefault: PropTypes.bool,
    }),
  ).isRequired,
  activeVersion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    config: PropTypes.shape({}),
  }),
  createVersion: PropTypes.func.isRequired,
  updateVersion: PropTypes.func.isRequired,
  deleteVersion: PropTypes.func.isRequired,
  duplicateVersion: PropTypes.func.isRequired,
  setActiveVersion: PropTypes.func.isRequired,
};

VersionManagementPanel.defaultProps = {
  activeVersion: null,
};

export default VersionManagementPanel;
