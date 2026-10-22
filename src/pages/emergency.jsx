import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { PhoneCall, MapPin, Clock, AlertTriangle, ShieldAlert, WifiOff, CheckCircle2, Siren } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function EmergencyPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [dataSource, setDataSource] = useState('loading'); // 'network' | 'cache' | 'seed'
  const [lastSyncedTime, setLastSyncedTime] = useState(null);

  useEffect(() => {
    // Try live API first
    fetch('/api/phc')
      .then(res => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then(data => {
        setFacilities(data.facilities || []);
        setDataSource('network');
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(now);
        try {
          localStorage.setItem('samalocane_phc_cache', JSON.stringify(data.facilities || []));
          localStorage.setItem('samalocane_phc_time', now);
        } catch (_) {}
      })
      .catch(err => {
        console.warn('Network unreachable, attempting offline seed fallback', err);
        // Try localStorage cache first
        try {
          const cached = localStorage.getItem('samalocane_phc_cache');
          const cachedTime = localStorage.getItem('samalocane_phc_time');
          if (cached) {
            setFacilities(JSON.parse(cached));
            setDataSource('cache');
            setLastSyncedTime(cachedTime || 'Previously cached');
            setLoading(false);
            return;
          }
        } catch (_) {}

        // Fallback to static pre-cached seed file
        fetch('/data/phc-seed.json')
          .then(res => res.json())
          .then(data => {
            setFacilities(data.facilities || []);
            setDataSource('seed');
            setLastSyncedTime('Bundled Offline Database');
          })
          .catch(() => {
            setDataSource('offline_empty');
          })
          .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, []);

  const talukas = Array.from(new Set(facilities.map(f => f.taluka))).filter(Boolean).sort();

  const filtered = facilities.filter(f => {
    return !selectedTaluka || f.taluka.toLowerCase() === selectedTaluka.toLowerCase();
  });

  return (
    <>
      <Head>
        <title>Emergency Directory — Samālōcane</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Emergency Header Banner */}
        <div className="bg-emergency-700 text-white rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Siren className="w-8 h-8 animate-pulse text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Emergency Health Centre Directory
                </h1>
                <p className="text-sm sm:text-base text-emergency-100 font-medium">
                  Verified Primary Health Centres (PHC), CHCs, & Taluka Hospitals — Instant Public Access
                </p>
              </div>
            </div>

            {/* Offline Cache Status Badge */}
            <div className="self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide border ${
                dataSource === 'network' 
                  ? 'bg-emerald-950/40 text-emerald-200 border-emerald-400' 
                  : 'bg-amber-950/50 text-amber-200 border-amber-300'
              }`}>
                {dataSource === 'network' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Directory</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-300" />
                    <span>Offline Cache ({lastSyncedTime || 'Local'})</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Quick SOS National Hotlines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <a
              href="tel:108"
              className="bg-white text-emergency-800 hover:bg-emergency-50 min-h-[50px] px-4 py-3 rounded-xl font-black text-base flex items-center justify-between shadow-xs transition"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emergency-600 animate-bounce" />
                <span>Ambulance: 108</span>
              </span>
              <span className="text-xs bg-emergency-100 px-2.5 py-0.5 rounded uppercase font-bold text-emergency-900">Instant Dial</span>
            </a>

            <a
              href="tel:112"
              className="bg-slate-900 text-white hover:bg-slate-800 min-h-[50px] px-4 py-3 rounded-xl font-black text-base flex items-center justify-between shadow-xs transition border border-white/20"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-400" />
                <span>National Emergency: 112</span>
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded uppercase font-bold text-white">Instant Dial</span>
            </a>

            <a
              href="tel:104"
              className="bg-emergency-900 text-white hover:bg-emergency-950 min-h-[50px] px-4 py-3 rounded-xl font-black text-base flex items-center justify-between shadow-xs transition border border-emergency-500/50"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emergency-300" />
                <span>Health Helpline: 104</span>
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded uppercase font-bold text-white">Instant Dial</span>
            </a>
          </div>

          {/* Honest Operational Disclaimer */}
          <div className="bg-black/25 rounded-xl p-4 text-sm sm:text-base text-white/95 flex items-start gap-3 border border-white/15">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Cellular Voice Calling Notice:</span> Tapping any telephone button initiates a direct phone call using your mobile cellular carrier (GSM/CDMA). Internet connectivity is <span className="underline font-bold">NOT required</span> to place cellular phone calls. Samālōcane does not dispatch ambulances automatically. In acute emergencies, dial <strong className="underline">108</strong> or <strong className="underline">112</strong> immediately.
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <select
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Talukas ({talukas.length})</option>
              {talukas.map(t => (
                <option key={t} value={t}>{t} Taluka</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-600 font-semibold">
            Showing <strong>{filtered.length}</strong> emergency facilities
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-semibold animate-pulse text-base">
            Loading verified health facilities...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-dashed p-6 text-slate-500 text-sm">
            No health facilities found matching your selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(fac => (
              <Card key={fac.id || fac.name} className="flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">
                      {fac.name}
                    </h3>
                    <Badge variant={fac.facility_type === 'Taluka Hospital' ? 'danger' : 'success'}>
                      {fac.facility_type}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{fac.address || `${fac.taluka} Taluka, ${fac.district} District`}</span>
                  </p>

                  <p className="text-sm text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Hours: <strong>{fac.operating_hours || '24/7 Casualty'}</strong></span>
                  </p>

                  {fac.ambulance_available && (
                    <Badge variant="brand">✓ Ambulance Station Attached</Badge>
                  )}
                </div>

                {/* Native Dial CTA */}
                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={`tel:${fac.emergency_phone}`}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emergency-600 hover:bg-emergency-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Facility: {fac.emergency_phone}</span>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
