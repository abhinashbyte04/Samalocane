import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, Search, Filter, RotateCcw, AlertTriangle, 
  ShieldCheck, Eye, MapPin, Stethoscope, Clock, CheckCircle2, 
  X, ChevronDown, UserX, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function PatientDirectory({
  patients = [],
  onAddClick,
  onPatientSelect,
  onFindDoctors,
  onResetDefaults,
  notification = null,
  onClearNotification
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allergyFilter, setAllergyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Filter and Sort logic
  const filteredPatients = useMemo(() => {
    let list = [...patients];

    // 1. Text Search across name, condition, allergies, taluka, doctor
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.name?.toLowerCase().includes(q) ||
        p.primaryCondition?.toLowerCase().includes(q) ||
        p.allergies?.toLowerCase().includes(q) ||
        p.taluka?.toLowerCase().includes(q) ||
        p.lastConsultationDoctor?.toLowerCase().includes(q)
      );
    }

    // 2. Gender filter
    if (genderFilter !== 'all') {
      list = list.filter((p) => p.gender === genderFilter);
    }

    // 3. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.consultationStatus === statusFilter);
    }

    // 4. Allergy filter
    if (allergyFilter === 'allergic') {
      list = list.filter((p) => p.hasAllergies);
    } else if (allergyFilter === 'no_allergies') {
      list = list.filter((p) => !p.hasAllergies);
    }

    // 5. Sorting
    if (sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'age_asc') {
      list.sort((a, b) => a.age - b.age);
    } else if (sortBy === 'age_desc') {
      list.sort((a, b) => b.age - a.age);
    }

    return list;
  }, [patients, searchQuery, genderFilter, statusFilter, allergyFilter, sortBy]);

  const hasActiveFilters = searchQuery !== '' || genderFilter !== 'all' || statusFilter !== 'all' || allergyFilter !== 'all' || sortBy !== 'default';

  const clearAllFilters = () => {
    setSearchQuery('');
    setGenderFilter('all');
    setStatusFilter('all');
    setAllergyFilter('all');
    setSortBy('default');
  };

  return (
    <div className="space-y-6">
      
      {/* Success Notification Banner when patient added */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm sm:text-base font-bold">{notification}</p>
          </div>
          {onClearNotification && (
            <button
              onClick={onClearNotification}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Section Header with Title and Add Patient Button */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                Demo Data
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Fictional Clinical Sample Records
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-teal-600" />
              <span>Patient Directory</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Organized records of registered demo patients who have previously consulted telemedicine physicians across coastal and hill talukas.
            </p>
          </div>

          {/* Action Button: Add Patient */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              onClick={onAddClick}
              className="w-full sm:w-auto px-4.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Patient</span>
            </Button>
          </div>
        </div>

        {/* Prototype Architecture Disclaimer */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 flex items-start gap-2 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <strong>Prototype Data Notice:</strong> All patient records in this directory are fictional demo data created for interface testing. Records are managed in client storage and are not yet stored in a secure production medical database.
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, condition, allergy, or taluka..."
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

            {/* Filter by Gender */}
            <div className="md:col-span-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by gender"
              >
                <option value="all">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Filter by Consultation Status */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by consultation status"
              >
                <option value="all">All Consultation Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Waiting Room">Waiting Room</option>
                <option value="In Progress">In Progress</option>
                <option value="New / Consultation Pending">New / Pending</option>
                <option value="Follow-up Scheduled">Follow-up Scheduled</option>
              </select>
            </div>

            {/* Filter by Allergies */}
            <div className="md:col-span-2">
              <select
                value={allergyFilter}
                onChange={(e) => setAllergyFilter(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                aria-label="Filter by allergy status"
              >
                <option value="all">All Allergies</option>
                <option value="allergic">Known Allergies</option>
                <option value="no_allergies">No Allergies</option>
              </select>
            </div>

          </div>

          {/* Results Counter & Active Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Showing {filteredPatients.length} of {patients.length} demo records
              </span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                  Filtered
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort by selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-1 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
                  aria-label="Sort patients"
                >
                  <option value="default">Default Order</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="age_asc">Age (Youngest)</option>
                  <option value="age_desc">Age (Oldest)</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              )}

              {onResetDefaults && (
                <button
                  type="button"
                  onClick={onResetDefaults}
                  title="Reset to original 10 demo patients"
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 ml-3 border-l border-slate-200 pl-3"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Patient Directory List / Table */}
      {filteredPatients.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <UserX className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              No Patients Found
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? `No patient records matched "${searchQuery}". Try adjusting your keywords or clearing filters.`
                : 'No patients found matching the selected filter criteria.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-semibold"
              >
                Clear All Filters
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onAddClick}
              className="px-4 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Patient</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* DESKTOP TABLE VIEW (Visible on md and up) */}
          {/* ========================================================================= */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-600">
                    <th scope="col" className="py-3.5 px-4">Patient Name</th>
                    <th scope="col" className="py-3.5 px-3">Age / Gender</th>
                    <th scope="col" className="py-3.5 px-4">Primary Condition</th>
                    <th scope="col" className="py-3.5 px-4">Known Allergies</th>
                    <th scope="col" className="py-3.5 px-3">Consultation Status</th>
                    <th scope="col" className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
                  {filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                      onClick={() => onPatientSelect(patient)}
                    >
                      {/* Patient Name & Demo Tag */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 group-hover:text-teal-700 transition">
                              {patient.name}
                            </span>
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                              Demo
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{patient.taluka}, Karnataka</span>
                          </div>
                        </div>
                      </td>

                      {/* Age & Gender */}
                      <td className="py-4 px-3 text-slate-700 whitespace-nowrap">
                        <span className="font-semibold">{patient.age} yrs</span> • {patient.gender}
                      </td>

                      {/* Primary Medical Condition */}
                      <td className="py-4 px-4 text-slate-800 font-medium max-w-xs">
                        <div className="line-clamp-2">
                          {patient.primaryCondition}
                        </div>
                      </td>

                      {/* Known Allergies */}
                      <td className="py-4 px-4 max-w-xs">
                        {patient.hasAllergies ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[180px]" title={patient.allergies}>
                              {patient.allergies}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>None reported</span>
                          </div>
                        )}
                      </td>

                      {/* Consultation Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant={
                            patient.consultationStatus?.toLowerCase().includes('completed') ? 'success' :
                            patient.consultationStatus?.toLowerCase().includes('waiting') ? 'warning' :
                            patient.consultationStatus?.toLowerCase().includes('progress') ? 'brand' : 'neutral'
                          }>
                            {patient.consultationStatus}
                          </Badge>
                          {patient.lastConsultationDoctor && (
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">
                              {patient.lastConsultationDoctor}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {onFindDoctors && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => onFindDoctors(patient)}
                              className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-xs"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Find Suitable Doctors</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPatientSelect(patient)}
                            className="px-3 py-1.5 text-xs sm:text-sm font-semibold hover:border-teal-400 hover:text-teal-800"
                          >
                            <Eye className="w-4 h-4 mr-1 text-teal-600" />
                            <span>View Details</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE CARDS VIEW (Visible below md) */}
          {/* ========================================================================= */}
          <div className="block md:hidden space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => onPatientSelect(patient)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-teal-400 transition cursor-pointer space-y-3"
              >
                {/* Header: Name, Demo Badge, Age/Gender */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {patient.name}
                      </h3>
                      <span className="px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded uppercase">
                        Demo
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-600" />
                      {patient.taluka}, Karnataka
                    </p>
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                    {patient.age} yrs • {patient.gender}
                  </span>
                </div>

                {/* Primary Condition */}
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Primary Condition:
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {patient.primaryCondition}
                  </p>
                </div>

                {/* Allergies Chip */}
                <div>
                  {patient.hasAllergies ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Allergy: {patient.allergies}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>No known drug allergies</span>
                    </div>
                  )}
                </div>

                {/* Consultation Status & Action */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <Badge variant={
                      patient.consultationStatus?.toLowerCase().includes('completed') ? 'success' :
                      patient.consultationStatus?.toLowerCase().includes('waiting') ? 'warning' :
                      patient.consultationStatus?.toLowerCase().includes('progress') ? 'brand' : 'neutral'
                    }>
                      {patient.consultationStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {onFindDoctors && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onFindDoctors(patient)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Find Doctors</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onPatientSelect(patient)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold text-teal-800 border-teal-200 hover:bg-teal-50"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      <span>View</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

