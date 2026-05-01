export abstract class ProviderWrapper {
  /**
   * Asks the provider a question or runs a command
   */
  abstract ask(prompt: string): Promise<string>;

  /**
   * Pauses the provider execution (e.g. if rate limited)
   */
  abstract pause(): void;

  /**
   * Resumes the provider execution
   */
  abstract resume(): void;
}
