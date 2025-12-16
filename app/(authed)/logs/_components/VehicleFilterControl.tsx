import type { VehicleProfile } from '@/lib/vehicle';

type VehicleFilterControlProps = {
  vehicleProfiles: VehicleProfile[];
  selectedVehicleFilter: string | null;
  onChange: (value: string | null) => void;
  onClear: () => void;
};

export default function VehicleFilterControl({
  vehicleProfiles,
  selectedVehicleFilter,
  onChange,
  onClear,
}: VehicleFilterControlProps) {
  return (
    <div className='flex flex-row items-center gap-2'>
      <label className='select select-sm'>
        <select
          value={selectedVehicleFilter ?? ''}
          onChange={(event) =>
            onChange(event.target.value ? event.target.value : null)
          }
        >
          <option value=''>All vehicles</option>
          {vehicleProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type='button'
        className='btn btn-xs btn-square btn-error text-xs hidden md:inline-flex'
        onClick={onClear}
        disabled={!selectedVehicleFilter}
        aria-label='Clear vehicle filter'
      >
        <i className='fa-solid fa-xmark' aria-hidden='true' />
      </button>
    </div>
  );
}
