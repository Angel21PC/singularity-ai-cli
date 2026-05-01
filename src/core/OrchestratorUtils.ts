export function parseDelegation(output: string): { subAgentName: string; subTask: string } | null {
  const match = output.match(/>>>DELEGATE @([A-Za-z0-9_]+)<<<[\s\S]*?\n([\s\S]*)/);
  if (match) {
    return {
      subAgentName: match[1],
      subTask: match[2].trim()
    };
  }
  return null;
}
