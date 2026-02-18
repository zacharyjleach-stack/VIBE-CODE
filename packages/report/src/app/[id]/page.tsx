import { ReportView } from '../../components/ReportView';
import { getReport } from '../../lib/reports';
import { notFound } from 'next/navigation';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const report = await getReport(params.id);
  if (!report) return { title: 'Report Not Found' };
  return {
    title: `Aegis Verified - ${report.projectName}`,
    description: `Build verified by Aegis AI on ${new Date(report.createdAt).toLocaleDateString()}`,
    openGraph: {
      title: `⬡ Aegis Verified: ${report.projectName}`,
      description: `Vibe Score: ${report.vibeScore}/100 | ${report.changes.length} changes verified`,
      images: report.screenshotUrl ? [report.screenshotUrl] : [],
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const report = await getReport(params.id);
  if (!report) notFound();
  return <ReportView report={report} />;
}
