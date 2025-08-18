// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Box, SpaceBetween, Button, FormField, Input, Textarea } from '@awsui/components-react';

const VersionModal = ({ visible, onDismiss, onSubmit, version = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (version) {
      setFormData({
        name: mode === 'duplicate' ? `${version.name} (Copy)` : version.name,
        description: version.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [version, mode]);

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ name: '', description: '' });
  };

  const getTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Version';
      case 'duplicate':
        return 'Duplicate Version';
      default:
        return 'Create New Version';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'edit':
        return 'Save';
      case 'duplicate':
        return 'Duplicate';
      default:
        return 'Create';
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={getTitle()}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!formData.name.trim()}>
              {getButtonText()}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <FormField label="Version Name" constraintText="Required">
          <Input
            value={formData.name}
            onChange={({ detail }) => setFormData((prev) => ({ ...prev, name: detail.value }))}
            placeholder="Enter version name"
          />
        </FormField>
        <FormField label="Description" constraintText="Optional">
          <Textarea
            value={formData.description}
            onChange={({ detail }) => setFormData((prev) => ({ ...prev, description: detail.value }))}
            placeholder="Enter version description"
            rows={3}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
};

VersionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  version: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  mode: PropTypes.oneOf(['create', 'edit', 'duplicate']),
};

VersionModal.defaultProps = {
  version: null,
  mode: 'create',
};

export default VersionModal;
