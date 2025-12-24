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
      <div className='modal-box'>
        <h3 className='text-lg font-semibold text-base-content'>{title}</h3>
        <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor='charging-vendor-label'
              className='text-xs font-semibold uppercase text-base-content/50'
            >
              Vendor label
            </label>
            <label className='input w-full mt-1'>
              <input
                id='charging-vendor-label'
                type='text'
                placeholder='e.g. Lidl'
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <label className='input validator w-full'>
            <span className='label text-xs uppercase text-base-content/50'>
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
              {vendor ? 'Save changes' : 'Create vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChargingVendorModal;
