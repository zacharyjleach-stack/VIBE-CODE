export class Reviewer {
  async audit(result: string): Promise<string> {
    console.log(`[Reviewer] Auditing: ${result}`);
    return `Approved: ${result}`;
  }
}
