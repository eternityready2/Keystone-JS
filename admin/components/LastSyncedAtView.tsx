import React, { useState, useEffect } from 'react';
import { TextInput, FieldContainer, FieldLabel } from '@keystone-ui/fields';
import { Button } from '@keystone-ui/button';
import { FieldProps } from '@keystone-6/core/types';

export const Field = ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) => {
  const [itemId, setItemId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false); // Sync state
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(
    value?.value?.dateValue
      ? new Date(`${value.value.dateValue}T${value.value.timeValue?.value}Z`)
      : null
  );

  // Extract the date and time values
  const date = value?.value?.dateValue || '1970-01-01';
  const time = value?.value?.timeValue?.value || '00:00:00.000';
  const dateTime = new Date(`${date}T${time}Z`);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let isMounted = true; // To prevent state updates on unmounted component

    // Locate the label with the text "Item ID"
    const labels = document.querySelectorAll('label');
    let foundInput: HTMLInputElement | null = null;

    labels.forEach((label) => {
      if (label.textContent === 'Item ID') {
        const parentDiv = label.closest('div');
        if (parentDiv) {
          const input = parentDiv.querySelector('input');
          if (input instanceof HTMLInputElement) {
            foundInput = input;
          }
        }
      }
    });

    if (foundInput && isMounted) {
      setItemId(foundInput.value); // Extract the value of the Item ID input
    }

    return () => {
      isMounted = false; // Cleanup flag on unmount
    };
  }, []);

  // Format the date and time
  const formattedDateTime = dateTime
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(dateTime)
    : 'Never';

  // Define the sync function
  const syncNow = async () => {
    if (!itemId) {
      alert('Item ID is missing.');
      return;
    }

    try {
      setIsSyncing(true);
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId: itemId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync episodes: ${response.statusText}`);
      }

      // Optionally update the lastSyncedAt state with the current time
      setLastSyncedAt(new Date());

      setIsSyncing(false);
      alert('Sync completed successfully!');
    } catch (error) {
      setIsSyncing(false);
      console.error('Failed to sync episodes:', error);
      alert('Sync failed. Please check the console for more details.');
    }
  };

  const CustomButton = ({
    isLoading,
    onClick,
    disabled,
  }: {
    isLoading: boolean;
    onClick: () => void;
    disabled: boolean;
  }) => {
    return (
      <Button size="medium" tone="active" isLoading={isLoading} onClick={onClick} disabled={disabled}>
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </Button>
    );
  };

  return (
    <FieldContainer>
      <FieldLabel>{field.label || 'Last Synced At'}</FieldLabel>
      <p>{formattedDateTime}</p>
      <CustomButton isLoading={isSyncing} onClick={syncNow} disabled={isSyncing} />
    </FieldContainer>
  );
};
