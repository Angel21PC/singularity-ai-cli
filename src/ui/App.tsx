import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ProjectSelect } from './ProjectSelect.js';
import { CreateAgentForm } from './CreateAgentForm.js';
import { ChatAgent } from './ChatAgent.js';
import { StatusPanel } from './StatusPanel.js';
import { GlobalChat } from './GlobalChat.js';
import { AgentService } from '../services/AgentService.js';
import { Agent } from '../db/repositories/AgentRepository.js';

export const App: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'menu' | 'create_agent' | 'chat_agent' | 'global_chat'>('menu');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (activeProjectId) {
      try {
        setAgents(AgentService.getAgentsByProject(activeProjectId));
      } catch (err) {
        console.error(err);
      }
    }
  }, [activeProjectId, activeView]);

  if (!activeProjectId) {
    return <ProjectSelect onSelectProject={setActiveProjectId} onExit={() => process.exit(0)} />;
  }

  const menuItems = [
    { label: '💬 Global Chat (Orchestrator)', value: 'global_chat' },
    { label: '➕ Create New Agent', value: 'create_agent' },
    ...agents.map(a => ({ label: `🤖 Chat: ${a.name} (${a.provider})`, value: `chat_${a.id}` })),
    { label: '⬅️  Change Project', value: 'change_project' },
    { label: '❌ Exit', value: 'exit' },
  ];

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === 'create_agent') {
      setActiveView('create_agent');
    } else if (item.value === 'global_chat') {
      setActiveView('global_chat');
    } else if (item.value === 'change_project') {
      setActiveProjectId(null);
    } else if (item.value === 'exit') {
      process.exit(0);
    } else if (item.value.startsWith('chat_')) {
      const agentId = item.value.replace('chat_', '');
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
        setActiveView('chat_agent');
      }
    }
  };

  return (
    <Box flexDirection="row" width="100%" height={20}>
      <Box flexDirection="column" width="30%" borderStyle="single" padding={1}>
        <Text bold color="green">Singularity AI</Text>
        <Text color="gray">Project: {activeProjectId}</Text>
        <Box marginTop={1}>
          <StatusPanel />
        </Box>
      </Box>

      <Box flexDirection="column" width="70%" borderStyle="single" padding={1}>
        {activeView === 'menu' && (
          <Box flexDirection="column">
            <Text bold>Select Action:</Text>
            <SelectInput items={menuItems} onSelect={handleSelect} />
            
            {agents.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                <Text color="yellow">Available Agents:</Text>
                {agents.map(a => <Text key={a.id}>- {a.name} ({a.role})</Text>)}
              </Box>
            )}
          </Box>
        )}

        {activeView === 'create_agent' && (
          <CreateAgentForm projectId={activeProjectId} onBack={() => setActiveView('menu')} />
        )}

        {activeView === 'chat_agent' && selectedAgent && (
          <ChatAgent agent={selectedAgent} onBack={() => setActiveView('menu')} />
        )}

        {activeView === 'global_chat' && (
          <Box flexDirection="column" width="100%">
            <Box alignSelf="flex-end"><Text color="gray">Press ESC to menu</Text></Box>
            <GlobalChat projectId={activeProjectId} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
