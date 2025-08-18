// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import PropTypes from 'prop-types';
import { FormField, Select, Badge, Box } from '@awsui/components-react';

const VersionSelector = ({ versions, activeVersion, onVersionChange }) => {
  const options = versions.map((version) => ({
    label: version.name,
    value: version.id,
    description: version.description,
  }));

  const selectedOption = options.find((opt) => opt.value === activeVersion?.id);

  return (
    <FormField label="Configuration Version">
      <Box>
        <Select
          selectedOption={selectedOption}
          onChange={({ detail }) => {
            const selectedVersion = versions.find((v) => v.id === detail.selectedOption.value);
            onVersionChange(selectedVersion);
          }}
          options={options}
          placeholder="Select a configuration version"
        />
        {activeVersion && (
          <Box margin={{ top: 'xs' }}>
            {activeVersion.isActive && <Badge color="green">Active</Badge>}
            {activeVersion.isDefault && <Badge color="blue">Default</Badge>}
          </Box>
        )}
      </Box>
    </FormField>
  );
};

VersionSelector.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,
  activeVersion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    isDefault: PropTypes.bool,
  }),
  onVersionChange: PropTypes.func.isRequired,
};

VersionSelector.defaultProps = {
  activeVersion: null,
};

export default VersionSelector;
