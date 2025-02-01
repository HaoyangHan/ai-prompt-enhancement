import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  IconButton, 
  Chip, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  useTheme
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  ModelTraining as ModelIcon,
  Score as ScoreIcon,
  ArrowForward as ArrowIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { historyService } from '../../services/historyService';
import { AnalysisHistoryItem, ComparisonHistoryItem } from '../../types/history';

interface HistoryCardProps {
  item: AnalysisHistoryItem | ComparisonHistoryItem;
  onViewDetails: (item: AnalysisHistoryItem | ComparisonHistoryItem) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ item, onViewDetails }) => {
  const theme = useTheme();
  const isAnalysis = 'metrics' in item;
  const score = isAnalysis ? item.overall_score : item.comparison_metrics?.improvement_score;

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return theme.palette.success.main;
    if (score >= 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          cursor: 'pointer'
        }
      }}
      onClick={() => onViewDetails(item)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="caption">
                {format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')}
              </Typography>
            </Box>
            <Chip 
              label={isAnalysis ? 'Analysis' : 'Comparison'}
              size="small"
              color={isAnalysis ? 'primary' : 'secondary'}
            />
          </Box>

          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '40px'
            }}
          >
            {item.original_prompt}
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <ModelIcon fontSize="small" color="action" />
              <Typography variant="caption">{item.model_used}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <ScoreIcon fontSize="small" style={{ color: getScoreColor(score || 0) }} />
              <Typography 
                variant="body2" 
                style={{ color: getScoreColor(score || 0), fontWeight: 'bold' }}
              >
                {Math.round((score || 0) * 100)}%
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const DetailDialog: React.FC<{
  item: AnalysisHistoryItem | ComparisonHistoryItem | null;
  open: boolean;
  onClose: () => void;
}> = ({ item, open, onClose }) => {
  if (!item) return null;
  const isAnalysis = 'metrics' in item;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isAnalysis ? 'Analysis Details' : 'Comparison Details'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Timestamp
            </Typography>
            <Typography>
              {format(new Date(item.timestamp), 'PPpp')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Original Prompt
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>{item.original_prompt}</Typography>
            </Paper>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Enhanced Prompt
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>{item.enhanced_prompt}</Typography>
            </Paper>
          </Box>

          {isAnalysis ? (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Metrics
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(item.metrics).map(([key, value]) => (
                    <Grid item xs={12} md={6} key={key}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        <Chip 
                          label={`${Math.round(value.score * 100)}%`}
                          color={value.score >= 0.7 ? 'success' : value.score >= 0.4 ? 'warning' : 'error'}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2">{value.description}</Typography>
                        {value.suggestions.length > 0 && (
                          <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              Suggestions:
                            </Typography>
                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                              {value.suggestions.map((suggestion, idx) => (
                                <li key={idx}>
                                  <Typography variant="body2">{suggestion}</Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Comparison Results
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Improvement Score
                      </Typography>
                      <Chip 
                        label={`${Math.round(item.comparison_metrics.improvement_score * 100)}%`}
                        color={item.comparison_metrics.improvement_score >= 0.7 ? 'success' : 
                               item.comparison_metrics.improvement_score >= 0.4 ? 'warning' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Key Differences
                      </Typography>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        {item.comparison_metrics.key_differences.map((diff, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">{diff}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const NewHistoryView: React.FC = () => {
  const [activeType, setActiveType] = useState<'analysis' | 'comparison'>('analysis');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | ComparisonHistoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analysisResult, comparisonResult] = await Promise.all([
        historyService.getAnalysisHistory(),
        historyService.getComparisonHistory()
      ]);

      if (analysisResult && Array.isArray(analysisResult.items)) {
        setAnalysisHistory(analysisResult.items);
      }
      if (comparisonResult && Array.isArray(comparisonResult.items)) {
        setComparisonHistory(comparisonResult.items);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleViewDetails = (item: AnalysisHistoryItem | ComparisonHistoryItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const currentHistory = activeType === 'analysis' ? analysisHistory : comparisonHistory;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadHistory}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        px={3}
        pt={3}
      >
        <Box display="flex" gap={2}>
          <Button
            variant={activeType === 'analysis' ? 'contained' : 'outlined'}
            onClick={() => setActiveType('analysis')}
          >
            Analysis History
          </Button>
          <Button
            variant={activeType === 'comparison' ? 'contained' : 'outlined'}
            onClick={() => setActiveType('comparison')}
          >
            Comparison History
          </Button>
        </Box>
        <IconButton onClick={loadHistory} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box px={3} pb={3}>
        {currentHistory.length === 0 ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              backgroundColor: 'action.hover'
            }}
          >
            <Typography color="text.secondary">
              No {activeType} history available
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {currentHistory.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <HistoryCard 
                  item={item}
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <DetailDialog
        item={selectedItem}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedItem(null);
        }}
      />
    </Box>
  );
};

export default NewHistoryView; 