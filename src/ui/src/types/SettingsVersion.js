// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

export const SettingsVersionType = {
  id: String,
  name: String,
  description: String,
  config: Object,
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  isDefault: Boolean,
  createdBy: String,
  tags: Array
};
