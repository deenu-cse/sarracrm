"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, ShieldOff, Clock3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'sarra_account_restriction';

function getRemaining(until) {
  const end = new Date(until).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, totalMs: diff };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function AccountRestrictedPage() {
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace('/login');
        return;
      }
      setInfo(JSON.parse(raw));
    } catch {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!info?.suspendedUntil || info.accountStatus !== 'SUSPENDED') return undefined;

    const tick = () => setRemaining(getRemaining(info.suspendedUntil));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [info]);

  const status = info?.accountStatus || info?.code?.replace('ACCOUNT_', '') || '';

  const title = useMemo(() => {
    if (status === 'SUSPENDED' || info?.code === 'ACCOUNT_SUSPENDED') return 'Account Suspended';
    return 'Account Deactivated';
  }, [status, info]);

  if (!info) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const isSuspended = status === 'SUSPENDED' || info.code === 'ACCOUNT_SUSPENDED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className={`px-8 py-10 text-white ${isSuspended ? 'bg-gradient-to-r from-amber-600 to-orange-700' : 'bg-gradient-to-r from-slate-700 to-slate-900'}`}>
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
            {isSuspended ? <Ban className="w-7 h-7" /> : <ShieldOff className="w-7 h-7" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-white/85 text-sm">
            {info.name ? `Hello ${info.name}, ` : ''}
            your SARRA CRM access is currently restricted.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {isSuspended ? (
            <>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-3">
                  <Clock3 className="w-4 h-4" /> Suspension timeline
                </div>
                {info.suspendedUntil && remaining && (
                  <>
                    <p className="text-slate-700 text-sm mb-4">
                      Access resumes on{' '}
                      <strong>{new Date(info.suspendedUntil).toLocaleString()}</strong>
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Days', value: remaining.days },
                        { label: 'Hours', value: pad(remaining.hours) },
                        { label: 'Mins', value: pad(remaining.minutes) },
                        { label: 'Secs', value: pad(remaining.seconds) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white border border-amber-100 py-3 text-center">
                          <p className="text-2xl font-black text-slate-900 tabular-nums">{item.value}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    {remaining.totalMs === 0 && (
                      <p className="mt-4 text-sm text-emerald-700 font-medium">
                        Suspension period ended. Try logging in again.
                      </p>
                    )}
                  </>
                )}
              </div>
              {info.suspensionReason && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Reason</p>
                  <p className="text-sm text-slate-700">{info.suspensionReason}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-slate-700 text-sm leading-relaxed">
                  This account has been deactivated by a Super Admin. You cannot access the CRM until
                  your access is restored.
                </p>
                {info.deactivatedAt && (
                  <p className="text-xs text-slate-500 mt-3">
                    Deactivated on {new Date(info.deactivatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {info.deactivationReason && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Reason</p>
                  <p className="text-sm text-slate-700">{info.deactivationReason}</p>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-slate-500">
            Need help? Contact your Super Admin or support at support@sarra.uk.gov.in
          </p>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              router.replace('/login');
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
