import React from 'react';
import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { format, isValid, parseISO } from 'date-fns';

interface AnalysisHistoryItem {
  timestamp?: string;
  original_prompt: string;
  enhanced_prompt?: string;
  metrics?: Record<string, any>;
  model_used?: string;
}

interface AnalysisHistoryProps {
  history: AnalysisHistoryItem[];
  onViewDetails?: (item: AnalysisHistoryItem) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'No date';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return format(date, 'PPpp'); // e.g., "Apr 29, 2021, 5:34 PM"
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date format';
  }
};

const AnalysisHistoryItem: React.FC<{ 
  item: AnalysisHistoryItem;
  onViewDetails?: (item: AnalysisHistoryItem) => void;
}> = ({ item, onViewDetails }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 1 
      }}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(item.timestamp)}
        </Typography>
        {onViewDetails && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onViewDetails(item)}
          >
            View Details
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Original Prompt
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            maxHeight: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.original_prompt}
        </Typography>
      </Box>

      {item.enhanced_prompt && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Enhanced Prompt
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              maxHeight: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.enhanced_prompt}
          </Typography>
        </Box>
      )}

      {item.model_used && (
        <Typography variant="caption" color="text.secondary">
          Model used: {item.model_used}
        </Typography>
      )}
    </Paper>
  );
};

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ history, onViewDetails }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Analysis History
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {history.length === 0 ? (
        <Typography color="text.secondary">No analysis history available</Typography>
      ) : (
        history.map((item, index) => (
          <AnalysisHistoryItem 
            key={index} 
            item={item} 
            onViewDetails={onViewDetails}
          />
        ))
      )}
    </Box>
  );
};

export default AnalysisHistory; 