import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';
import { execa } from 'execa';
import crypto from 'crypto';

interface Props {
  projectId: string;
  onDone: () => void;
}

export const CreateAgentForm: React.FC<Props> = ({ projectId, onDone }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [provider, setProvider] = useState('claude-code');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<{label: string, value: string}[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNameSubmit = () => {
    if (name.trim()) setStep(1);
  };

  const handleRoleSubmit = () => {
    if (role.trim()) setStep(2);
  };

  const loadModels = async (selectedProvider: string) => {
    setLoadingModels(true);
    try {
      if (selectedProvider === 'claude-code') {
        const { stdout } = await execa('claude', ['-p', 'List all your supported model strings. Only output a raw JSON array of strings.'], { reject: false, input: '' });
        try {
          const match = stdout.match(/\[.*\]/s);
          if (match) {
            const models = JSON.parse(match[0]);
            setAvailableModels(models.map((m: string) => ({ label: m, value: m })));
          }
        } catch(e) {
          // Fallback if parsing fails
          setAvailableModels([
            {label: 'claude-3-7-sonnet-20250219', value: 'claude-3-7-sonnet-20250219'},
            {label: 'claude-3-5-sonnet-20241022', value: 'claude-3-5-sonnet-20241022'},
            {label: 'claude-3-opus-20240229', value: 'claude-3-opus-20240229'}
          ]);
        }
      } else if (selectedProvider === 'codex') {
          // Codex CLI doesn't easily output a raw list non-interactively in the same way, using known defaults
          setAvailableModels([
            {label: 'gpt-5.4', value: 'gpt-5.4'},
            {label: 'gpt-5.3-codex', value: 'gpt-5.3-codex'},
            {label: 'gpt-4o', value: 'gpt-4o'},
            {label: 'o3-mini', value: 'o3-mini'}
          ]);
      }
    } catch(err) {
       console.error("Failed to load models", err);
    }
    setLoadingModels(false);
  };

  const handleProviderSubmit = (item: { value: string }) => {
    setProvider(item.value);
    setStep(3);
    loadModels(item.value);
  };

  const handleModelSelect = async (item: { value: string }) => {
    setModel(item.value);
    setSaving(true);
    try {
      await executeDb(
        'run',
        'INSERT INTO Agents (id, project_id, name, role, provider, model) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), projectId, name, role, provider, item.value]
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

      {step >= 2 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}><Text color="green">Select Provider: </Text></Box>
          {step === 2 ? (
            <SelectInput
              items={[
                { label: 'Claude Code', value: 'claude-code' },
                { label: 'OpenAI Codex', value: 'codex' }
              ]}
              onSelect={handleProviderSubmit}
            />
          ) : (
            <Text>{provider}</Text>
          )}
        </Box>
      )}

      {step >= 3 && !saving && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}><Text color="green">Select Model: </Text></Box>
          {loadingModels ? (
             <Text color="yellow">Loading available models from provider...</Text>
          ) : (
            <SelectInput
              items={availableModels.length > 0 ? availableModels : [{label: 'Loading...', value: ''}]}
              onSelect={handleModelSelect}
            />
          )}
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
