import React, { useState, useEffect  } from 'react';

export const Field = ({ value, field, item }: { value: { value: any[] }; field: any; item: any }) => {
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
  

  return (
    <div>
      <div className="css-11ditgu">{field.label || 'Last Synced At'}</div>
      <div className="css-t3ussg">{formattedDateTime}</div>
      <button
      onClick={syncNow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        padding: '0 16px',
        backgroundColor: isHovered ? '#1d4ed8' : '#2563eb', 
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        marginTop: '5px',
        lineHeight: '1.15',
        fontWeight: '500',
        height: '38px',
      }}
    >
      Sync now
    </button>

      {/* Popup for syncing status */}
      {isSyncing && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '10px',
            zIndex: 1000,
          }}
        >
          Sync is running, you can leave this page it will continue in background
        </div>
      )}
    </div>
  );
};
