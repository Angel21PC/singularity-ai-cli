import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { getDb } from '../db/init.js';
import { executeDb } from '../db/index.js';
import { CreateAgentForm } from './CreateAgentForm.js';
import { GlobalChat } from './GlobalChat.js';
import { StatusPanel } from './StatusPanel.js';

export const App: React.FC = () => {
  const { exit } = useApp();
  const [currentView, setCurrentView] = useState<'menu' | 'agents' | 'create_agent' | 'chat' | 'status'>('menu');
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (currentView === 'agents') {
      executeDb('all', 'SELECT * FROM Agents')
        .then((data: any) => setAgents(data || []))
        .catch(console.error);
    }
  }, [currentView]);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      exit();
    }
    if (key.backspace && currentView !== 'menu') {
      setCurrentView('menu');
    }
  });

  const handleMenuSelect = (item: { value: string }) => {
    if (item.value === 'exit') {
      exit();
      return;
    }
    setCurrentView(item.value as any);
  };

  const renderMenu = () => (
    <Box flexDirection="column">
      <SelectInput
        items={[
          { label: '👀 View Agents', value: 'agents' },
          { label: '➕ Create Agent', value: 'create_agent' },
          { label: '💬 Global Chat', value: 'chat' },
          { label: '📊 Status & Limits', value: 'status' },
          { label: '❌ Exit', value: 'exit' }
        ]}
        onSelect={handleMenuSelect}
      />
    </Box>
  );

  const renderAgents = () => (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold color="cyan">👀 Active Agents</Text></Box>
      {agents.length === 0 ? (
        <Text color="gray">No agents found. Create one first!</Text>
      ) : (
        agents.map((a, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text bold color="green">{a.name} <Text color="gray">(@{a.name.replace(/\s+/g, '')})</Text></Text>
            <Text>Role: {a.role}</Text>
            <Text>Provider: {a.provider} ({a.model})</Text>
          </Box>
        ))
      )}
      <Box marginTop={1}><Text color="gray">Press Backspace to return to menu</Text></Box>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="magenta">
      <Box marginBottom={1}>
        <Text bold color="magenta">✨ Singularity AI CLI ✨</Text>
      </Box>

      {currentView === 'menu' && (
        <>
          <Text color="gray">Select an action:</Text>
          <Box marginTop={1}>
            {renderMenu()}
          </Box>
        </>
      )}

      {currentView === 'agents' && renderAgents()}
      {currentView === 'create_agent' && <CreateAgentForm onDone={() => setCurrentView('menu')} />}
      {currentView === 'chat' && <GlobalChat />}
      {currentView === 'status' && <StatusPanel />}
    </Box>
  );
};
