import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { execa } from 'execa';

export const StatusPanel: React.FC = () => {
  const [claudeStatus, setClaudeStatus] = useState<string>('Loading...');
  const [codexStatus, setCodexStatus] = useState<string>('Loading...');

  useEffect(() => {
    let isMounted = true;
    const fetchLimits = async () => {
      try {
        // Ejecutamos 'claude --help' como ping ligero en vez de un prompt fantasma para ver conectividad
        const { stdout } = await execa('claude', ['--help'], { reject: false });
        if (isMounted) {
          if (stdout.includes('Not logged in')) {
            setClaudeStatus("Offline (Requires login)");
          } else {
            setClaudeStatus("Online - CLI active");
          }
        }
      } catch(e) {
        if (isMounted) setClaudeStatus("Offline (Error running CLI)");
      }

      try {
        const { stdout } = await execa('codex', ['--help'], { reject: false });
        if (isMounted) {
            if (stdout.includes('login')) {
                 setCodexStatus("Online - CLI active");
            } else {
                 setCodexStatus("Offline (Requires login)");
            }
        }
      } catch(e) {
        if (isMounted) setCodexStatus("Offline (Error running CLI)");
      }
    };
    fetchLimits();
    return () => { isMounted = false; }
  }, []);

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold color="cyan">📊 Provider Connectivity Status</Text>
      <Box marginTop={1} flexDirection="column">
         <Text>Claude CLI: <Text color={claudeStatus.includes('Online') ? 'green' : 'red'}>{claudeStatus}</Text></Text>
         <Text>Codex CLI: <Text color={codexStatus.includes('Online') ? 'green' : 'red'}>{codexStatus}</Text></Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray" italic>Note: Official CLIs do not provide a direct quota endpoint.</Text>
      </Box>
      <Box marginTop={1}><Text color="gray">Press Escape to return to menu</Text></Box>
    </Box>
  );
};
