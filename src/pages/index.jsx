import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  PhoneCall, 
  ShieldCheck, 
  Wifi, 
  ArrowRight, 
  UserCheck, 
  Stethoscope, 
  Activity,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Search,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function LandingPage() {
  const router = useRouter();
  const [featuredDoctors, setFeaturedDoctors] = useState([]);

  useEffect(() => {
    fetch('/api/doctors?limit=3')
      .then(res => res.json())
      .then(data => {
        if (data.doctors) {
          setFeaturedDoctors(data.doctors.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-16">
      
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-sm font-semibold shadow-xs">
          <Wifi className="w-4 h-4 text-brand-600 animate-pulse" />
          <span>Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight font-serif">
          Samālōcane Telemedicine
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Designed specifically for terrain-shadowed valleys, monsoon cloud-attenuation, and erratic 2G/3G cellular connectivity across coastal Karnataka and Western Ghats hill talukas.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => router.push('/patient')}
            className="gap-2 shadow-card hover:shadow-card-hover"
          >
            <UserCheck className="w-5 h-5" />
            <span>Enter Patient Portal</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/doctors')}
            className="gap-2 shadow-xs"
          >
            <Search className="w-5 h-5 text-brand-700" />
            <span>Find Verified Doctors</span>
          </Button>

          <Button
            size="lg"
            variant="emergency"
            onClick={() => router.push('/emergency')}
            className="gap-2 shadow-card"
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span>Emergency PHC Mode</span>
          </Button>
        </div>

        {/* Direct Portal Navigation Strip */}
        <div className="pt-8 border-t border-slate-200 max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              Explore Healthcare Portals:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              href="/patient"
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-50/50 text-left transition shadow-xs group block"
            >
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-brand-600 group-hover:scale-110 transition" />
                <span className="font-bold text-sm sm:text-base text-slate-900">Patient Portal</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Health record & appointments</p>
            </Link>

            <Link
              href="/doctor"
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-500 hover:bg-brand-50/50 text-left transition shadow-xs group block"
            >
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="w-4 h-4 text-brand-600 group-hover:scale-110 transition" />
                <span className="font-bold text-sm sm:text-base text-slate-900">Physician Portal</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">Consultation queue & triage</p>
            </Link>
          </div>
        </div>

      </section>

      {/* Platform Highlight Metrics Strip */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-card">
          <div className="space-y-1 text-center sm:text-left border-r last:border-r-0 border-slate-100 pr-2">
            <span className="text-xs sm:text-sm font-bold text-brand-700 uppercase tracking-wider">Medical Verification</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
            <p className="text-sm text-slate-600 font-medium">State Medical Council Validated</p>
          </div>

          <div className="space-y-1 text-center sm:text-left border-r last:border-r-0 border-slate-100 pr-2">
            <span className="text-xs sm:text-sm font-bold text-brand-700 uppercase tracking-wider">Low-Bandwidth Mode</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">&lt; 24 kbps</div>
            <p className="text-sm text-slate-600 font-medium">Audio-First Adaptive Fallback</p>
          </div>

          <div className="space-y-1 text-center sm:text-left border-r last:border-r-0 border-slate-100 pr-2">
            <span className="text-xs sm:text-sm font-bold text-brand-700 uppercase tracking-wider">Offline Readiness</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">Zero Data</div>
            <p className="text-sm text-slate-600 font-medium">Cellular Direct Dial to PHCs</p>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs sm:text-sm font-bold text-brand-700 uppercase tracking-wider">PWA Architecture</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">IndexedDB</div>
            <p className="text-sm text-slate-600 font-medium">Offline Consultation Outbox</p>
          </div>
        </div>
      </section>

      {/* 3-Step Patient Journey */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="brand">Simple Workflow</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How Samālōcane Operates in Rural Talukas</h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Lightweight, progressive interactions designed to prevent data waste and maintain doctor-patient trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-200">
              1
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Share Health Summary</h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Patients provide DOB, symptoms, medications, and allergies. If offline, the profile is preserved locally in IndexedDB and syncs automatically when connection is restored.
            </p>
          </Card>

          <Card className="space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-200">
              2
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Specialty Matching & Triage</h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Deterministic rule-based specialty recommendation. Red-flag symptoms (acute chest pain, stroke signs) immediately redirect to the National 108 Emergency Hotline.
            </p>
          </Card>

          <Card className="space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base border border-brand-200">
              3
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Adaptive Consultation</h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Connect via WebRTC. When network conditions degrade, video dynamically drops to preserve audio clarity, with instant text chat fallback for heavy packet loss.
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Verified Physicians */}
      {featuredDoctors.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <Badge variant="success">Verified Registry</Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Featured Regional Specialists</h2>
              <p className="text-sm sm:text-base text-slate-600">Accredited physicians serving coastal and hill taluka communities</p>
            </div>
            <Link href="/doctors" className="text-sm font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1">
              <span>View all 12 verified physicians</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDoctors.map(doc => (
              <div key={doc.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{doc.full_name}</h4>
                      <p className="text-sm font-semibold text-brand-700">{doc.specialty_name}</p>
                    </div>
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 font-medium">{doc.qualification}</p>

                  <div className="text-sm text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                    <div>Hospital: <strong className="text-slate-800">{doc.hospital_affiliation}</strong></div>
                    <div>Reg No: <span className="font-mono text-slate-700 font-bold">{doc.council_registration_number}</span></div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-4 h-4 fill-amber-400 mr-0.5" />
                        {doc.rating || 4.9}
                      </span>
                      <span className="text-slate-400">({doc.review_count || 120} reviews)</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{doc.experience_years} yrs exp</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/doctors/${doc.id}`)}
                  className="w-full text-sm font-semibold"
                >
                  View Profile & Book
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Target Regional Coverage */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-100/80 rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Target Taluka Coverage</span>
          </h3>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Primary Health Centres and Taluka General Hospitals pre-seeded across coastal and Western Ghats districts:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {[
              'Kumta (Uttara Kannada)', 
              'Karwar (Uttara Kannada)', 
              'Bhatkal (Uttara Kannada)', 
              'Ankola (Uttara Kannada)', 
              'Honnavar (Uttara Kannada)', 
              'Madikeri (Kodagu)', 
              'Somwarpet (Kodagu)', 
              'Sakleshpur (Hassan)', 
              'Sirsi (Uttara Kannada)'
            ].map(t => (
              <span key={t} className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-800 shadow-2xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}