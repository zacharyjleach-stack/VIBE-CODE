import { Config } from "../config/env";

export class GitHubService {
  private token: string;

  constructor() {
    this.token = Config.GITHUB_TOKEN;
  }

  async createPullRequest(title: string, branch: string): Promise<string> {
    if (!this.token) {
      throw new Error("[GitHubService] GITHUB_TOKEN not set — cannot create PR");
    }
    console.log(`[GitHubService] Creating PR: "${title}" from branch ${branch}`);
    return `PR created: ${title}`;
  }
}
