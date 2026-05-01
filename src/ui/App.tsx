import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';
import { CreateAgentForm } from './CreateAgentForm.js';
import { GlobalChat } from './GlobalChat.js';
import { StatusPanel } from './StatusPanel.js';
import { ChatAgent } from './ChatAgent.js';

type View = 'menu' | 'view_agents' | 'create_agent' | 'status' | 'chat_select' | 'chat';

export const App = () => {
  const { exit } = useApp();
  const [currentView, setCurrentView] = useState<View>('menu');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  const fetchAgents = async () => {
    try {
      const results = await executeDb('all', 'SELECT * FROM Agents ORDER BY id DESC');
      setAgents(results);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentView === 'view_agents' || currentView === 'chat_select') {
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

  const handleAgentSelectForChat = (item: { value: string }) => {
    if (item.value === 'back') {
      setCurrentView('menu');
      return;
    }
    const agent = agents.find((a) => a.id.toString() === item.value);
    if (agent) {
      setSelectedAgent(agent);
      setCurrentView('chat');
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
            <Text color="yellow">[{agent.provider}{agent.model ? ` | ${agent.model}` : ''}] </Text>
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

  const renderChatSelect = () => {
    const items = agents.map((agent) => ({
      label: agent.name,
      value: agent.id.toString(),
    }));
    items.push({ label: 'Back to Menu', value: 'back' });

    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}><Text bold color="cyan">💬 Select Agent to Chat</Text></Box>
        {agents.length === 0 ? (
          <Text color="gray">No agents found. Create one first!</Text>
        ) : (
          <SelectInput items={items} onSelect={handleAgentSelectForChat} />
        )}
        {agents.length === 0 && (
          <Box marginTop={1}>
            <SelectInput
              items={[{ label: 'Back to Menu', value: 'back' }]}
              onSelect={() => setCurrentView('menu')}
            />
          </Box>
        )}
      </Box>
    );
  };

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
              { label: '💬 Chat with Agent', value: 'chat_select' },
              { label: '📊 Status/Providers', value: 'status' },
              { label: '💬 Global Chat', value: 'chat' },
        { label: '📊 Status { label: '❌ Exit', value: 'exit' } Limits', value: 'status' },
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

      {currentView === 'chat_select' && renderChatSelect()}

      {currentView === 'chat' && selectedAgent && (
        <ChatAgent agent={selectedAgent} onBack={() => setCurrentView('menu')} />
      )}

      {currentView === 'status' && renderStatus()}

    </Box>
  );
};
