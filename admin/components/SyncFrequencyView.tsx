// SyncFrequencyField.jsx
import React, { useEffect  } from 'react';
import { FieldContainer, FieldDescription, FieldLabel, Select } from '@keystone-ui/fields'
import {
  type CardValueComponent,
  type CellComponent,
  type FieldController,
  type FieldControllerConfig,
  type FieldProps,
} from '@keystone-6/core/types'

// Utility function to capitalize the first letter
const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1)

export function Field ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) {
  const disabled = onChange === undefined

  const hideShowSyncDays = (value: string) => {
    console.log('hideShowSyncDays called with value:', value)
    const customDaysDiv = document.getElementById('customDaysDiv');
    if (customDaysDiv && customDaysDiv.parentNode) {
        if (value == 'custom') {
            (customDaysDiv.parentNode as HTMLElement).style.display = 'block';
        } else {
            (customDaysDiv.parentNode as HTMLElement).style.display = 'none';
        }
    }else{
        console.warn('Element with ID "customDaysDiv" not found.')
    }
  }
  useEffect(() => {
    hideShowSyncDays(value)
  }, [value])
  // Handler for Select change
  const handleOnChange = (selectedOption: { value: any }) => {
    if (!selectedOption) {
      // Handle case when no option is selected
      console.warn('No option selected.')
      onChange?.(null)
      return
    }
    const customDaysDiv = document.getElementById('customDaysDiv');
    
    const selectedValue = selectedOption.value
    
    console.log('Selected syncFrequency:', selectedValue)

    // Dispatch a custom event with the selected value
    const customEvent = new CustomEvent('syncFrequencyChange', { detail: selectedValue })
    document.dispatchEvent(customEvent)
    
    if (customDaysDiv && customDaysDiv.parentNode) {
        if (selectedValue == 'custom') {
            (customDaysDiv.parentNode as HTMLElement).style.display = 'block';
        } else {
            (customDaysDiv.parentNode as HTMLElement).style.display = 'none';
        }
    }
    
    console.log('Custom event "syncFrequencyChange" dispatched with value:', selectedValue)
    // Call the onChange handler provided by KeystoneJS
    onChange?.(selectedValue)
  }
  
  
  return (
    <FieldContainer>
      <FieldLabel htmlFor={field.path}>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>{field.description}</FieldDescription>
      {onChange ? (
        <Select
          id={field.path}
          autoFocus={autoFocus}
          onChange={handleOnChange} // Updated handler
          value={value ? { label: capitalize(value), value } : null} // Ensure the Select component receives the correct format
          options={[
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Custom', value: 'custom' },
          ]}
          isClearable={false} // Prevent clearing the selection if desired
        />
      ) : (
        value
      )}
    </FieldContainer>
  )
}

// Cell Component
export const Cell: CellComponent = ({ item, field, linkTo }) => {
  const value = item[field.path] + ''
  return linkTo ? <CellLink {...linkTo}>{value}</CellLink> : <CellContainer>{value}</CellContainer>
}
Cell.supportsLinkTo = true

// Card Value Component
export const CardValue: CardValueComponent = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {capitalize(item[field.path])}
    </FieldContainer>
  )
}

// Controller Function
export const controller = (
  config: FieldControllerConfig<{}>
): FieldController<string | null, string> => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: null,
    deserialize: data => {
      const value = data[config.path]
      return typeof value === 'string' ? value : null
    },
    serialize: value => ({ [config.path]: value }),
  }
}
