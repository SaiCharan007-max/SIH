import React from 'react';
import { Modal } from '../common/Modal';
import { formatTime } from '../../utils/timeUtils';
import { Train, Info, AlertTriangle } from 'lucide-react';

export const TrainDetailModal = ({ train, isOpen, onClose }) => {
  if (!train) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Train Movement: ${train.train_number || 'TRN'}`}
      subtitle={`Section: ${train.section_code || train.section_id}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Safety Disclaimer Banner */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Train timetables are operational constraints imported from Control Office Application (COA). The Block Planner works around train movements and does not issue train authorities.
          </p>
        </div>

        <div className="border border-slate-800 rounded-lg p-3.5 space-y-2 bg-slate-950/40 font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Train Number:</span>
            <span className="font-bold text-slate-100">{train.train_number}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Type / Category:</span>
            <span className="text-slate-200">{train.train_type || 'PASSENGER'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Section Entry:</span>
            <span className="text-amber-300 font-semibold">{formatTime(train.entry_time)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Section Exit:</span>
            <span className="text-amber-300 font-semibold">{formatTime(train.exit_time)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Movement Status:</span>
            <span className="text-emerald-400 font-semibold">{train.status || 'SCHEDULED'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
