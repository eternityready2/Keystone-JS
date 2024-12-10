import React, { useState } from 'react';

export const Field = ({ value, field }: { value: { value: any[] }; field: any }) => {

  // Extract the array of episodes
  const episodesCnt = value?.value?.length || 0;
  const podcastId = value?.id || "";
  const [isHovered, setIsHovered] = useState(false);


  if (episodesCnt === 0) {
    return (
      <div>
        <div className="css-11ditgu">Episodes</div>
        <div>No episodes available.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="css-11ditgu">{field.label || 'Episodes'}</div>
      <p>This feed has {episodesCnt} episodes</p>
      <div style={{ marginBottom: '1rem' }}>
        <a 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
          color: isHovered ? '#2563eb' : '#374151', 
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
          href={`/episodes?%21podcast_matches="${podcastId}"`} // Adjust this URL based on your routing setup
        >
          View episodes
        </a>
      </div>
    </div>
  );
};
