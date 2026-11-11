import React from 'react';
import { HardDrive, RefreshCw, Trash2, CheckCircle2, Download, Loader2 } from 'lucide-react';
import type { StorageStatusResponse } from '../../types';
import type { AuditLogRecord } from '../../utils/api';

export interface LegacyAuditLog {
  id: string;
  appId: string;
  studentName: string;
  evaluatorName: string;
  role: string;
  action: string;
  timestamp: string;
  remarks?: string;
  ipHash: string;
}

interface AdminAuditTabProps {
  storageTelemetry: StorageStatusResponse | null;
  isLoadingStorage: boolean;
  isPurgingOrphans: boolean;
  storageFeedback: string | null;
  liveAuditLogs: AuditLogRecord[];
  systemAuditLogs: LegacyAuditLog[];
  onLoadStorageTelemetry: () => void;
  onPurgeOrphans: () => void;
  onDismissFeedback: () => void;
  onDownloadSnapshot: () => void;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({
  storageTelemetry,
  isLoadingStorage,
  isPurgingOrphans,
  storageFeedback,
  liveAuditLogs,
  systemAuditLogs,
  onLoadStorageTelemetry,
  onPurgeOrphans,
  onDismissFeedback,
  onDownloadSnapshot,
}) => {
  return (
    <div className="space-y-6">
      {/* SYSTEM HEALTH & STORAGE GOVERNANCE CARD (FEATURE 5) */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-maroon-subtle text-maroon-primary border border-red-200 flex-shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                System Health &amp; Storage Governance
              </h3>
              <p className="text-xs text-neutral-500">
                Real-time disk space usage, verified upload count, MongoDB Atlas connectivity status, and automated orphaned file purging.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadStorageTelemetry}
              disabled={isLoadingStorage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${isLoadingStorage ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>

            <button
              type="button"
              onClick={onPurgeOrphans}
              disabled={isPurgingOrphans || (storageTelemetry?.orphanedFiles.count ?? 0) === 0}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                (storageTelemetry?.orphanedFiles.count ?? 0) > 0 && !isPurgingOrphans
                  ? 'bg-maroon-primary hover:bg-maroon-hover text-white cursor-pointer'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
              title={
                (storageTelemetry?.orphanedFiles.count ?? 0) > 0
                  ? 'Purge unreferenced files from /uploads'
                  : 'Zero orphaned files detected'
              }
            >
              {isPurgingOrphans ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Purging Files...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Orphaned Files</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {storageFeedback && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{storageFeedback}</span>
            </div>
            <button
              type="button"
              onClick={onDismissFeedback}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Upload Storage Capacity */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
              <span>Server Disk Space Used</span>
              <span className="font-mono font-bold text-neutral-800">
                {storageTelemetry?.storage.totalMB ?? 0.0} MB / {storageTelemetry?.storage.maxStorageMB ?? 500} MB
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-maroon-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, storageTelemetry?.storage.usedPercent ?? 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>{storageTelemetry?.storage.usedPercent ?? 0}% capacity utilized</span>
              <span>{storageTelemetry?.storage.fileCount ?? 0} files stored</span>
            </div>
          </div>

          {/* Metric 2: MongoDB Atlas Health */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="text-xs text-neutral-500 font-medium">Database Node Connection</div>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  storageTelemetry?.isMongoConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <strong className="text-xs font-bold text-neutral-900">
                {storageTelemetry?.mongoStatus || 'MongoDB Atlas Driver'}
              </strong>
            </div>
            <p className="text-[11px] text-neutral-500">
              Dual-mode resilience active. Automatic background sync and recovery.
            </p>
          </div>

          {/* Metric 3: Orphaned Files */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="text-xs text-neutral-500 font-medium">Orphaned Files on Disk</div>
            <div className="flex items-center justify-between pt-1">
              <strong
                className={`text-base font-mono font-bold ${
                  (storageTelemetry?.orphanedFiles.count ?? 0) > 0
                    ? 'text-red-700'
                    : 'text-emerald-700'
                }`}
              >
                {storageTelemetry?.orphanedFiles.count ?? 0} Unreferenced
              </strong>
              <span className="text-xs font-mono text-neutral-500">
                {storageTelemetry?.orphanedFiles.orphanedMB ?? 0.0} MB reclaimable
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              {(storageTelemetry?.orphanedFiles.count ?? 0) > 0
                ? `${storageTelemetry?.orphanedFiles.count} unreferenced file(s) ready to be purged from disk.`
                : 'Storage fully synchronized with active database records.'}
            </p>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Institutional System Audit Log
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Official immutable audit trail retained in compliance with Republic Act No. 10173 (Data Privacy Act of 2012).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onDownloadSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
              title="Download complete disaster recovery snapshot (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Term Archival Snapshot (JSON)</span>
            </button>
            <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-md border border-neutral-200">
              {liveAuditLogs.length > 0 ? liveAuditLogs.length : systemAuditLogs.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC+8)</th>
                <th className="py-3 px-4">User / Evaluator</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Application Reference</th>
                <th className="py-3 px-4 font-mono">Trace ID / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {liveAuditLogs.length > 0 ? (
                liveAuditLogs.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-neutral-50 font-sans">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-600">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-900">{log.userName || log.userEmail}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{log.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-900">{log.action}</span>
                      {log.details && (
                        <p className="text-[11px] text-neutral-500 max-w-xs truncate">&quot;{log.details}&quot;</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-800">
                      {log.applicationNo || 'System / Batch'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-neutral-400">
                      {log.ipAddress || log.sessionHash || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : systemAuditLogs.length > 0 ? (
                systemAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 font-sans">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-600">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-neutral-900">
                      {log.evaluatorName}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {log.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-900">{log.action}</span>
                      {log.remarks && (
                        <p className="text-[11px] text-neutral-500 max-w-xs truncate">&quot;{log.remarks}&quot;</p>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-neutral-800">
                      {log.appId} ({log.studentName})
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-neutral-400">
                      {log.ipHash}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <p>No audit events logged yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-500 flex justify-between items-center">
          <span>National Privacy Commission (NPC) Certified Logging Architecture</span>
          <span>Tamper-Resilient Storage</span>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditTab;
