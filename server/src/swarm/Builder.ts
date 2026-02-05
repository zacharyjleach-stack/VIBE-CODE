export class Builder {
  async writeCode(plan: string): Promise<string> {
    console.log(`[Builder] Writing code for: ${plan}`);
    return `Code generated for: ${plan}`;
  }

  async fixError(error: string): Promise<string> {
    console.log(`[Builder] Fixing: ${error}`);
    return `Fix applied for: ${error}`;
  }
}
