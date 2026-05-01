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
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  useEffect(() => {
    if (currentView === 'agents') {
      executeDb('all', 'SELECT * FROM Agents')
        .then((data: any) => setAgents(data || []))
        .catch(console.error);
    }
  }, [currentView]);

  useInput((input, key) => {
    if (key.escape) {
      if (currentView !== 'menu') {
        setCurrentView('menu');
        setSelectedAgent(null); // Clear selected agent on back
      }
    } else if (key.ctrl && input === 'c') {
      exit();
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

  const renderAgents = () => {
    if (selectedAgent) {
      return (
        <Box flexDirection="column" padding={1}>
          <Box marginBottom={1}><Text bold color="cyan">Agent: {selectedAgent.name}</Text></Box>
          <Text>Role: {selectedAgent.role}</Text>
          <Text>Provider: {selectedAgent.provider} ({selectedAgent.model})</Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                { label: '⬅️ Back to Agents', value: 'back' },
                { label: '🗑️ Delete Agent', value: 'delete' }
              ]}
              onSelect={(item) => {
                if (item.value === 'delete') {
                  executeDb('run', 'DELETE FROM Agents WHERE id = ?', [selectedAgent.id])
                    .then(() => {
                      setAgents(agents.filter((a: any) => a.id !== selectedAgent.id));
                      setSelectedAgent(null);
                    })
                    .catch(console.error);
                } else {
                  setSelectedAgent(null);
                }
              }}
            />
          </Box>
          <Box marginTop={1}><Text color="gray">Press Escape to return to menu</Text></Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}><Text bold color="cyan">👀 Active Agents</Text></Box>
        {agents.length === 0 ? (
          <Text color="gray">No agents found. Create one first!</Text>
        ) : (
          <SelectInput
            items={agents.map((a: any) => ({
              label: `${a.name} (@${a.name.replace(/\s+/g, '')}) - ${a.role}`,
              value: a.id
            }))}
            onSelect={(item) => {
              const agent = agents.find((a: any) => a.id === item.value);
              setSelectedAgent(agent);
            }}
          />
        )}
        <Box marginTop={1}><Text color="gray">Press Escape to return to menu</Text></Box>
      </Box>
    );
  };

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
