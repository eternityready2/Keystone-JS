// admin/components/SyncSettingsField.tsx
import React from 'react';
import { FieldContainer, FieldLabel, Select } from '@keystone-ui/fields';
import { FieldControllerConfig, FieldProps } from '@keystone-6/core/types';

const frequencies = [
  { label: 'Off', value: 'off' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

const hours = Array.from({ length: 12 }, (_, i) => ({ label: `${i+1}`, value: `${i+1}` }));
const periods = [{ label: 'AM', value: 'am' }, { label: 'PM', value: 'pm' }];

const weeklyOptions = [
  { label: 'Sunday', value: 'sun' },
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
];

const monthlyOptions = Array.from({ length: 31 }, (_, i) => ({ label: `${i+1}`, value: `${i+1}` }));
const customOptions = Array.from({ length: 7 }, (_, i) => ({ label: `Start in ${i+1} days`, value: `${i+1}` }));

export function Field({ field, value, onChange, autoFocus }: FieldProps<{ value: string }>) {
  const [frequency, hour, period, extra] = value ? value.split('|') : ['off', '1', 'am', ''];

  const setValue = (freq = frequency, hr = hour, per = period, ext = extra) => {
    onChange?.(`${freq}|${hr}|${per}|${ext}`);
  };

  const handleFrequencyChange = (val: { value?: string; label?: string } | null) => {
    const selectedFreq = val?.value || 'off';
    let defaultExtra = '';
    if (selectedFreq === 'weekly') {
      defaultExtra = weeklyOptions[0].value;
    } else if (selectedFreq === 'monthly') {
      defaultExtra = monthlyOptions[0].value;
    } else if (selectedFreq === 'custom') {
      defaultExtra = customOptions[0].value;
    }
    setValue(selectedFreq, '1', 'am', defaultExtra);
  };

  const renderExtraField = () => {
    if (frequency === 'weekly') {
      return (
        <div style={{ flexGrow: 1 }}>
          <Select
            options={weeklyOptions}
            value={weeklyOptions.find(o => o.value === extra) || weeklyOptions[0]}
            onChange={val => setValue(frequency, hour, period, val?.value || weeklyOptions[0].value)}
          />
        </div>
      );
    } else if (frequency === 'monthly') {
      return (
        <div style={{ flexGrow: 1 }}>
          <Select
            options={monthlyOptions}
            value={monthlyOptions.find(o => o.value === extra) || monthlyOptions[0]}
            onChange={val => setValue(frequency, hour, period, val?.value || monthlyOptions[0].value)}
          />
        </div>
      );
    } else if (frequency === 'custom') {
      return (
        <div style={{ flexGrow: 1 }}>
          <Select
            options={customOptions}
            value={customOptions.find(o => o.value === extra) || customOptions[0]}
            onChange={val => setValue(frequency, hour, period, val?.value || customOptions[0].value)}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <FieldContainer>
        <FieldLabel>Sync Frequency</FieldLabel>
        <Select
          options={frequencies}
          value={frequencies.find(f => f.value === frequency) || frequencies[0]}
          onChange={handleFrequencyChange}
          autoFocus={autoFocus}
        />
      </FieldContainer>
      
      {frequency && frequency !== 'off' && (
        <FieldContainer style={{ marginTop: '24px' }}>
          <FieldLabel>
            Schedule Frequency{ frequency === 'monthly' ? ' (day of month)' : ''}
          </FieldLabel>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {frequency !== 'daily' && renderExtraField()}
            <Select
              options={hours}
              value={hours.find(h => h.value === hour) || hours[0]}
              onChange={val => setValue(frequency, val?.value || '1', period, extra)}
            />
            <Select
              options={periods}
              value={periods.find(p => p.value === period) || periods[0]}
              onChange={val => setValue(frequency, hour, val?.value || 'am', extra)}
            />
          </div>
        </FieldContainer>
      )}
    </>
  );
}

export const controller = (config: FieldControllerConfig<{}>) => ({
  path: config.path,
  label: config.label,
  graphqlSelection: config.path,
  defaultValue: 'off|1|am|',
  deserialize: data => data[config.path] || 'off|1|am|',
  serialize: value => ({ [config.path]: value }),
});
