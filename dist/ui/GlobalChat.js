import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { executeDb } from '../db/index.js';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { ProviderRegistry } from '../cli-wrappers/ProviderRegistry.js';
export const GlobalChat = ({ projectId }) => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [availableAgents, setAvailableAgents] = useState([]);
    useEffect(() => {
        executeDb('all', 'SELECT * FROM Agents WHERE project_id = ?', [projectId])
            .then((data) => setAvailableAgents(data || []))
            .catch(console.error);
        // Ensure memory_dumps directory exists
        const dumpDir = path.resolve(process.cwd(), 'memory_dumps');
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }
    }, [projectId]);
    const hintMatch = input.match(/@([a-zA-Z0-9_-]*)$/);
    let hints = [];
    if (hintMatch) {
        const partial = hintMatch[1].toLowerCase();
        hints = availableAgents
            .filter((a) => a.name.toLowerCase().includes(partial) || a.role.toLowerCase().includes(partial) || a.name.replace(/\s+/g, '').toLowerCase().includes(partial))
            .map((a) => `@${a.name.replace(/\s+/g, '')} (${a.provider})`);
    }
    const runAgent = async (agentName, prompt) => {
        const taskId = crypto.randomUUID();
        let agentProvider = 'claude-code';
        let agentId = 'orchestrator';
        let systemRole = "You are a helpful Orchestrator. When needed, delegate to other agents by outputting '>>>DELEGATE @AgentName<<<\\n<task>'.";
        if (agentName !== 'Orchestrator') {
            const result = await executeDb('get', 'SELECT * FROM Agents WHERE (name = ? OR role LIKE ?) AND project_id = ?', [agentName, `%${agentName}%`, projectId]);
            if (result) {
                agentProvider = result.provider;
                agentId = result.id;
                systemRole = `You are playing the role: ${result.role}.`;
                setLogs(prev => [...prev, `[System] Delegating task to agent: ${result.name} (${result.provider})`]);
            }
            else {
                setLogs(prev => [...prev, `[System] Warning: Agent '${agentName}' not found in this project. Executing task directly.`]);
            }
        }
        // Insert into TaskQueue as RUNNING
        await executeDb('run', 'INSERT INTO TaskQueue (id, project_id, agent_id, prompt, status) VALUES (?, ?, ?, ?, ?)', [taskId, projectId, agentId, prompt, 'RUNNING']).catch(() => { });
        const dumpPath = path.resolve(process.cwd(), `memory_dumps/${projectId}_latest_handoff.txt`);
        const previousContext = fs.existsSync(dumpPath) ? `\nPrevious Handoff Context:\n${fs.readFileSync(dumpPath, 'utf8').substring(0, 1000)}\n` : '';
        const fullPrompt = `${systemRole}${previousContext}\nUser request: ${prompt}`;
        let outputText = '';
        try {
            const wrapper = ProviderRegistry.getWrapper(agentProvider);
            outputText = await wrapper.ask(fullPrompt);
            // Save full output to memory_dumps/<project>/<task_id>.txt
            const dumpDir = path.resolve(process.cwd(), `memory_dumps/${projectId}`);
            if (!fs.existsSync(dumpDir))
                fs.mkdirSync(dumpDir, { recursive: true });
            fs.writeFileSync(path.join(dumpDir, `${taskId}.txt`), outputText, 'utf8');
            // Update TaskQueue with result
            await executeDb('run', 'UPDATE TaskQueue SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['COMPLETED', outputText, taskId]).catch(() => { });
        }
        catch (err) {
            if (err.name === 'RateLimitError') {
                const resumeAt = new Date(Date.now() + err.waitMs).toISOString();
                await executeDb('run', 'UPDATE TaskQueue SET status = ?, resume_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['SLEEPING', resumeAt, taskId]).catch(() => { });
                throw err;
            }
            else {
                await executeDb('run', 'UPDATE TaskQueue SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['FAILED', err.message, taskId]).catch(() => { });
                throw err;
            }
        }
        return outputText;
    };
    const handleSubmit = async () => {
        if (!input.trim() || isProcessing)
            return;
        const command = input;
        setInput('');
        setLogs(prev => [...prev, `> ${command}`]);
        setIsProcessing(true);
        try {
            setLogs(prev => [...prev, `[Orchestrator] Analyzing request...`]);
            // Step 1: Send to Orchestrator
            const orchOutput = await runAgent('Orchestrator', command);
            let finalOutput = orchOutput;
            // Step 2 & 3: Check for delegation
            const delegationMatch = orchOutput.match(/>>>DELEGATE @([A-Za-z0-9_]+)<<<[\s\S]*?\n([\s\S]*)/);
            if (delegationMatch) {
                const subAgentName = delegationMatch[1];
                const subTask = delegationMatch[2];
                // Step 4: Spawn subagent and get result
                const subOutput = await runAgent(subAgentName, subTask);
                // Step 6: Write to memory_dumps/<project_id>_latest_handoff.txt
                const dumpPath = path.resolve(process.cwd(), `memory_dumps/${projectId}_latest_handoff.txt`);
                fs.writeFileSync(dumpPath, subOutput, 'utf8');
                const historyPath = path.resolve(process.cwd(), `memory_dumps/${projectId}_history.txt`);
                fs.appendFileSync(historyPath, `\n\n[Delegated to @${subAgentName}]: ${subTask}\n[Result from @${subAgentName}]:\n${subOutput}\n`, 'utf8');
                setLogs(prev => [...prev, `[Orchestrator] Analyzing subagent result...`]);
                // Step 4 (Feedback): Feed back to Orchestrator
                const feedbackPrompt = `The subagent @${subAgentName} executed your delegation. Its full output is saved at ${dumpPath}.\nHere is a snippet: ${subOutput.substring(0, 500)}\n\nPlease provide the final response to the user based on this result.`;
                finalOutput = await runAgent('Orchestrator', feedbackPrompt);
            }
            // Step 5: Truncate final agent output to 200 chars for the UI
            const truncatedFinal = finalOutput.length > 200 ? finalOutput.substring(0, 200) + '...' : finalOutput;
            setLogs(prev => [...prev, `[Agent] ${truncatedFinal}`]);
        }
        catch (err) {
            if (err.name === 'RateLimitError') {
                setLogs(prev => [...prev, `[System] Agent paused. Task queued for later.`]);
            }
            else {
                setLogs(prev => [...prev, `[Error] ${err.message}`]);
            }
        }
        setIsProcessing(false);
    };
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "\uD83D\uDCAC Global Chat & Orchestration (Project)" }), _jsx(Text, { color: "gray", children: "Type your request and the Orchestrator will handle or delegate it." }), _jsxs(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1, minHeight: 10, borderStyle: "single", borderColor: "gray", padding: 1, children: [logs.length === 0 ? _jsx(Text, { color: "gray", children: "No messages yet. Try: create a react button." }) : null, logs.map((log, i) => (_jsx(Text, { color: log.startsWith('>') ? 'white' : log.startsWith('[Error]') ? 'red' : log.startsWith('[System]') ? 'yellow' : log.startsWith('[Orchestrator]') ? 'magenta' : 'green', children: log }, i)))] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: "blue", children: isProcessing ? "⏳ Processing... " : "❯ " }), _jsx(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: "Enter command..." })] }), hints.length > 0 && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "cyan", children: ["Agents: ", hints.join(', ')] }) }))] })] }));
};
