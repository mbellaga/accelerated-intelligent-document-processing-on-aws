// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect, useCallback } from 'react';

const mockVersions = [
  {
    id: 'default-v1',
    name: 'Default Configuration',
    description: 'System default settings',
    config: {
      documentProcessing: { accuracy: 'standard', speed: 'fast' },
      aiModel: { provider: 'bedrock', model: 'claude-3' },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    isDefault: true,
    createdBy: 'system',
    tags: ['default', 'production'],
  },
  {
    id: 'custom-v1',
    name: 'High Accuracy Setup',
    description: 'Optimized for accuracy over speed',
    config: {
      documentProcessing: { accuracy: 'high', speed: 'standard' },
      aiModel: { provider: 'bedrock', model: 'claude-3-opus' },
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
    isActive: false,
    isDefault: false,
    createdBy: 'user@example.com',
    tags: ['accuracy', 'custom'],
  },
];

const useSettingsVersions = () => {
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersionState] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setTimeout(() => {
      setVersions(mockVersions);
      setActiveVersionState(mockVersions.find((v) => v.isActive));
      setLoading(false);
    }, 300);
  }, []);

  const createVersion = useCallback(async (versionData, config) => {
    const newVersion = {
      id: `version-${Date.now()}`,
      ...versionData,
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      isDefault: false,
      createdBy: 'current-user@example.com',
    };

    setVersions((prev) => [...prev, newVersion]);
    return newVersion;
  }, []);

  const duplicateVersion = useCallback(async (sourceVersion, newVersionData) => {
    const duplicatedVersion = {
      ...sourceVersion,
      id: `version-${Date.now()}`,
      ...newVersionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      isDefault: false,
    };

    setVersions((prev) => [...prev, duplicatedVersion]);
    return duplicatedVersion;
  }, []);

  const updateVersion = useCallback(async (versionId, updates) => {
    // prettier-ignore
    setVersions((prev) =>
      prev.map((v) => (v.id === versionId ? { ...v, ...updates, updatedAt: new Date() } : v))
    );
  }, []);

  const deleteVersion = useCallback(async (versionId) => {
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  }, []);

  const setActiveVersion = useCallback(
    async (versionId) => {
      setVersions((prev) =>
        prev.map((v) => ({
          ...v,
          isActive: v.id === versionId,
        })),
      );
      const newActiveVersion = versions.find((v) => v.id === versionId);
      setActiveVersionState(newActiveVersion);
    },
    [versions],
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return {
    versions,
    activeVersion,
    loading,
    createVersion,
    updateVersion,
    deleteVersion,
    duplicateVersion,
    setActiveVersion,
    fetchVersions,
  };
};

export default useSettingsVersions;
