// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState, useEffect } from 'react';
import { configStorage } from '../utils/configStorage';
import defaultConfigs from '../data/config-versions/default-configs.json';

export const useConfigVersions = () => {
  const [versions, setVersions] = useState([]);
  const [activeVersion, setActiveVersionState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize with default configs if none exist
  useEffect(() => {
    const loadVersions = () => {
      try {
        let storedVersions = configStorage.getAll();
        
        // If no versions exist, initialize with defaults
        if (storedVersions.length === 0) {
          defaultConfigs.forEach(config => {
            configStorage.save(config);
          });
          storedVersions = configStorage.getAll();
        }

        setVersions(storedVersions);
        
        // Set active version
        const active = storedVersions.find(v => v.isActive) || storedVersions[0];
        setActiveVersionState(active);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading versions:', error);
        setLoading(false);
      }
    };

    loadVersions();
  }, []);

  const createVersion = async (formData, baseConfig = {}) => {
    try {
      const newVersion = {
        name: formData.name,
        description: formData.description,
        isDefault: false,
        isActive: false,
        createdBy: 'User',
        config: { ...baseConfig, ...formData.config },
      };

      const savedVersion = configStorage.save(newVersion);
      setVersions(prev => [...prev, savedVersion]);
      return savedVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  };

  const updateVersion = async (id, formData) => {
    try {
      const updatedVersion = configStorage.update(id, {
        name: formData.name,
        description: formData.description,
        config: formData.config,
      });

      setVersions(prev => prev.map(v => v.id === id ? updatedVersion : v));
      
      if (activeVersion?.id === id) {
        setActiveVersionState(updatedVersion);
      }
      
      return updatedVersion;
    } catch (error) {
      console.error('Error updating version:', error);
      throw error;
    }
  };

  const deleteVersion = async (id) => {
    try {
      configStorage.delete(id);
      setVersions(prev => prev.filter(v => v.id !== id));
      
      if (activeVersion?.id === id) {
        const remaining = versions.filter(v => v.id !== id);
        const newActive = remaining.find(v => v.isDefault) || remaining[0];
        if (newActive) {
          await setActiveVersion(newActive.id);
        }
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  };

  const duplicateVersion = async (sourceVersion, formData) => {
    try {
      const duplicatedVersion = {
        name: formData.name,
        description: formData.description,
        isDefault: false,
        isActive: false,
        createdBy: 'User',
        config: { ...sourceVersion.config },
      };

      const savedVersion = configStorage.save(duplicatedVersion);
      setVersions(prev => [...prev, savedVersion]);
      return savedVersion;
    } catch (error) {
      console.error('Error duplicating version:', error);
      throw error;
    }
  };

  const setActiveVersion = async (id) => {
    try {
      // Update all versions to set isActive = false
      const updatedVersions = versions.map(v => ({
        ...v,
        isActive: v.id === id,
      }));

      // Save each updated version
      updatedVersions.forEach(v => {
        configStorage.update(v.id, { isActive: v.isActive });
      });

      setVersions(updatedVersions);
      const newActive = updatedVersions.find(v => v.id === id);
      setActiveVersionState(newActive);
    } catch (error) {
      console.error('Error setting active version:', error);
      throw error;
    }
  };

  const exportVersions = () => {
    configStorage.exportToFile();
  };

  return {
    versions,
    activeVersion,
    loading,
    createVersion,
    updateVersion,
    deleteVersion,
    duplicateVersion,
    setActiveVersion,
    exportVersions,
  };
};
