import React, { useState, useEffect  } from 'react';
import { TextInput, FieldContainer, FieldLabel } from '@keystone-ui/fields';
import { Button } from '@keystone-ui/button';
import { FieldProps } from '@keystone-6/core/types';

export const Field = ({ field, value, onChange, autoFocus }: FieldProps<typeof controller>) => {
  const [itemId, setItemId] = useState<string | null>(null); 
  const [isSyncing, setIsSyncing] = useState(false); // Sync state
  const [lastSyncedAt, setLastSyncedAt] = useState(value?.value?.dateValue ? new Date(`${value.value.dateValue}T${value.value.timeValue?.value}Z`) : null);

  // Extract the date and time values
  const date = value?.value?.dateValue || '1970-01-01';
  const time = value?.value?.timeValue?.value || '00:00:00.000'; 
  const dateTime = new Date(`${date}T${time}Z`);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Locate the label with the text "Item ID"
    const labels = document.querySelectorAll('label');
    let foundInput = null;

    labels.forEach((label) => {
      if (label.textContent === 'Item ID') {
        const parentDiv = label.closest('div');
        foundInput = parentDiv?.querySelector('input');
      }
    });

    if (foundInput instanceof HTMLInputElement) {
      setItemId(foundInput.value); // Extract the value of the Item ID input
    }
  }, []);
  

  // Format the date and time
  const formattedDateTime = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(dateTime);

  // Define the sync function
  const syncNow = async () => {
    if (!itemId) {
      alert('Item ID is missing.');
      return;
    }

    try {
    setIsSyncing(true)
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId: itemId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync episodes: ${response.statusText}`);
      }
      setIsSyncing(false)
    } catch (error) {
        setIsSyncing(false)
      console.error('Failed to sync episodes:', error);
    }
  };
  
  const CustomButton = ({ isLoading, onClick }) => {
    return (
      <Button
        size="medium"
        tone="active"
        isLoading={isLoading}
        onClick={onClick}
      >
        {isLoading ? 'Loading...' : 'Sync Now'}
      </Button>
    );
  };

  return (
    <FieldContainer>
      <FieldLabel>{field.label || 'Last Synced At'}</FieldLabel>
      <p>{formattedDateTime}</p>
      <CustomButton isLoading={isSyncing} onClick={syncNow} />
    </FieldContainer>
  );
};
