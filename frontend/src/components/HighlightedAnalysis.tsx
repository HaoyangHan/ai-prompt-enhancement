import React from 'react';
import { Box, Paper } from '@mui/material';
import DOMPurify from 'dompurify';

interface HighlightedAnalysisProps {
  highlightedContent: string;
}

const HighlightedAnalysis: React.FC<HighlightedAnalysisProps> = ({ highlightedContent }) => {
  console.log('HighlightedAnalysis - Raw Content:', highlightedContent);
  
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(highlightedContent);
  console.log('HighlightedAnalysis - Sanitized Content:', sanitizedContent);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2,
        backgroundColor: 'background.default',
        '& span': {
          display: 'inline-block',
          margin: '0 2px',
          padding: '2px 6px',
          borderRadius: '4px',
        },
        lineHeight: 1.6,
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </Paper>
  );
};

export default HighlightedAnalysis; 