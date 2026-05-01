import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ProviderRegistry } from '../cli-wrappers/ProviderRegistry.js';
import { Agent } from '../db/repositories/AgentRepository.js';

interface Props {
  agent: Agent;
  onBack: () => void;
}

export const ChatAgent: React.FC<Props> = ({ agent, onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse('');
    
    try {
      const fullPrompt = `You are ${agent.name}. Your role is: ${agent.role}. Respond to this: ${prompt}`;
      
      const wrapper = ProviderRegistry.getWrapper(agent.provider);
      const result = await wrapper.ask(fullPrompt);
      setResponse(result);
      setPrompt('');
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">💬 Chat with {agent.name}</Text>
        {agent.model && <Text color="yellow"> (Model: {agent.model})</Text>}
      </Box>

      {response && (
        <Box flexDirection="column" marginBottom={1} borderStyle="single" padding={1}>
          <Text color="green">Response:</Text>
          <Text>{response}</Text>
        </Box>
      )}

      {loading ? (
        <Box marginBottom={1}>
          <Text color="yellow">Agent is thinking...</Text>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color="green">Prompt: </Text>
          <TextInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            placeholder="Type your message..."
          />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
};
