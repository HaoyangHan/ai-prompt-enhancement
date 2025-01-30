import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useNavigate } from 'react-router-dom';
import HighlightedAnalysis from './HighlightedAnalysis';

interface AdvancedAnalyticsProps {
  comparisonResult: {
    original_prompt: {
      prompt: string;
    };
    enhanced_prompt: {
      prompt: string;
      highlighted_prompt?: string;
    };
  };
}

const PromptBox: React.FC<{ title: string; content: string; isEnhanced?: boolean; onCopy?: () => void }> = ({
  title,
  content,
  isEnhanced,
  onCopy
}) => {
  return (
    <Paper sx={{ p: 2, position: 'relative', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        {isEnhanced && onCopy && (
          <Tooltip title="Copy prompt">
            <IconButton onClick={onCopy} size="small">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </Typography>
    </Paper>
  );
};

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ comparisonResult }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(comparisonResult.enhanced_prompt.prompt);
  };

  const handleViewComparison = () => {
    navigate('/comparison-history');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Advanced Analytics</Typography>
        <Tooltip title="View comparison history">
          <IconButton onClick={handleViewComparison} color="primary">
            <CompareArrowsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Original Prompt */}
        <PromptBox
          title="Original Prompt"
          content={comparisonResult.original_prompt.prompt}
        />

        {/* Enhanced Prompt with Highlights */}
        <Box>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Enhanced Prompt
              </Typography>
              <Box>
                <Tooltip title="Copy enhanced prompt">
                  <IconButton onClick={handleCopyPrompt} size="small">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {comparisonResult.enhanced_prompt.highlighted_prompt ? (
              <HighlightedAnalysis highlightedContent={comparisonResult.enhanced_prompt.highlighted_prompt} />
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {comparisonResult.enhanced_prompt.prompt}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdvancedAnalytics; 