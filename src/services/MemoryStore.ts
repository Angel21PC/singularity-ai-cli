import fs from 'fs';
import path from 'path';

export class MemoryStore {
  static getWorkspaceDir(projectId: string): string {
    const dir = path.resolve(process.cwd(), `workspaces/${projectId}/memory_dumps`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static getHandoffContext(projectId: string): string {
    const dumpPath = path.join(this.getWorkspaceDir(projectId), 'latest_handoff.txt');
    if (fs.existsSync(dumpPath)) {
      const content = fs.readFileSync(dumpPath, 'utf8');
      return `\nPrevious Handoff Context:\n${content.substring(0, 16000)}\n`;
    }
    return '';
  }

  static saveTaskResult(projectId: string, taskId: string, result: string): void {
    const dir = this.getWorkspaceDir(projectId);
    fs.writeFileSync(path.join(dir, `${taskId}.txt`), result, 'utf8');
  }

  static updateHandoff(projectId: string, subAgentName: string, subTask: string, result: string): void {
    const dir = this.getWorkspaceDir(projectId);
    fs.writeFileSync(path.join(dir, 'latest_handoff.txt'), result, 'utf8');
    fs.appendFileSync(path.join(dir, 'history.txt'), `\n\n[Delegated to @${subAgentName}]: ${subTask}\n[Result from @${subAgentName}]:\n${result}\n`, 'utf8');
  }
}
