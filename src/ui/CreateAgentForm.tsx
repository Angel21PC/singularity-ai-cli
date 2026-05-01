import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';

interface Props {
  onDone: () => void;
}

export const CreateAgentForm: React.FC<Props> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [provider, setProvider] = useState('claude-code');
  const [saving, setSaving] = useState(false);

  const handleNameSubmit = () => {
    if (name.trim()) setStep(1);
  };

  const handleRoleSubmit = () => {
    if (role.trim()) setStep(2);
  };

  const handleProviderSubmit = async (item: { value: string }) => {
    setProvider(item.value);
    setSaving(true);
    try {
      await executeDb(
        'run',
        'INSERT INTO Agents (name, role, provider) VALUES (?, ?, ?)',
        [name, role, item.value]
      );
    } catch (err) {
      console.error(err);
    } finally {
      onDone();
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold color="cyan">➕ Create New Agent</Text></Box>
      
      {step >= 0 && (
        <Box marginBottom={1}>
          <Text color="green">Agent Name: </Text>
          {step === 0 ? (
            <TextInput
              value={name}
              onChange={setName}
              onSubmit={handleNameSubmit}
              placeholder="e.g., Frontend Specialist"
            />
          ) : (
            <Text>{name}</Text>
          )}
        </Box>
      )}

      {step >= 1 && (
        <Box marginBottom={1}>
          <Text color="green">Agent Role: </Text>
          {step === 1 ? (
            <TextInput
              value={role}
              onChange={setRole}
              onSubmit={handleRoleSubmit}
              placeholder="e.g., Write React components"
            />
          ) : (
            <Text>{role}</Text>
          )}
        </Box>
      )}

      {step >= 2 && !saving && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}><Text color="green">Select Provider: </Text></Box>
          <SelectInput
            items={[
              { label: 'Claude Code', value: 'claude-code' },
              { label: 'OpenAI Codex', value: 'codex' }
            ]}
            onSelect={handleProviderSubmit}
          />
        </Box>
      )}

      {saving && (
        <Box>
          <Text color="yellow">Saving agent...</Text>
        </Box>
      )}
    </Box>
  );
};
