import { JobStatus, statusLabel, statusTone } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

export function StatusBadge({ status }: { status: JobStatus }) {
  const getIcon = () => {
    switch (status) {
      case 'started':
        return <span className="status-dot-pulse" style={{ width: 6, height: 6 }} />;
      case 'completed':
        return <CheckCircle2 size={11} style={{ strokeWidth: 3 }} />;
      case 'failed':
        return <AlertTriangle size={11} style={{ strokeWidth: 3 }} />;
      case 'queued':
        return <Clock size={11} style={{ strokeWidth: 2.5 }} />;
    }
  };

  return (
    <span className={`status-badge ${statusTone[status]}`}>
      {getIcon()}
      {statusLabel[status]}
    </span>
  );
}

