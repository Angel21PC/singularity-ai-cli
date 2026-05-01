import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { executeDb } from '../db/index.js';
import crypto from 'crypto';
export const ProjectSelect = ({ onSelectProject, onExit }) => {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('list');
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [step, setStep] = useState(0);
    useEffect(() => {
        if (view === 'list') {
            executeDb('all', 'SELECT * FROM Projects')
                .then((data) => setProjects(data || []))
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
    const handleSelect = (item) => {
        if (item.value === 'exit') {
            onExit();
        }
        else if (item.value === 'create_new') {
            setView('create');
        }
        else {
            onSelectProject(item.value);
        }
    };
    const handleNameSubmit = () => {
        if (newProjectName.trim())
            setStep(1);
    };
    const handleDescSubmit = async () => {
        const id = crypto.randomUUID();
        try {
            await executeDb('run', 'INSERT INTO Projects (id, name, description) VALUES (?, ?, ?)', [id, newProjectName, newProjectDesc]);
            setView('list');
            setStep(0);
            setNewProjectName('');
            setNewProjectDesc('');
            onSelectProject(id);
        }
        catch (err) {
            console.error(err);
        }
    };
    if (view === 'create') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "\u2795 Create New Project" }) }), _jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "green", children: "Project Name: " }), step === 0 ? (_jsx(TextInput, { value: newProjectName, onChange: setNewProjectName, onSubmit: handleNameSubmit, placeholder: "e.g., My Awesome Startup" })) : (_jsx(Text, { children: newProjectName }))] }), step >= 1 && (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "green", children: "Description: " }), step === 1 ? (_jsx(TextInput, { value: newProjectDesc, onChange: setNewProjectDesc, onSubmit: handleDescSubmit, placeholder: "e.g., A revolutionary AI app" })) : (_jsx(Text, { children: newProjectDesc }))] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press Escape to cancel" }) })] }));
    }
    const items = [
        ...projects.map((p) => ({ label: `📁 ${p.name}`, value: p.id })),
        { label: '➕ Create New Project', value: 'create_new' },
        { label: '❌ Exit', value: 'exit' }
    ];
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "\uD83D\uDCC2 Select a Project" }) }), _jsx(SelectInput, { items: items, onSelect: handleSelect })] }));
};
