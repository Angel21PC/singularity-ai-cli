import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { AgentService } from '../services/AgentService.js';
import { Orchestrator } from '../core/Orchestrator.js';
import { eventBus, OrchestratorEvent } from '../core/EventBus.js';
import crypto from 'crypto';

interface Props {
  projectId: string;
}

export const GlobalChat: React.FC<Props> = ({ projectId }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const currentTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      setAvailableAgents(AgentService.getAgentsByProject(projectId));
    } catch (err) {
      console.error(err);
    }

    const handleEvent = (event: OrchestratorEvent) => {
      if (event.projectId !== projectId) return;
      if (event.taskId && currentTaskIdRef.current && event.taskId !== currentTaskIdRef.current) return;

      if (event.type === 'SystemLog') {
        setLogs(prev => [...prev, `[System] ${event.payload}`]);
      } else if (event.type === 'OrchestratorThinking') {
        setLogs(prev => [...prev, `[Orchestrator] ${event.payload}`]);
      } else if (event.type === 'Delegating') {
        setLogs(prev => [...prev, `[System] ${event.payload}`]);
      } else if (event.type === 'TaskCompleted') {
        const out = event.payload as string;
        const truncatedFinal = out.length > 200 ? out.substring(0, 200) + '...' : out;
        setLogs(prev => [...prev, `[Agent] ${truncatedFinal}`]);
        setIsProcessing(false);
      } else if (event.type === 'RateLimited') {
        setLogs(prev => [...prev, `[System] ${event.payload}`]);
        setIsProcessing(false);
      } else if (event.type === 'TaskFailed') {
        setLogs(prev => [...prev, `[Error] ${event.payload}`]);
        setIsProcessing(false);
      }
    };

    eventBus.onEvent(handleEvent);
    
    return () => {
      eventBus.offEvent(handleEvent);
    };
  }, [projectId]);

  const hintMatch = input.match(/@([a-zA-Z0-9_-]*)$/);
  let hints: string[] = [];
  if (hintMatch) {
    const partial = hintMatch[1].toLowerCase();
    hints = availableAgents
      .filter((a: any) => a.name.toLowerCase().includes(partial) || a.role.toLowerCase().includes(partial) || a.name.replace(/\s+/g, '').toLowerCase().includes(partial))
      .map((a: any) => `@${a.name.replace(/\s+/g, '')} (${a.provider})`);
  }

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    
    const command = input;
    const newTaskId = crypto.randomUUID();
    currentTaskIdRef.current = newTaskId;
    setInput('');
    setLogs(prev => [...prev, `> ${command}`]);
    setIsProcessing(true);

    // Call orchestrator asynchronously and don't await, let the event bus handle responses
    Orchestrator.handlePrompt(projectId, command, newTaskId).catch(console.error);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">💬 Global Chat & Orchestration (Project)</Text>
      <Text color="gray">Type your request and the Orchestrator will handle or delegate it.</Text>
      
      <Box flexDirection="column" marginTop={1} marginBottom={1} minHeight={10} borderStyle="single" borderColor="gray" padding={1}>
        {logs.length === 0 ? <Text color="gray">No messages yet. Try: create a react button.</Text> : null}
        {logs.map((log, i) => (
          <Text key={i} color={log.startsWith('>') ? 'white' : log.startsWith('[Error]') ? 'red' : log.startsWith('[System]') ? 'yellow' : log.startsWith('[Orchestrator]') ? 'magenta' : 'green'}>
            {log}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column">
        <Box>
          <Text color="blue">{isProcessing ? "⏳ Processing... " : "❯ "}</Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Enter command..."
          />
        </Box>
        {hints.length > 0 && (
          <Box marginTop={1}>
            <Text color="cyan">Agents: {hints.join(', ')}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
