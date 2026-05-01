import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { executeDb } from '../db/index.js';
import { execa } from 'execa';

export const GlobalChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  useEffect(() => {
    executeDb('all', 'SELECT * FROM Agents')
      .then((data: any) => setAvailableAgents(data || []))
      .catch(console.error);
  }, []);

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
    setInput('');
    setLogs(prev => [...prev, `> ${command}`]);
    setIsProcessing(true);

    try {
      // 1. Detectar mención (Orquestador / Delegación)
      const mentionMatch = command.match(/@(\w+)/);
      let agentName = null;
      if (mentionMatch) {
         agentName = mentionMatch[1];
      }

      // 2. Cargar datos del agente de la BBDD
      let agentProvider = 'claude-code';
      let agentModel = 'claude-3-5-sonnet-20241022';
      let systemRole = "You are a helpful assistant.";

      if (agentName) {
        const result: any = await executeDb('get', 'SELECT * FROM Agents WHERE name = ? OR role LIKE ?', [agentName, `%${agentName}%`]);
        if (result) {
          agentProvider = result.provider;
          agentModel = result.model;
          systemRole = `You are playing the role: ${result.role}.`;
          setLogs(prev => [...prev, `[System] Delegating task to agent: ${result.name} (${result.provider})`]);
        } else {
          setLogs(prev => [...prev, `[System] Warning: Agent '${agentName}' not found. Using default Orchestrator.`]);
        }
      }

      // 3. Ejecutar comando al CLI
      const fullPrompt = `${systemRole}\nUser request: ${command}`;
      
      let outputText = '';
      if (agentProvider === 'claude-code') {
          const { stdout, stderr } = await execa('claude', ['-p', fullPrompt], { reject: false, input: '' });
          if (stderr && stderr.includes('limit')) {
             // Fake parser for limit demo
             outputText = `[Rate Limit] Caught limit. Will retry later.`;
          } else {
             outputText = stdout || stderr || "No output";
          }
      } else {
          // Codex execution
          const { stdout, stderr } = await execa('codex', ['exec', fullPrompt], { reject: false });
          outputText = stdout || stderr || "No output";
      }

      setLogs(prev => [...prev, `[Agent] ${outputText.substring(0, 300)}${outputText.length > 300 ? '...' : ''}`]);

    } catch (err: any) {
      setLogs(prev => [...prev, `[Error] ${err.message}`]);
    }
    
    setIsProcessing(false);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">💬 Global Chat & Orchestration</Text>
      <Text color="gray">Type '@AgentName' to delegate a task directly.</Text>
      
      <Box flexDirection="column" marginTop={1} marginBottom={1} minHeight={10} borderStyle="single" borderColor="gray" padding={1}>
        {logs.length === 0 ? <Text color="gray">No messages yet. Try: @Frontend write a react button.</Text> : null}
        {logs.map((log, i) => (
          <Text key={i} color={log.startsWith('>') ? 'white' : log.startsWith('[Error]') ? 'red' : log.startsWith('[System]') ? 'yellow' : 'green'}>
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
