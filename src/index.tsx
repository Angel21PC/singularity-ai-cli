#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { getDb } from './db/init.js';

try {
  getDb();
} catch (error) {
  console.error("Failed to initialize database", error);
}

render(<App />);
