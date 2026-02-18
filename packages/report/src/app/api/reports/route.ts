import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), '.reports');

export interface ValidationReport {
  id: string;
  projectName: string;
  createdAt: string;
  vibeScore: number;
  passed: boolean;
  objective: string;
  changes: Array<{ file: string; agent: string; summary: string }>;
  diff?: string;
  screenshotUrl?: string;
  testResults?: Array<{ name: string; passed: boolean; message?: string }>;
  aegisVersion: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Partial<ValidationReport>;

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const report: ValidationReport = {
    id: uuidv4(),
    projectName: body.projectName || 'Unknown Project',
    createdAt: new Date().toISOString(),
    vibeScore: body.vibeScore || 0,
    passed: body.passed || false,
    objective: body.objective || '',
    changes: body.changes || [],
    diff: body.diff,
    screenshotUrl: body.screenshotUrl,
    testResults: body.testResults,
    aegisVersion: '1.0.0',
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, `${report.id}.json`),
    JSON.stringify(report, null, 2)
  );

  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3838'}/${report.id}`;

  return NextResponse.json({ id: report.id, url: reportUrl });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const filePath = path.join(REPORTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const report = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return NextResponse.json(report);
}
