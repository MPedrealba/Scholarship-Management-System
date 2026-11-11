import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { formatPHP } from '../../utils/exportUtils';

export interface QuotaCardData {
  id: string;
  grantType: string;
  title: string;
  agency: string;
  stipendPerSem: number;
  maxSlots: number;
  filled: number;
  remaining: number;
  pct: number;
  isLocked: boolean;
}

interface AdminQuotasTabProps {
  quotaCards: QuotaCardData[];
  onAdjustQuotaSlots: (grantType: string, newTotal: number) => void;
  onToggleQuotaLock: (grantType: string, lockStatus: boolean) => void;
}

export const AdminQuotasTab: React.FC<AdminQuotasTabProps> = ({
  quotaCards,
  onAdjustQuotaSlots,
  onToggleQuotaLock,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900">Grant Quota Allocations</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Real-time slot utilization and enrollment intake capacity mandated by CHED UniFAST, DOST-SEI, and institutional funding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quotaCards.map((card) => (
          <div
            key={card.id}
            className={`bg-white rounded-xl shadow-xs border p-5 space-y-4 transition-all ${
              card.isLocked
                ? 'border-red-300 ring-1 ring-red-200'
                : 'border-neutral-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  {card.agency}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-0.5">{card.title}</h4>
                <p className="text-xs font-semibold text-maroon-primary mt-0.5">
                  {formatPHP(card.stipendPerSem)} / Sem
                </p>
              </div>

              {card.isLocked ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              ) : card.pct >= 90 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Near Capacity
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Open
                </span>
              )}
            </div>

            {/* Progress Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-600">Slots Allocated:</span>
                <span className="font-mono text-neutral-900">
                  {card.filled} of {card.maxSlots} ({card.pct}%)
                </span>
              </div>

              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    card.isLocked
                      ? 'bg-red-600'
                      : card.pct >= 90
                      ? 'bg-amber-500'
                      : 'bg-maroon-primary'
                  }`}
                  style={{ width: `${card.pct}%` }}
                />
              </div>
            </div>

            {/* Slot Details Box */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Remaining Slots:</span>
                <span className={`font-mono font-semibold text-sm ${card.remaining === 0 ? 'text-red-600' : 'text-neutral-800'}`}>
                  {card.remaining} slots
                </span>
              </div>

              {card.isLocked && (
                <span className="text-[11px] font-medium text-red-600">
                  Intake capacity reached
                </span>
              )}
            </div>

            {/* Administrative Quota Control Override */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase">Total:</span>
                <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => onAdjustQuotaSlots(card.grantType, Math.max(card.filled, card.maxSlots - 5))}
                    className="px-2 py-0.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Decrease 5 slots"
                  >
                    -5
                  </button>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-neutral-50 text-neutral-900 border-x border-neutral-200">
                    {card.maxSlots}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustQuotaSlots(card.grantType, card.maxSlots + 5)}
                    className="px-2 py-0.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Increase 5 slots"
                  >
                    +5
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleQuotaLock(card.grantType, !card.isLocked)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                  card.isLocked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                }`}
                title={card.isLocked ? 'Manually unlock intake' : 'Manually lock intake'}
              >
                {card.isLocked ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    <span>Unlock</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-red-600" />
                    <span>Lock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuotasTab;
