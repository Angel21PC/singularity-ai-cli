import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { executeDb } from '../db/index.js';

interface Props {
  onSelectProject: (projectId: string) => void;
  onExit: () => void;
}

export const ProjectSelect: React.FC<Props> = ({ onSelectProject, onExit }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (view === 'list') {
      executeDb('all', 'SELECT * FROM Projects')
        .then((data: any) => setProjects(data || []))
        .catch(console.error);
    }
  }, [view]);

  useInput((input, key) => {
    if (key.escape && view === 'create') {
      setView('list');
      setStep(0);
      setNewProjectName('');
      setNewProjectDesc('');
    }
  });

  const handleSelect = (item: { value: string }) => {
    if (item.value === 'exit') {
      onExit();
    } else if (item.value === 'create_new') {
      setView('create');
    } else {
      onSelectProject(item.value);
    }
  };

  const handleNameSubmit = () => {
    if (newProjectName.trim()) setStep(1);
  };

  const handleDescSubmit = async () => {
    const id = Date.now().toString();
    try {
      await executeDb(
        'run',
        'INSERT INTO Projects (id, name, description) VALUES (?, ?, ?)',
        [id, newProjectName, newProjectDesc]
      );
      setView('list');
      setStep(0);
      setNewProjectName('');
      setNewProjectDesc('');
      onSelectProject(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (view === 'create') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}><Text bold color="cyan">➕ Create New Project</Text></Box>
        
        <Box marginBottom={1}>
          <Text color="green">Project Name: </Text>
          {step === 0 ? (
            <TextInput
              value={newProjectName}
              onChange={setNewProjectName}
              onSubmit={handleNameSubmit}
              placeholder="e.g., My Awesome Startup"
            />
          ) : (
            <Text>{newProjectName}</Text>
          )}
        </Box>

        {step >= 1 && (
          <Box marginBottom={1}>
            <Text color="green">Description: </Text>
            {step === 1 ? (
              <TextInput
                value={newProjectDesc}
                onChange={setNewProjectDesc}
                onSubmit={handleDescSubmit}
                placeholder="e.g., A revolutionary AI app"
              />
            ) : (
              <Text>{newProjectDesc}</Text>
            )}
          </Box>
        )}
        <Box marginTop={1}><Text color="gray">Press Escape to cancel</Text></Box>
      </Box>
    );
  }

  const items = [
    ...projects.map((p) => ({ label: `📁 ${p.name}`, value: p.id })),
    { label: '➕ Create New Project', value: 'create_new' },
    { label: '❌ Exit', value: 'exit' }
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}><Text bold color="cyan">📂 Select a Project</Text></Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};