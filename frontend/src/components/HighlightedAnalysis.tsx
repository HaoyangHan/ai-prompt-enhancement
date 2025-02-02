import React from 'react';
import { Box, Typography } from '@mui/material';

interface HighlightedAnalysisProps {
  highlightedContent: string;
}

const HighlightedAnalysis: React.FC<HighlightedAnalysisProps> = ({ highlightedContent }) => {
  return (
    <Box>
      <Typography
        variant="body2"
        component="div"
        sx={{
          '& span': {
            // Innovative content (green, bold)
            '&[style*="color:green"]': {
              color: '#4CAF50 !important',
              fontWeight: 'bold !important'
            },
            // Polished content (purple, italic)
            '&[style*="color:purple"]': {
              color: '#9C27B0 !important',
              fontStyle: 'italic !important'
            }
          },
          whiteSpace: 'pre-wrap',
          '& *': {
            fontFamily: 'inherit'
          }
        }}
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    </Box>
  );
};

export default HighlightedAnalysis; 