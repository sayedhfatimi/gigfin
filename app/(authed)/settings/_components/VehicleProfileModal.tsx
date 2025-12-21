'use client';

import { type FormEvent, useEffect, useState } from 'react';

import type { VehicleProfile, VehicleType } from '@/lib/vehicle';
import { vehicleTypeOptions } from '@/lib/vehicle';

type VehicleProfileModalProps = {
  isOpen: boolean;
  profile: VehicleProfile | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    label: string;
    vehicleType: VehicleType;
    isDefault: boolean;
  }) => void;
};

const VehicleProfileModal = ({
  isOpen,
  profile,
  isSubmitting,
  onClose,
  onSubmit,
}: VehicleProfileModalProps) => {
  const [label, setLabel] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    vehicleTypeOptions[0].value,
  );
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFormError('');
    if (profile) {
      setLabel(profile.label);
      setVehicleType(profile.vehicleType);
      setIsDefault(profile.isDefault);
      return;
    }
    setLabel('');
    setVehicleType(vehicleTypeOptions[0].value);
    setIsDefault(false);
  }, [isOpen, profile]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      setFormError('Give the vehicle a short descriptive name.');
      return;
    }
    setFormError('');
    onSubmit({
      label: trimmed,
      vehicleType,
      isDefault,
    });
  };

  const title = profile ? 'Edit vehicle profile' : 'Add vehicle profile';

  if (!isOpen) {
    return null;
  }

  return (
    <div className='modal modal-open'>
      <div className='modal-box'>
        <h3 className='text-lg font-semibold text-base-content'>{title}</h3>
        <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor='vehicle-label'
              className='text-xs font-semibold uppercase text-base-content/50'
            >
              Profile label
            </label>
            <label className='input w-full mt-1'>
              <input
                id='vehicle-label'
                type='text'
                placeholder='e.g. Ford Fiesta'
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <label className='select w-full'>
            <span className='label'>Vehicle type</span>
            <select
              value={vehicleType}
              onChange={(event) =>
                setVehicleType(event.target.value as VehicleType)
              }
              disabled={isSubmitting}
            >
              {vehicleTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              disabled={isSubmitting}
              className='checkbox checkbox-sm'
            />
            <span className='text-sm text-base-content/70'>
              Make default profile
            </span>
          </label>
          {formError && <p className='text-sm text-error'>{formError}</p>}
          <div className='modal-action'>
            <button
              type='button'
              className='btn btn-ghost'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {profile ? 'Save changes' : 'Create profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleProfileModal;
