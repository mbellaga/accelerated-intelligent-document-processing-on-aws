// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const STORAGE_KEY = 'idp_config_versions';

export const configStorage = {
  // Get all saved configurations
  getAll: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading configurations:', error);
      return [];
    }
  },

  // Save a new configuration
  save: (config) => {
    try {
      const configs = configStorage.getAll();
      const newConfig = {
        ...config,
        id: config.id || `config_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      configs.push(newConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      return newConfig;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  },

  // Update an existing configuration
  update: (id, updates) => {
    try {
      const configs = configStorage.getAll();
      const index = configs.findIndex(c => c.id === id);
      if (index !== -1) {
        configs[index] = {
          ...configs[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
        return configs[index];
      }
      throw new Error('Configuration not found');
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  },

  // Delete a configuration
  delete: (id) => {
    try {
      const configs = configStorage.getAll();
      const filtered = configs.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error;
    }
  },

  // Get a specific configuration
  getById: (id) => {
    const configs = configStorage.getAll();
    return configs.find(c => c.id === id);
  },

  // Export configurations to JSON file
  exportToFile: () => {
    const configs = configStorage.getAll();
    const dataStr = JSON.stringify(configs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `idp_configurations_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
