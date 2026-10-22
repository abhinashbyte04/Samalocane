import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Stethoscope, ShieldCheck, Search, Filter, PhoneCall, 
  Video, MessageSquare, ArrowRight, Star, Clock, 
  Building2, Languages, CheckCircle2, X, Award, 
  RotateCcw, ShieldAlert, Calendar, ChevronRight, User
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DEMO_SPECIALTIES, DEMO_LANGUAGES } from '../../data/dummyDoctors';

export function DoctorDirectory({
  doctors = [],
  onDoctorSelect,
  onConnectDoctor
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('experience');

  const filteredDoctors = useMemo(() => {
    let list = [...doctors];

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) =>
        d.full_name?.toLowerCase().includes(q) ||
        d.specialty_name?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        d.qualification?.toLowerCase().includes(q) ||
        d.hospital_affiliation?.toLowerCase().includes(q) ||
        (d.languages_spoken && d.languages_spoken.some(lang => lang.toLowerCase().includes(q)))
      );
    }

    // 2. Specialty Filter
    if (specialtyFilter !== 'all') {
      list = list.filter((d) => d.specialty_name === specialtyFilter);
    }

    // 3. Experience Filter
    if (experienceFilter === '10plus') {
      list = list.filter((d) => d.experience_years >= 10);
    } else if (experienceFilter === '5to10') {
      list = list.filter((d) => d.experience_years >= 5 && d.experience_years < 10);
    } else if (experienceFilter === 'under5') {
      list = list.filter((d) => d.experience_years < 5);
    }

    // 4. Language Filter
    if (languageFilter !== 'all') {
      list = list.filter((d) => d.languages_spoken && d.languages_spoken.includes(languageFilter));
    }

    // 5. Verification Status Filter
    if (verificationFilter !== 'all') {
      list = list.filter((d) => d.verification_status === verificationFilter);
    }

    // 6. Mode Filter
    if (modeFilter !== 'all') {
      list = list.filter((d) => d.consultation_modes && d.consultation_modes.includes(modeFilter));
    }

    // 7. Available Only Toggle
    if (availableOnly) {
      list = list.filter((d) => d.is_available);
    }

    // 8. Sorting
    if (sortBy === 'experience') {
      list.sort((a, b) => b.experience_years - a.experience_years);
    } else if (sortBy === 'fee_asc') {
      list.sort((a, b) => a.consultation_fee - b.consultation_fee);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    return list;
  }, [
    doctors, 
    searchQuery, 
    specialtyFilter, 
    experienceFilter, 
    languageFilter, 
    verificationFilter, 
    modeFilter, 
    availableOnly, 
    sortBy
  ]);

  const hasActiveFilters = searchQuery !== '' || 
    specialtyFilter !== 'all' || 
    experienceFilter !== 'all' || 
    languageFilter !== 'all' || 
    verificationFilter !== 'all' || 
    modeFilter !== 'all' || 
    availableOnly || 
    sortBy !== 'experience';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSpecialtyFilter('all');
    setExperienceFilter('all');
    setLanguageFilter('all');
    setVerificationFilter('all');
    setModeFilter('all');
    setAvailableOnly(false);
    setSortBy('experience');
  };

  const avatarColorMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    zinc: 'bg-zinc-50 text-zinc-700 border-zinc-200'
  };

  return (
    <div className="space-y-6">
      
      {/* Directory Header Box */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                Demo Directory
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                State Medical Council Accreditation Panel
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-teal-600" />
              <span>Medical Practitioner Directory</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Find verified medical specialists for audio and video tele-consultations across coastal and hill talukas. Review qualifications, schedules, and verified credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="brand">{filteredDoctors.length} Practitioners</Badge>
          </div>
        </div>

        {/* Prototype Disclaimer Notice */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 leading-relaxed">
          <strong>Demo Data Notice:</strong> All doctor profiles, council registration numbers, and certificates displayed below are fictional demonstration records. Certificates are sample documents for prototype evaluation.
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          
          {/* Row 1: Search & Specialty & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by doctor, specialty, language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Specialty Filter */}
            <div className="md:col-span-3">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by specialization"
              >
                <option value="all">All Specializations ({DEMO_SPECIALTIES.length})</option>
                {DEMO_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Experience Filter */}
            <div className="md:col-span-2">
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by experience"
              >
                <option value="all">All Experience</option>
                <option value="10plus">10+ Years Exp</option>
                <option value="5to10">5 – 10 Years</option>
                <option value="under5">Under 5 Years</option>
              </select>
            </div>

            {/* Language Filter */}
            <div className="md:col-span-3">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by language spoken"
              >
                <option value="all">All Languages</option>
                {DEMO_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Row 2: Secondary Filters (Verification, Consultation Mode, Availability, Sort) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
              
              {/* Verification Status Filter */}
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
                aria-label="Filter by verification status"
              >
                <option value="all">All Verification Statuses</option>
                <option value="Verified">Verified Active</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Not Verified">Not Verified</option>
              </select>

              {/* Consultation Mode Filter */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
                aria-label="Filter by consultation mode"
              >
                <option value="all">All Modes (Video/Audio/Text)</option>
                <option value="video">Video Call</option>
                <option value="audio">Audio Call (Low Bandwidth)</option>
                <option value="text">Text Chat</option>
              </select>

              {/* Online Now Checkbox */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                />
                <span>Online Now</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1 ml-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1 px-2.5 font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
                aria-label="Sort doctors"
              >
                <option value="experience">Clinical Experience</option>
                <option value="fee_asc">Consultation Fee (Low to High)</option>
                <option value="rating">Patient Rating</option>
                <option value="name">Doctor Name (A–Z)</option>
              </select>
            </div>

          </div>

        </div>

      </div>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              No Medical Practitioners Found
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              No doctor profiles matched your search or filter criteria. Try resetting filters to explore all available specialties.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm font-semibold"
          >
            Reset Search Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDoctors.map((doc) => {
            const avatarClasses = avatarColorMap[doc.avatar_color] || avatarColorMap.teal;
            const isVerified = doc.verification_status === 'Verified';
            const isPending = doc.verification_status === 'Pending Verification';
            const isNotVerified = doc.verification_status === 'Not Verified';

            return (
              <div 
                key={doc.id || doc.doctor_user_id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-card transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  
                  {/* Top: Avatar, Name, Title, and Availability */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-lg shrink-0 shadow-xs ${avatarClasses}`}>
                        {doc.avatar_initials || 'DR'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onDoctorSelect ? onDoctorSelect(doc) : router.push(`/doctors/${doc.doctor_user_id || doc.id}`)}
                            className="font-extrabold text-slate-900 text-lg hover:text-teal-700 transition text-left"
                          >
                            {doc.full_name}
                          </button>
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                            Demo
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-teal-700">
                          {doc.specialty_name}
                        </p>

                        <p className="text-xs text-slate-600 font-medium">
                          {doc.qualification}
                        </p>
                      </div>
                    </div>

                    <Badge variant={doc.is_available ? 'success' : 'neutral'}>
                      ● {doc.is_available ? 'Online' : 'Offline'}
                    </Badge>
                  </div>

                  {/* Verification Status Badge (Requirement C) */}
                  <div className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
                    isVerified 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                      : isPending 
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}>
                    <span className="font-semibold flex items-center gap-1.5">
                      {isVerified ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isPending ? (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-mono">{doc.council_registration_number}</span>
                    </span>

                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      isVerified 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isPending 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {doc.verification_status}
                    </span>
                  </div>

                  {/* Clinical Details: Experience, Fee, Rating, Languages */}
                  <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span><strong>{doc.experience_years} years</strong> clinical exp</span>
                      <span>•</span>
                      <span>Fee: <strong>{doc.consultation_fee === 0 ? 'Free (Subsidized)' : `₹${doc.consultation_fee}`}</strong></span>
                      {doc.rating && (
                        <>
                          <span>•</span>
                          <span className="flex items-center text-amber-600 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                            {doc.rating} ({doc.review_count || 100})
                          </span>
                        </>
                      )}
                    </div>

                    <p className="flex items-center gap-1 text-slate-700">
                      <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Languages: <strong>{doc.languages_spoken ? doc.languages_spoken.join(', ') : 'Kannada, English'}</strong></span>
                    </p>

                    {doc.hospital_affiliation && (
                      <p className="flex items-center gap-1 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.hospital_affiliation}</span>
                      </p>
                    )}
                  </div>

                  {/* Supported Consultation Modes (Video, Audio, Text) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Consultation Modes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.consultation_modes && doc.consultation_modes.map((mode, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold capitalize"
                        >
                          {mode === 'video' && <Video className="w-3 h-3 text-teal-600" />}
                          {mode === 'audio' && <PhoneCall className="w-3 h-3 text-teal-600" />}
                          {mode === 'text' && <MessageSquare className="w-3 h-3 text-teal-600" />}
                          <span>{mode} Consultation</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Consultation Schedule Preview */}
                  {doc.schedule && doc.schedule.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                      <span className="font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        <span>Schedule: {doc.schedule[0].days}</span>
                      </span>
                      <p className="text-slate-500 font-mono">
                        {doc.schedule[0].timing} • {doc.schedule[0].type}
                      </p>
                    </div>
                  )}

                </div>

                {/* Card Actions: View Profile & Connect with Doctor */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDoctorSelect ? onDoctorSelect(doc) : router.push(`/doctors/${doc.doctor_user_id || doc.id}`)}
                    className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold hover:border-teal-400 hover:text-teal-800"
                  >
                    <span>View Profile</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!doc.is_available && isNotVerified}
                    onClick={() => {
                      if (onConnectDoctor) {
                        onConnectDoctor(doc);
                      } else {
                        const targetId = doc.doctor_user_id || doc.id;
                        router.push(`/consultation/request/${targetId}`);
                      }
                    }}
                    className="px-4 py-1.5 text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Connect with Doctor</span>
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

