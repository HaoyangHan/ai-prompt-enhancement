import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress } from '@mui/material';
import HighlightedAnalysis from './HighlightedAnalysis';
import { getComparisonHistory } from '../config/api';

interface ComparisonHistoryItem {
  original_prompt: {
    prompt: string;
  };
  enhanced_prompt: {
    prompt: string;
    highlighted_prompt?: string;
  };
  model_used: string;
  timestamp?: string;
}

const ComparisonHistoryItem: React.FC<{ comparison: ComparisonHistoryItem }> = ({ comparison }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        {comparison.timestamp && (
          <Typography variant="caption" color="text.secondary">
            {new Date(comparison.timestamp).toLocaleString()}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Original Prompt */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Original Prompt
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {comparison.original_prompt.prompt}
          </Typography>
        </Paper>

        {/* Enhanced Prompt with Highlights */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Enhanced Prompt
          </Typography>
          {comparison.enhanced_prompt.highlighted_prompt ? (
            <HighlightedAnalysis highlightedContent={comparison.enhanced_prompt.highlighted_prompt} />
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {comparison.enhanced_prompt.prompt}
            </Typography>
          )}
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Model used: {comparison.model_used}
        </Typography>
      </Box>
    </Paper>
  );
};

const ComparisonHistory: React.FC = () => {
  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getComparisonHistory();
        const formattedHistory = data.items.map(item => ({
          original_prompt: { prompt: item.results[0]?.content || '' },
          enhanced_prompt: { 
            prompt: item.results[item.results.length - 1]?.content || '',
            highlighted_prompt: item.results[item.results.length - 1]?.content
          },
          model_used: item.model,
          timestamp: item.timestamp
        }));
        setHistory(formattedHistory);
      } catch (err) {
        setError('Failed to load comparison history');
        console.error('Error fetching comparison history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Prompt Comparison History
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {history.length === 0 ? (
        <Typography color="text.secondary">No comparison history available</Typography>
      ) : (
        history.map((comparison, index) => (
          <ComparisonHistoryItem key={index} comparison={comparison} />
        ))
      )}
    </Box>
  );
};

export default ComparisonHistory; 