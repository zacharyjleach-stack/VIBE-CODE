import dotenv from "dotenv";
dotenv.config();

const required = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GITHUB_TOKEN"] as const;

export const Config = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  get isOnline(): boolean {
    return required.some((k) => Config[k].length > 0);
  },
};

for (const key of required) {
  if (!Config[key]) {
    console.warn(`⚠ Missing env: ${key} — running in offline mode for this service`);
  }
}
