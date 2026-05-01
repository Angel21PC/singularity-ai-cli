import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { execa } from 'execa';

export const StatusPanel: React.FC = () => {
  const [claudeStatus, setClaudeStatus] = useState<string>('Loading limits...');
  const [codexStatus, setCodexStatus] = useState<string>('Loading limits...');

  useEffect(() => {
    const fetchLimits = async () => {
      // Intento de extraer el consumo / tokens
      try {
        const { stdout } = await execa('claude', ['-p', 'Can you tell me your current account token usage or quota status? Output ONLY the answer as raw text.'], { reject: false, input: '' });
        setClaudeStatus(stdout.substring(0, 80).trim() || "No explicit quota endpoint non-interactively.");
      } catch(e) {
        setClaudeStatus("Offline");
      }

      try {
        const { stdout } = await execa('codex', ['features'], { reject: false });
        // Codex output for features includes some basic connectivity/feature validation
        setCodexStatus(stdout ? "Online (Quota visible in Web UI)" : "Offline");
      } catch(e) {
        setCodexStatus("Offline");
      }
    };
    fetchLimits();
  }, []);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold color="cyan">📊 Provider Quotas & Status</Text>
      <Box marginTop={1} flexDirection="column">
         <Text>Claude CLI: <Text color="green">{claudeStatus}</Text></Text>
         <Text>Codex CLI: <Text color="green">{codexStatus}</Text></Text>
      </Box>
    </Box>
  );
};
