import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';
import { CreateAgentForm } from './CreateAgentForm.js';

type View = 'menu' | 'view_agents' | 'create_agent' | 'status';

export const App = () => {
  const { exit } = useApp();
  const [currentView, setCurrentView] = useState<View>('menu');
  const [agents, setAgents] = useState<any[]>([]);

  const fetchAgents = async () => {
    try {
      const results = await executeDb('all', 'SELECT * FROM Agents ORDER BY id DESC');
      setAgents(results);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentView === 'view_agents') {
      fetchAgents();
    }
  }, [currentView]);

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'exit') {
      exit();
    } else {
      setCurrentView(item.value as View);
    }
  };

  const renderViewAgents = () => (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold color="cyan">🤖 Agents List</Text></Box>
      {agents.length === 0 ? (
        <Text color="gray">No agents found. Create one first!</Text>
      ) : (
        agents.map((agent: any) => (
          <Box key={agent.id} marginBottom={1}>
            <Text bold color="green">{agent.name} </Text>
            <Text color="yellow">[{agent.provider}] </Text>
            <Text color="white">- {agent.role}</Text>
          </Box>
        ))
      )}
      <Box marginTop={1}>
        <Text color="gray">Press Space to go back</Text>
      </Box>
      <SelectInput
        items={[{ label: 'Back to Menu', value: 'menu' }]}
        onSelect={() => setCurrentView('menu')}
      />
    </Box>
  );

  const renderStatus = () => (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold color="cyan">📊 Status & Providers</Text></Box>
      <Text>Provider: <Text color="green">Claude-Code</Text> (Installed)</Text>
      <Text>Provider: <Text color="green">Codex</Text> (Installed)</Text>
      <Box marginTop={1}>
        <SelectInput
          items={[{ label: 'Back to Menu', value: 'menu' }]}
          onSelect={() => setCurrentView('menu')}
        />
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" padding={1} width={80}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          ✨ Singularity AI CLI ✨
        </Text>
      </Box>
      
      {currentView === 'menu' && (
        <Box flexDirection="column">
          <Box marginBottom={1}><Text color="gray">Select an action:</Text></Box>
          <SelectInput
            items={[
              { label: '👀 View Agents', value: 'view_agents' },
              { label: '➕ Create Agent', value: 'create_agent' },
              { label: '📊 Status/Providers', value: 'status' },
              { label: '❌ Exit', value: 'exit' }
            ]}
            onSelect={handleSelect}
          />
        </Box>
      )}

      {currentView === 'view_agents' && renderViewAgents()}
      
      {currentView === 'create_agent' && (
        <CreateAgentForm onDone={() => setCurrentView('menu')} />
      )}

      {currentView === 'status' && renderStatus()}

    </Box>
  );
};
