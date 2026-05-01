import React, { useEffect } from 'react';
import { render, Text, Box } from 'ink';
import { getDb } from './db/init.js';

const App = () => {
  useEffect(() => {
    // Initialize DB to ensure schema is created on startup
    try {
      getDb();
    } catch (error) {
      console.error("Failed to initialize database", error);
    }
  }, []);

  return (
    <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="magenta">
          ✨ Welcome to Singularity AI Orchestrator ✨
        </Text>
      </Box>
      <Box>
        <Text color="green">Initializing orchestration layer...</Text>
      </Box>
      <Box>
        <Text color="gray">Database connected. Waiting for tasks.</Text>
      </Box>
    </Box>
  );
};

render(<App />);
