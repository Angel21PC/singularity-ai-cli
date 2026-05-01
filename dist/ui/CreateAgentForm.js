import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';
import { execa } from 'execa';
import crypto from 'crypto';
export const CreateAgentForm = ({ projectId, onDone }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [provider, setProvider] = useState('claude-code');
    const [model, setModel] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [saving, setSaving] = useState(false);
    const handleNameSubmit = () => {
        if (name.trim())
            setStep(1);
    };
    const handleRoleSubmit = () => {
        if (role.trim())
            setStep(2);
    };
    const loadModels = async (selectedProvider) => {
        setLoadingModels(true);
        try {
            if (selectedProvider === 'claude-code') {
                const { stdout } = await execa('claude', ['-p', 'List all your supported model strings. Only output a raw JSON array of strings.'], { reject: false, input: '' });
                try {
                    const match = stdout.match(/\[.*\]/s);
                    if (match) {
                        const models = JSON.parse(match[0]);
                        setAvailableModels(models.map((m) => ({ label: m, value: m })));
                    }
                }
                catch (e) {
                    // Fallback if parsing fails
                    setAvailableModels([
                        { label: 'claude-3-7-sonnet-20250219', value: 'claude-3-7-sonnet-20250219' },
                        { label: 'claude-3-5-sonnet-20241022', value: 'claude-3-5-sonnet-20241022' },
                        { label: 'claude-3-opus-20240229', value: 'claude-3-opus-20240229' }
                    ]);
                }
            }
            else if (selectedProvider === 'codex') {
                // Codex CLI doesn't easily output a raw list non-interactively in the same way, using known defaults
                setAvailableModels([
                    { label: 'gpt-5.4', value: 'gpt-5.4' },
                    { label: 'gpt-5.3-codex', value: 'gpt-5.3-codex' },
                    { label: 'gpt-4o', value: 'gpt-4o' },
                    { label: 'o3-mini', value: 'o3-mini' }
                ]);
            }
        }
        catch (err) {
            console.error("Failed to load models", err);
        }
        setLoadingModels(false);
    };
    const handleProviderSubmit = (item) => {
        setProvider(item.value);
        setStep(3);
        loadModels(item.value);
    };
    const handleModelSelect = async (item) => {
        setModel(item.value);
        setSaving(true);
        try {
            await executeDb('run', 'INSERT INTO Agents (id, project_id, name, role, provider, model) VALUES (?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), projectId, name, role, provider, item.value]);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            onDone();
        }
    };
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "\u2795 Create New Agent" }) }), step >= 0 && (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "green", children: "Agent Name: " }), step === 0 ? (_jsx(TextInput, { value: name, onChange: setName, onSubmit: handleNameSubmit, placeholder: "e.g., Frontend Specialist" })) : (_jsx(Text, { children: name }))] })), step >= 1 && (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "green", children: "Agent Role: " }), step === 1 ? (_jsx(TextInput, { value: role, onChange: setRole, onSubmit: handleRoleSubmit, placeholder: "e.g., Write React components" })) : (_jsx(Text, { children: role }))] })), step >= 2 && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "green", children: "Select Provider: " }) }), step === 2 ? (_jsx(SelectInput, { items: [
                            { label: 'Claude Code', value: 'claude-code' },
                            { label: 'OpenAI Codex', value: 'codex' }
                        ], onSelect: handleProviderSubmit })) : (_jsx(Text, { children: provider }))] })), step >= 3 && !saving && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "green", children: "Select Model: " }) }), loadingModels ? (_jsx(Text, { color: "yellow", children: "Loading available models from provider..." })) : (_jsx(SelectInput, { items: availableModels.length > 0 ? availableModels : [{ label: 'Loading...', value: '' }], onSelect: handleModelSelect }))] })), saving && (_jsx(Box, { children: _jsx(Text, { color: "yellow", children: "Saving agent..." }) }))] }));
};
