import React, { useState, useEffect } from 'react';
import { 
  CloudOff, CloudCheck, RefreshCw, Trash2, AlertTriangle, 
  CheckCircle2, Clock, X, Send, Stethoscope, User 
} from 'lucide-react';
import { 
  getOutboxForUser, 
  syncOutboxForUser, 
  deleteOutboxItem, 
  clearSyncedItems, 
  updateOutboxItem 
} from '../../lib/indexedDbOutbox';

export function OfflineOutboxDrawer({ isOpen, onClose, currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadItems = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getOutboxForUser(currentUser.id);
      setItems(data);
    } catch (e) {
      console.error('[Outbox Load Error]', e);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadItems();
    }
  }, [isOpen, currentUser]);

  const handleManualSync = async () => {
    if (!currentUser?.id) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncOutboxForUser(currentUser);
      setSyncMessage(
        `Sync complete: ${result.synced} succeeded, ${result.failed} failed, ${result.remainingPending} pending.`
      );
      await loadItems();
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this queued item?')) return;
    await deleteOutboxItem(id, currentUser.id);
    await loadItems();
  };

  const handleRetry = async (item) => {
    // Reset to pending so sync will evaluate it
    await updateOutboxItem(item.id, { status: 'pending', attempts: 0, error: null });
    await loadItems();
    handleManualSync();
  };

  const handleClearSynced = async () => {
    await clearSyncedItems(currentUser.id);
    await loadItems();
  };

  if (!isOpen) return null;

  const pendingCount = items.filter(i => i.status === 'pending' || i.status === 'syncing').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CloudOff className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                Offline Outbox & Sync Manager
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Locally saved requests awaiting network restore
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Controls Banner */}
        <div className="p-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between gap-2">
          <div className="text-sm text-teal-900 font-bold">
            {pendingCount === 0 ? 'Outbox is up to date' : `${pendingCount} item(s) awaiting sync`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncing || pendingCount === 0}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
            <button
              onClick={handleClearSynced}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold"
              title="Clear synced records"
            >
              Clear Synced
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="px-4 py-2 bg-slate-800 text-white text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>{syncMessage}</span>
            <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Outbox Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">No operations in local queue</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Consultation requests and profile changes made while offline are saved here and automatically synchronized once cellular signal returns.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-sm shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                    {item.operationType === 'CREATE_CONSULTATION' ? (
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                    ) : (
                      <User className="w-4 h-4 text-teal-600" />
                    )}
                    {item.operationType.replace('_', ' ')}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    item.status === 'synced' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'syncing' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                    item.status === 'failed' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    ● {item.status}
                  </span>
                </div>

                {/* Payload details preview */}
                <div className="text-xs sm:text-sm text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  {item.operationType === 'CREATE_CONSULTATION' && (
                    <>
                      <p><strong>Chief Complaint:</strong> {item.payload?.chiefComplaint}</p>
                      <p><strong>Mode:</strong> {item.payload?.requestedMode || 'audio'}</p>
                    </>
                  )}
                  {item.operationType === 'UPDATE_HEALTH_PROFILE' && (
                    <>
                      <p><strong>Taluka:</strong> {item.payload?.taluka}, {item.payload?.district}</p>
                      <p><strong>Allergies:</strong> {item.payload?.allergies || 'None'}</p>
                    </>
                  )}
                  <p className="text-xs text-slate-400 pt-0.5">
                    Queued: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {item.attempts > 0 && ` • Attempts: ${item.attempts}/${item.maxAttempts}`}
                  </p>
                </div>

                {/* Error if failed */}
                {item.error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-semibold flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{item.error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs sm:text-sm">
                  {item.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(item)}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry Now
                    </button>
                  )}
                  {item.status === 'pending' && (
                    <span className="text-slate-500 text-xs">Will sync automatically</span>
                  )}
                  {item.status === 'synced' && (
                    <span className="text-emerald-700 text-xs font-bold">✓ Confirmed by server</span>
                  )}
                  
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-400 hover:text-rose-600 ml-auto p-1 rounded"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer Guidance */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs sm:text-sm text-slate-600 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Sync runs automatically when your device connects to mobile data or Wi-Fi.</span>
        </div>

      </div>
    </div>
  );
}

