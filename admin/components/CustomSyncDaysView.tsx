// CustomSyncDaysField.jsx
import React from 'react'
import { FieldContainer, FieldDescription, FieldLabel, TextInput } from '@keystone-ui/fields'
import {
  type CardValueComponent,
  type CellComponent,
  type FieldController,
  type FieldControllerConfig,
  type FieldProps,
} from '@keystone-6/core/types'

export function Field ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) {
  const disabled = onChange === undefined

  return (
    <FieldContainer as="fieldset" id='customDaysDiv'>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>{field.description}</FieldDescription>
      <div>
        <TextInput
          type="number" // Change input type to number
          onChange={event => {
            const inputValue = event.target.value
            // Parse the input value to integer; handle empty input as null
            const parsedValue = inputValue === '' ? null : parseInt(inputValue, 10)
            onChange?.(parsedValue)
          }}
          disabled={disabled}
          value={value !== null ? value : ''} // Handle null by showing empty string
          autoFocus={autoFocus}
        />
      </div>
    </FieldContainer>
  )
}

export const Cell: CellComponent = ({ item, field, linkTo }) => {
  const value = item[field.path] + ''
  return linkTo ? <CellLink {...linkTo}>{value}</CellLink> : <CellContainer>{value}</CellContainer>
}
Cell.supportsLinkTo = true

export const CardValue: CardValueComponent = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {item[field.path]}
    </FieldContainer>
  )
}

export const controller = (
  config: FieldControllerConfig<{}>
): FieldController<number | null, number> => { // Update type to number
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: null,
    deserialize: data => {
      const value = data[config.path]
      return typeof value === 'number' ? value : null // Ensure value is a number
    },
    serialize: value => ({ [config.path]: value }), // Serialize as number
  }
}
