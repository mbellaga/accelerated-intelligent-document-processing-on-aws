// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable react/no-unstable-nested-components */

import React from 'react';
import PropTypes from 'prop-types';
import { Table, Box, Badge, ButtonDropdown } from '@awsui/components-react';

const VersionTable = ({ versions, onVersionAction }) => {
  const columnDefinitions = [
    {
      id: 'name',
      header: 'Version Name',
      cell: (item) => (
        <Box>
          <strong>{item.name}</strong>
          <Box margin={{ top: 'xs' }}>
            {item.isActive && <Badge color="green">Active</Badge>}
            {item.isDefault && <Badge color="blue">Default</Badge>}
          </Box>
        </Box>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (item) => item.description || '-',
    },
    {
      id: 'updatedAt',
      header: 'Last Modified',
      cell: (item) => new Date(item.updatedAt).toLocaleDateString(),
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: (item) => item.createdBy,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item) => (
        <Box padding={{ horizontal: 'm', vertical: 's' }} style={{ position: 'relative', zIndex: 1000 }}>
          <ButtonDropdown
            items={[
              { id: 'activate', text: 'Set as Active', disabled: item.isActive },
              { id: 'edit', text: 'Edit' },
              { id: 'duplicate', text: 'Duplicate' },
              { id: 'delete', text: 'Delete' },
            ]}
            onItemClick={({ detail }) => onVersionAction(detail.id, item)}
            expandToViewport
          >
            Actions
          </ButtonDropdown>
        </Box>
      ),
    },
  ];

  return (
    <Table
      columnDefinitions={columnDefinitions}
      items={versions}
      empty={
        <Box textAlign="center" color="inherit">
          <b>No versions found</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            Create your first configuration version.
          </Box>
        </Box>
      }
    />
  );
};

VersionTable.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      isActive: PropTypes.bool,
      isDefault: PropTypes.bool,
      updatedAt: PropTypes.instanceOf(Date),
      createdBy: PropTypes.string,
    }),
  ).isRequired,
  onVersionAction: PropTypes.func.isRequired,
};

export default VersionTable;
