import fs from 'fs';
import path from 'path';
import type { ValidationReport } from '../app/api/reports/route';

const REPORTS_DIR = path.join(process.cwd(), '.reports');

export async function getReport(id: string): Promise<ValidationReport | null> {
  try {
    const filePath = path.join(REPORTS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ValidationReport;
  } catch {
    return null;
  }
}
