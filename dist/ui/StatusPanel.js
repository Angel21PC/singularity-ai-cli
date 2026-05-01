import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { execa } from 'execa';
export const StatusPanel = () => {
    const [claudeStatus, setClaudeStatus] = useState('Loading...');
    const [codexStatus, setCodexStatus] = useState('Loading...');
    useEffect(() => {
        let isMounted = true;
        const fetchLimits = async () => {
            try {
                // Ejecutamos 'claude --help' como ping ligero en vez de un prompt fantasma para ver conectividad
                const { stdout } = await execa('claude', ['--help'], { reject: false });
                if (isMounted) {
                    if (stdout.includes('Not logged in')) {
                        setClaudeStatus("Offline (Requires login)");
                    }
                    else {
                        setClaudeStatus("Online - CLI active");
                    }
                }
            }
            catch (e) {
                if (isMounted)
                    setClaudeStatus("Offline (Error running CLI)");
            }
            try {
                const { stdout } = await execa('codex', ['--help'], { reject: false });
                if (isMounted) {
                    if (stdout.includes('login')) {
                        setCodexStatus("Online - CLI active");
                    }
                    else {
                        setCodexStatus("Offline (Requires login)");
                    }
                }
            }
            catch (e) {
                if (isMounted)
                    setCodexStatus("Offline (Error running CLI)");
            }
        };
        fetchLimits();
        return () => { isMounted = false; };
    }, []);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, borderStyle: "round", borderColor: "blue", children: [_jsx(Text, { bold: true, color: "cyan", children: "\uD83D\uDCCA Provider Connectivity Status" }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: ["Claude CLI: ", _jsx(Text, { color: claudeStatus.includes('Online') ? 'green' : 'red', children: claudeStatus })] }), _jsxs(Text, { children: ["Codex CLI: ", _jsx(Text, { color: codexStatus.includes('Online') ? 'green' : 'red', children: codexStatus })] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", italic: true, children: "Note: Official CLIs do not provide a direct quota endpoint." }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: "gray", children: "Press Escape to return to menu" }) })] }));
};
