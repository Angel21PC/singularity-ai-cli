import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ClaudeCliWrapper } from '../cli-wrappers/claude.js';
export const ChatAgent = ({ agent, onBack }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    useInput((input, key) => {
        if (key.escape) {
            onBack();
        }
    });
    const handleSubmit = async () => {
        if (!prompt.trim() || loading)
            return;
        setLoading(true);
        setResponse('');
        try {
            const fullPrompt = `You are ${agent.name}. Your role is: ${agent.role}. Respond to this: ${prompt}`;
            const wrapper = new ClaudeCliWrapper();
            const result = await wrapper.ask(fullPrompt);
            setResponse(result);
            setPrompt('');
        }
        catch (err) {
            setResponse(`Error: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { bold: true, color: "cyan", children: ["\uD83D\uDCAC Chat with ", agent.name] }), agent.model && _jsxs(Text, { color: "yellow", children: [" (Model: ", agent.model, ")"] })] }), response && (_jsxs(Box, { flexDirection: "column", marginBottom: 1, borderStyle: "single", padding: 1, children: [_jsx(Text, { color: "green", children: "Response:" }), _jsx(Text, { children: response })] })), loading ? (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "yellow", children: "Agent is thinking..." }) })) : (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "green", children: "Prompt: " }), _jsx(TextInput, { value: prompt, onChange: setPrompt, onSubmit: handleSubmit, placeholder: "Type your message..." })] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press ESC to go back" }) })] }));
};
