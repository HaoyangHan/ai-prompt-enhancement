import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, useTheme, Chip, Button, Stack, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HighlightedAnalysis from './HighlightedAnalysis';
import { ComparisonResult } from '../types/comparison';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PromptBoxProps {
  title: string;
  content: string;
}

const PromptBox: React.FC<PromptBoxProps> = ({ title, content }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </Typography>
  </Paper>
);

interface LegendItemProps {
  color: string;
  style: 'bold' | 'italic';
  label: string;
  description: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, style, label, description }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '4px',
          backgroundColor: color,
          opacity: 0.8
        }}
      />
      <Typography
        variant="body2"
        sx={{
          fontWeight: style === 'bold' ? 600 : 400,
          fontStyle: style === 'italic' ? 'italic' : 'normal',
          color: color,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary',
          fontSize: '0.85rem',
          letterSpacing: '0.02em',
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};

interface AdvancedAnalyticsProps {
  comparisonResult: ComparisonResult;
  onViewHistory?: () => void;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ 
  comparisonResult,
  onViewHistory 
}) => {
  const theme = useTheme();

  const handleCopyEnhancedPrompt = () => {
    navigator.clipboard.writeText(comparisonResult.enhanced_prompt.prompt);
  };

  // Prepare data for chart
  const metricsData = Object.entries(comparisonResult.original_prompt.metrics).map(([key, originalMetric]) => {
    const enhancedMetric = comparisonResult.enhanced_prompt.metrics[key];
    return {
      metric: key,
      original: originalMetric.score * 100,
      enhanced: enhancedMetric.score * 100,
    };
  });

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            Advanced Analytics
          </Typography>
          <Chip 
            size="small" 
            label={comparisonResult.model_used}
            sx={{
              backgroundColor: `${theme.palette.primary.main}15`,
              color: theme.palette.primary.main,
              fontWeight: 500,
              borderRadius: '6px',
            }}
          />
        </Stack>
        {onViewHistory && (
          <Tooltip title="View comparison history">
            <IconButton 
              onClick={onViewHistory} 
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}15`,
                }
              }}
            >
              <CompareArrowsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Legend Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          backgroundColor: `${theme.palette.primary.main}08`,
          borderRadius: '12px',
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon 
              fontSize="small" 
              sx={{ color: theme.palette.primary.main }}
            />
            <Typography 
              variant="subtitle2"
              sx={{ 
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: theme.palette.primary.main
              }}
            >
              Content Highlighting Guide
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            <LegendItem
              color="#2E7D32"
              style="bold"
              label="Innovative Content"
              description="New content not present in original"
            />
            <LegendItem
              color="#7B1FA2"
              style="italic"
              label="Polished Content"
              description="Refined version of original"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Prompts Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Original Prompt */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            height: '100%', 
            backgroundColor: `${theme.palette.grey[50]}80`,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
              letterSpacing: '0.02em',
            }}
          >
            Original Prompt
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            {comparisonResult.original_prompt.prompt}
          </Typography>
        </Paper>

        {/* Enhanced Prompt */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            height: '100%',
            borderRadius: '12px',
            border: `1px solid ${theme.palette.primary.main}30`,
            backgroundColor: '#fff',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main,
                letterSpacing: '0.02em',
              }}
            >
              Enhanced Prompt
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyEnhancedPrompt}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                borderColor: `${theme.palette.primary.main}30`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}08`,
                }
              }}
            >
              Copy Plain Text
            </Button>
          </Box>
          {comparisonResult.enhanced_prompt.highlighted_prompt ? (
            <HighlightedAnalysis highlightedContent={comparisonResult.enhanced_prompt.highlighted_prompt} />
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              {comparisonResult.enhanced_prompt.prompt}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Visualization Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: '#fff',
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            mb: 3,
            letterSpacing: '0.02em',
          }}
        >
          Quality Metrics Overview
        </Typography>
        <Box sx={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={metricsData}>
              <PolarGrid 
                stroke={theme.palette.divider}
              />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ 
                  fill: theme.palette.text.secondary,
                  fontSize: 12,
                  fontWeight: 500,
                }}
                style={{ textTransform: 'capitalize' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ 
                  fill: theme.palette.text.secondary,
                  fontSize: 11,
                }}
                tickFormatter={(value) => `${value}%`}
                stroke={theme.palette.divider}
              />
              <Radar
                name="Original"
                dataKey="original"
                stroke={theme.palette.error.main}
                fill={theme.palette.error.main}
                fillOpacity={0.2}
              />
              <Radar
                name="Enhanced"
                dataKey="enhanced"
                stroke={theme.palette.success.main}
                fill={theme.palette.success.main}
                fillOpacity={0.2}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '12px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Stack>
  );
};

export default AdvancedAnalytics; 