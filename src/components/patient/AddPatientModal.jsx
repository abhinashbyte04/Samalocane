import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, Check, User, Heart, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { DEMO_TALUKAS, DEMO_STATUSES } from '../../data/dummyPatients';

export function AddPatientModal({ isOpen, onClose, onSave }) {
  const initialFormState = {
    name: '',
    age: '',
    gender: 'Female',
    primaryCondition: '',
    allergies: '',
    taluka: 'Kumta',
    phoneNumber: '',
    consultationStatus: 'New / Consultation Pending',
    lastConsultationDoctor: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    // 1. Full name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    // 2. Age validation
    const ageNum = Number(formData.age);
    if (!formData.age || formData.age.toString().trim() === '') {
      newErrors.age = 'Age is required';
    } else if (isNaN(ageNum) || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      newErrors.age = 'Please enter a valid age between 1 and 120';
    }

    // 3. Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // 4. Primary Condition validation
    if (!formData.primaryCondition.trim()) {
      newErrors.primaryCondition = 'Primary medical concern or condition is required';
    } else if (formData.primaryCondition.trim().length < 3) {
      newErrors.primaryCondition = 'Please provide at least 3 characters describing condition';
    }

    // 5. Allergies validation
    if (!formData.allergies.trim()) {
      newErrors.allergies = 'Known allergies are required. Enter "None reported" if no known allergies';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time error clearance
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Prepare clean record
    const allergiesText = formData.allergies.trim();
    const cleanAllergyLower = allergiesText.toLowerCase();
    const hasAllergies = !['none', 'none reported', 'nil', 'no', 'no allergies', 'n/a'].includes(cleanAllergyLower);

    const newPatient = {
      id: `pat-demo-${Date.now()}`,
      name: formData.name.trim(),
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      primaryCondition: formData.primaryCondition.trim(),
      allergies: allergiesText,
      hasAllergies,
      taluka: formData.taluka || 'Kumta',
      district: 'Karnataka',
      phoneNumber: formData.phoneNumber.trim() || 'Not provided',
      consultationStatus: formData.consultationStatus || 'New / Consultation Pending',
      lastConsultationDoctor: formData.lastConsultationDoctor.trim() || 'Pending Clinical Assignment',
      lastConsultationDate: new Date().toISOString(),
      notes: formData.notes.trim() || 'Newly registered demo patient record.',
      isDemoData: true,
      createdAt: new Date().toISOString()
    };

    onSave(newPatient);
    handleCancel();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-patient-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50/50 via-white to-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full uppercase tracking-wider">
                Demo Data
              </span>
              <span className="text-xs text-slate-500 font-medium">Prototype Form</span>
            </div>
            <h2 id="add-patient-title" className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <User className="w-6 h-6 text-teal-600" />
              <span>Add New Patient Record</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Register a fictional demo patient for clinical telemedicine consultation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Row 1: Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="patient-name" className="block text-sm sm:text-base font-semibold text-slate-800">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="patient-name"
              name="name"
              type="text"
              placeholder="e.g., Smt. Jayashree Hegde"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                errors.name 
                  ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30' 
                  : 'border-slate-300 focus:ring-teal-600 focus:border-teal-600'
              }`}
            />
            {errors.name && (
              <p className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Row 2: Age & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label htmlFor="patient-age" className="block text-sm sm:text-base font-semibold text-slate-800">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                id="patient-age"
                name="age"
                type="number"
                min="1"
                max="120"
                placeholder="e.g., 45"
                value={formData.age}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                  errors.age 
                    ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-300 focus:ring-teal-600 focus:border-teal-600'
                }`}
              />
              {errors.age && (
                <p className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.age}</span>
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label htmlFor="patient-gender" className="block text-sm sm:text-base font-semibold text-slate-800">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                id="patient-gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                  errors.gender 
                    ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30' 
                    : 'border-slate-300 focus:ring-teal-600 focus:border-teal-600'
                }`}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Transgender">Transgender</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.gender}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Primary Medical Condition */}
          <div className="space-y-1.5">
            <label htmlFor="patient-condition" className="block text-sm sm:text-base font-semibold text-slate-800">
              Primary Disease / Current Medical Concern <span className="text-rose-500">*</span>
            </label>
            <input
              id="patient-condition"
              name="primaryCondition"
              type="text"
              placeholder="e.g., Acute Pharyngitis with High Fever and Sore Throat"
              value={formData.primaryCondition}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                errors.primaryCondition 
                  ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30' 
                  : 'border-slate-300 focus:ring-teal-600 focus:border-teal-600'
              }`}
            />
            {errors.primaryCondition && (
              <p className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.primaryCondition}</span>
              </p>
            )}
          </div>

          {/* Row 4: Known Allergies */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="patient-allergies" className="block text-sm sm:text-base font-semibold text-slate-800">
                Known Drug / Food Allergies <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, allergies: 'None reported' }))}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
              >
                Set "None reported"
              </button>
            </div>
            <input
              id="patient-allergies"
              name="allergies"
              type="text"
              placeholder="e.g., Penicillin (Rash) OR None reported"
              value={formData.allergies}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border bg-white focus:outline-none focus:ring-2 transition ${
                errors.allergies 
                  ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30' 
                  : 'border-slate-300 focus:ring-teal-600 focus:border-teal-600'
              }`}
            />
            {errors.allergies && (
              <p className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.allergies}</span>
              </p>
            )}
            <p className="text-xs text-slate-500">
              Important for patient safety. Enter drug allergies (e.g. Penicillin, Sulfa) or "None reported".
            </p>
          </div>

          {/* Additional Medical Information Accordion / Section */}
          <div className="pt-2 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Additional Details (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Taluka */}
              <div className="space-y-1.5">
                <label htmlFor="patient-taluka" className="block text-sm font-semibold text-slate-800">
                  Taluka / Region
                </label>
                <select
                  id="patient-taluka"
                  name="taluka"
                  value={formData.taluka}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  {DEMO_TALUKAS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label htmlFor="patient-phone" className="block text-sm font-semibold text-slate-800">
                  Contact Number
                </label>
                <input
                  id="patient-phone"
                  name="phoneNumber"
                  type="text"
                  placeholder="e.g., +91 98450 12345"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Consultation Status */}
              <div className="space-y-1.5">
                <label htmlFor="patient-status" className="block text-sm font-semibold text-slate-800">
                  Initial Consultation Status
                </label>
                <select
                  id="patient-status"
                  name="consultationStatus"
                  value={formData.consultationStatus}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  {DEMO_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Doctor Consulted */}
              <div className="space-y-1.5">
                <label htmlFor="patient-doctor" className="block text-sm font-semibold text-slate-800">
                  Attending Physician (if any)
                </label>
                <input
                  id="patient-doctor"
                  name="lastConsultationDoctor"
                  type="text"
                  placeholder="e.g., Dr. Ramesh Rao (General Medicine)"
                  value={formData.lastConsultationDoctor}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="space-y-1.5">
              <label htmlFor="patient-notes" className="block text-sm font-semibold text-slate-800">
                Clinical Notes / Remarks
              </label>
              <textarea
                id="patient-notes"
                name="notes"
                rows={2}
                placeholder="e.g., Symptoms aggravated during evening hours. Advised routine observation."
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="w-full sm:w-auto px-5 py-2.5 text-sm sm:text-base font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto px-6 py-2.5 text-sm sm:text-base font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Save Patient</span>
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}

