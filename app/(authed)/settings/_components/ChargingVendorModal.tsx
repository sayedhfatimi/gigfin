'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { ChargingVendor } from '@/lib/charging-vendor';
import type { UnitRateUnit } from '@/lib/expenses';

const RATE_UNITS: UnitRateUnit[] = ['kwh'];

type ChargingVendorModalProps = {
  isOpen: boolean;
  vendor: ChargingVendor | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    label: string;
    unitRateMinor: number;
    unitRateUnit: UnitRateUnit;
  }) => void;
};

const ChargingVendorModal = ({
  isOpen,
  vendor,
  isSubmitting,
  onClose,
  onSubmit,
}: ChargingVendorModalProps) => {
  const [label, setLabel] = useState('');
  const [rate, setRate] = useState('');
  const [unitRateUnit, setUnitRateUnit] = useState<UnitRateUnit>('kwh');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFormError('');
    if (vendor) {
      setLabel(vendor.label);
      setRate(vendor.unitRateMinor.toString());
      setUnitRateUnit(vendor.unitRateUnit);
      return;
    }
    setLabel('');
    setRate('');
    setUnitRateUnit('kwh');
  }, [isOpen, vendor]);

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
    const rateValue = Number.parseFloat(rate);
    if (!trimmed) {
      setFormError('Give the vendor a descriptive label.');
      return;
    }
    if (Number.isNaN(rateValue) || rateValue <= 0) {
      setFormError('Enter a rate in pence that is greater than zero.');
      return;
    }
    setFormError('');
    onSubmit({
      label: trimmed,
      unitRateMinor: Math.round(rateValue),
      unitRateUnit,
    });
  };

  if (!isOpen) {
    return null;
  }

  const title = vendor ? 'Edit charging vendor' : 'Add charging vendor';

  return (
    <div className='modal modal-open'>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via escape key effect */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop is a clickable overlay */}
      <div
        className='modal-backdrop bg-base-300/60 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='modal-box w-full h-full sm:w-auto sm:h-auto sm:max-w-md relative overflow-visible'>
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
          <span className='text-xl text-info'>
            <i className='fa-solid fa-bolt' />
          </span>
          <h3 className='text-lg font-semibold text-base-content'>{title}</h3>
        </div>

        <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
          <label className='input w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-tag text-base-content/40 mr-1' />
              Vendor label
            </span>
            <input
              id='charging-vendor-label'
              type='text'
              placeholder='e.g. Lidl'
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label className='input validator w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-sterling-sign text-base-content/40 mr-1' />
              Rate (p per unit)
            </span>
            <input
              type='number'
              step='1'
              min='0'
              placeholder='e.g. 62'
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label className='select w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
              <i className='fa-solid fa-plug text-base-content/40 mr-1' />
              Unit
            </span>
            <select
              value={unitRateUnit}
              onChange={(event) =>
                setUnitRateUnit(event.target.value as UnitRateUnit)
              }
              disabled={isSubmitting}
            >
              {RATE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === 'kwh' ? 'kWh' : unit}
                </option>
              ))}
            </select>
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
              className='btn btn-info gap-2'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className='loading loading-spinner loading-sm' />
              ) : (
                <i className={`fa-solid ${vendor ? 'fa-check' : 'fa-plus'}`} />
              )}
              {vendor ? 'Save changes' : 'Create vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChargingVendorModal;
