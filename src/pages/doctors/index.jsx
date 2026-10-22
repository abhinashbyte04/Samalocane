import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Stethoscope, ShieldCheck } from 'lucide-react';
import { INITIAL_DEMO_DOCTORS } from '../../data/dummyDoctors';
import { DoctorDirectory } from '../../components/doctor/DoctorDirectory';
import { DoctorDetailModal } from '../../components/doctor/DoctorDetailModal';

export default function DoctorDirectoryPage() {
  const router = useRouter();
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleConnectDoctor = (doc) => {
    const targetId = doc.doctor_user_id || doc.id;
    router.push(`/consultation/request/${targetId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top back navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Karnataka Medical Council Panel</span>
        </div>
      </div>

      {/* Main Doctor Directory Component */}
      <DoctorDirectory
        doctors={INITIAL_DEMO_DOCTORS}
        onDoctorSelect={(doc) => setSelectedDoctor(doc)}
        onConnectDoctor={handleConnectDoctor}
      />

      {/* Doctor Detail & Credentials Modal */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />

    </div>
  );
}
