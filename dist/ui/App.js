import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import { executeDb } from '../db/index.js';
import { CreateAgentForm } from './CreateAgentForm.js';
import { GlobalChat } from './GlobalChat.js';
import { StatusPanel } from './StatusPanel.js';
import { ProjectSelect } from './ProjectSelect.js';
export const App = () => {
    const { exit } = useApp();
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [currentView, setCurrentView] = useState('project_select');
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState(null);
    useEffect(() => {
        if (currentView === 'agents' && activeProjectId) {
            executeDb('all', 'SELECT * FROM Agents WHERE project_id = ?', [activeProjectId])
                .then((data) => setAgents(data || []))
                .catch(console.error);
        }
    }, [currentView, activeProjectId]);
    useInput((input, key) => {
        if (key.escape) {
            if (currentView !== 'project_select' && currentView !== 'menu') {
                setCurrentView('menu');
                setSelectedAgent(null); // Clear selected agent on back
            }
            else if (currentView === 'menu') {
                setCurrentView('project_select');
                setActiveProjectId(null);
            }
        }
        else if (key.ctrl && input === 'c') {
            exit();
        }
    });
    const handleMenuSelect = (item) => {
        if (item.value === 'switch_project') {
            setCurrentView('project_select');
            setActiveProjectId(null);
            return;
        }
        if (item.value === 'exit') {
            exit();
            return;
        }
        setCurrentView(item.value);
    };
    const renderMenu = () => (_jsx(Box, { flexDirection: "column", children: _jsx(SelectInput, { items: [
                { label: '👀 View Agents', value: 'agents' },
                { label: '➕ Create Agent', value: 'create_agent' },
                { label: '💬 Global Chat', value: 'chat' },
                { label: '📊 Status & Limits', value: 'status' },
                { label: '📂 Switch Project', value: 'switch_project' },
                { label: '❌ Exit', value: 'exit' }
            ], onSelect: handleMenuSelect }) }));
    const renderAgents = () => {
        if (selectedAgent) {
            return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, color: "cyan", children: ["Agent: ", selectedAgent.name] }) }), _jsxs(Text, { children: ["Role: ", selectedAgent.role] }), _jsxs(Text, { children: ["Provider: ", selectedAgent.provider, " (", selectedAgent.model, ")"] }), _jsx(Box, { marginTop: 1, children: _jsx(SelectInput, { items: [
                                { label: '⬅️ Back to Agents', value: 'back' },
                                { label: '🗑️ Delete Agent', value: 'delete' }
                            ], onSelect: (item) => {
                                if (item.value === 'delete') {
                                    executeDb('run', 'DELETE FROM Agents WHERE id = ?', [selectedAgent.id])
                                        .then(() => {
                                        setAgents(agents.filter((a) => a.id !== selectedAgent.id));
                                        setSelectedAgent(null);
                                    })
                                        .catch(console.error);
                                }
                                else {
                                    setSelectedAgent(null);
                                }
                            } }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press Escape to return to menu" }) })] }));
        }
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "cyan", children: "\uD83D\uDC40 Active Agents (Project)" }) }), agents.length === 0 ? (_jsx(Text, { color: "gray", children: "No agents found in this project. Create one first!" })) : (_jsx(SelectInput, { items: agents.map((a) => ({
                        label: `${a.name} (@${a.name.replace(/\s+/g, '')}) - ${a.role}`,
                        value: a.id
                    })), onSelect: (item) => {
                        const agent = agents.find((a) => a.id === item.value);
                        setSelectedAgent(agent);
                    } })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press Escape to return to menu" }) })] }));
    };
    return (_jsxs(Box, { flexDirection: "column", padding: 1, borderStyle: "round", borderColor: "magenta", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "magenta", children: "\u2728 Singularity AI CLI \u2728" }) }), currentView === 'project_select' && (_jsx(ProjectSelect, { onSelectProject: (projectId) => {
                    setActiveProjectId(projectId);
                    setCurrentView('menu');
                }, onExit: exit })), currentView === 'menu' && (_jsxs(_Fragment, { children: [_jsx(Text, { color: "gray", children: "Select an action:" }), _jsx(Box, { marginTop: 1, children: renderMenu() })] })), currentView === 'agents' && renderAgents(), currentView === 'create_agent' && activeProjectId && _jsx(CreateAgentForm, { projectId: activeProjectId, onDone: () => setCurrentView('menu') }), currentView === 'chat' && activeProjectId && _jsx(GlobalChat, { projectId: activeProjectId }), currentView === 'status' && _jsx(StatusPanel, {})] }));
};
