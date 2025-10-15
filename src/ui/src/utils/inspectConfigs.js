// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Utility to inspect saved configurations in localStorage
// Run this in browser console or add to a component

export const inspectSavedConfigs = () => {
  const STORAGE_KEY = 'idp_config_versions';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const configs = JSON.parse(stored);
      console.log('=== SAVED CONFIGURATIONS ===');
      console.log(`Total configurations: ${configs.length}`);
      console.log('');
      
      configs.forEach((config, index) => {
        console.log(`${index + 1}. ${config.name}`);
        console.log(`   ID: ${config.id}`);
        console.log(`   Description: ${config.description || 'No description'}`);
        console.log(`   Active: ${config.isActive ? 'Yes' : 'No'}`);
        console.log(`   Default: ${config.isDefault ? 'Yes' : 'No'}`);
        console.log(`   Created: ${config.createdAt}`);
        console.log(`   Updated: ${config.updatedAt}`);
        console.log('   ---');
      });
      
      return configs;
    } else {
      console.log('No configurations found in localStorage');
      return [];
    }
  } catch (error) {
    console.error('Error reading configurations:', error);
    return [];
  }
};

// Browser console helper
if (typeof window !== 'undefined') {
  window.inspectConfigs = inspectSavedConfigs;
}
