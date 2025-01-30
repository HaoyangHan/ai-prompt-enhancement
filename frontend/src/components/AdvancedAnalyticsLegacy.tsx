// Archived version of the original advanced analytics
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import HighlightedAnalysis from './HighlightedAnalysis';

interface AdvancedAnalyticsLegacyProps {
  comparisonResult: {
    original_prompt: {
      prompt: string;
      metrics: Record<string, any>;
    };
    enhanced_prompt: {
      prompt: string;
      metrics: Record<string, any>;
      highlighted_prompt?: string;
    };
    model_used: string;
  };
}

const AdvancedAnalyticsLegacy: React.FC<AdvancedAnalyticsLegacyProps> = ({ comparisonResult }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Advanced Analytics (Legacy)
      </Typography>
      
      {/* Highlighted Analysis Section */}
      <Box sx={{ my: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Highlighted Changes
        </Typography>
        {comparisonResult.enhanced_prompt.highlighted_prompt ? (
          <HighlightedAnalysis highlightedContent={comparisonResult.enhanced_prompt.highlighted_prompt} />
        ) : (
          <Typography color="text.secondary">No highlighted analysis available</Typography>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Metrics Section */}
      {comparisonResult.enhanced_prompt.metrics && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Quality Metrics
          </Typography>
          {Object.entries(comparisonResult.enhanced_prompt.metrics).map(([metric, data]: [string, any]) => (
            <Box key={metric} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary">
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Score: {data.score} 
                {comparisonResult.original_prompt.metrics[metric]?.score && (
                  <span> (was: {comparisonResult.original_prompt.metrics[metric].score})</span>
                )}
              </Typography>
              <Typography variant="body2">
                {data.description}
              </Typography>
              {data.suggestions?.map((suggestion: string, index: number) => (
                <Typography key={index} variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  • {suggestion}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AdvancedAnalyticsLegacy; 