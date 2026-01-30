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

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via escape key effect */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop is a clickable overlay */}
      <div
        className='modal-backdrop bg-base-300/60 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='modal-box relative overflow-visible'>
        {/* Close button */}
        <button
          type='button'
          className='btn btn-sm btn-circle btn-ghost absolute -right-2 -top-2 bg-base-100 shadow-md hover:bg-base-200'
          onClick={onClose}
          aria-label='Close modal'
        >
          <i className='fa-solid fa-xmark' />
        </button>

        {/* Header */}
        <div className='flex items-center gap-3 pb-4 border-b border-base-content/10'>
          <span className='text-xl text-primary'>
            <i className='fa-solid fa-car' />
          </span>
          <h3 className='text-lg font-semibold text-base-content'>{title}</h3>
        </div>

        <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
          <label className='input w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-tag text-base-content/40 mr-1' />
              Profile label
            </span>
            <input
              id='vehicle-label'
              type='text'
              placeholder='e.g. Ford Fiesta'
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label className='select w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-car-side text-base-content/40 mr-1' />
              Vehicle type
            </span>
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
          <label className='flex items-center gap-2 px-1'>
            <input
              type='checkbox'
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              disabled={isSubmitting}
              className='checkbox checkbox-sm checkbox-primary'
            />
            <span className='text-sm text-base-content/70'>
              <i className='fa-solid fa-star text-warning mr-1 text-xs' />
              Make default profile
            </span>
          </label>
          {formError && (
            <p className='text-sm text-error'>
              <i className='fa-solid fa-circle-exclamation mr-1' />
              {formError}
            </p>
          )}
          <div className='modal-action pt-4 border-t border-base-content/10'>
            <button
              type='button'
              className='btn btn-ghost gap-2'
              onClick={onClose}
              disabled={isSubmitting}
            >
              <i className='fa-solid fa-xmark' />
              Cancel
            </button>
            <button
              type='submit'
              className='btn btn-primary gap-2'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className='loading loading-spinner loading-sm' />
              ) : (
                <i className={`fa-solid ${profile ? 'fa-check' : 'fa-plus'}`} />
              )}
              {profile ? 'Save changes' : 'Create profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleProfileModal;
