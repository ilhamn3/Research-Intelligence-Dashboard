import { factorDirection, SkoreFactor, statusLabel, JobStatus } from './types';
export function formatFactor(factor: SkoreFactor) { return { ...factor, label: `${factor.impact > 0 ? '+' : ''}${factor.impact}`, direction: factorDirection(factor.impact) }; }
export function formatJobStatus(status: JobStatus) { return statusLabel[status]; }
