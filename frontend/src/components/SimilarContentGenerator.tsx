import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  useTheme,
  Alert,
  LinearProgress,
  Fade,
  Grow,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InfoIcon from '@mui/icons-material/Info';
import { ModelType } from '../config/api';

const predefinedBatchSizes = [5, 10, 20, 50, 100];

interface GenerationHistory {
  content: string;
  instructions: string;
  score: number;
  timestamp: string;
}

// Add consistent styling
const styles = {
  sectionTitle: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: '1.5rem',
    letterSpacing: '-0.01em',
    color: 'primary.main',
    mb: 3
  },
  sectionSubtitle: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '1.1rem',
    letterSpacing: '-0.01em',
    color: 'text.primary',
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4,
    borderBottom: 1,
    borderColor: 'divider',
    pb: 2
  },
  contentBox: {
    mb: 4,
    '& .MuiTextField-root': {
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      fontSize: '0.9rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
      '& .MuiInputBase-root': {
        padding: 0,
        '& textarea': {
          padding: '12px 14px',
        }
      }
    }
  }
};

interface SimilarContentGeneratorProps {
  referenceContent: string;
  baseTemplate: string;
  baseInstructions: string;
  model: ModelType;
  onBack: () => void;
  generationNumber: number;
}

const SimilarContentGenerator: React.FC<SimilarContentGeneratorProps> = ({
  referenceContent,
  baseTemplate,
  baseInstructions,
  model,
  onBack,
  generationNumber,
}) => {
  const theme = useTheme();
  const [instructions, setInstructions] = useState(baseInstructions);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [expandedTextbox, setExpandedTextbox] = useState(false);
  const [showScoreComparison, setShowScoreComparison] = useState(false);
  const [allGeneratedContent, setAllGeneratedContent] = useState<any[]>([]);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [showTemplateComparison, setShowTemplateComparison] = useState(false);
  const [selectedBatchSize, setSelectedBatchSize] = useState<string>('1');
  const [customBatchSize, setCustomBatchSize] = useState<string>('');
  const [batchGenerationMode, setBatchGenerationMode] = useState(false);

  useEffect(() => {
    if (generatedContent) {
      setAllGeneratedContent(prev => [...prev, generatedContent]);
    }
  }, [generatedContent]);

  const parseGeneratedItem = (item: any) => {
    if (Array.isArray(item)) {
      return {
        content: item[0],
        score: item[1]
      };
    }
    if (typeof item === 'object' && item !== null) {
      return {
        content: item.content || '',
        score: typeof item.score === 'number' ? item.score : 0
      };
    }
    return {
      content: String(item),
      score: 0
    };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const batchSize = customBatchSize ? parseInt(customBatchSize) : parseInt(selectedBatchSize || '1');

    try {
      const response = await fetch('http://localhost:8000/api/v1/synthetic-data/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_content: referenceContent,
          template: baseTemplate,
          additional_instructions: instructions,
          batch_size: batchSize,
          model: model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate similar content');
      }

      const result = await response.json();
      const parsedResults = result.generated_data.map(parseGeneratedItem);
      
      if (batchSize === 1) {
        setGeneratedContent(parsedResults[0]);
        // Add to history
        setHistory(prev => [{
          content: parsedResults[0].content,
          instructions,
          score: parsedResults[0].score,
          timestamp: new Date().toISOString(),
        }, ...prev]);
      } else {
        setAllGeneratedContent(prev => [...prev, ...parsedResults]);
        setDownloadDialogOpen(true);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate similar content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueWithVersion = async () => {
    if (!generatedContent) return;
    
    setIsGenerating(true);
    setError(null);

    const batchSize = customBatchSize ? parseInt(customBatchSize) : parseInt(selectedBatchSize || '5');

    try {
      const response = await fetch('http://localhost:8000/api/v1/synthetic-data/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_content: generatedContent.content, // Use the current generated content as reference
          template: referenceContent, // Use the original reference content as template
          additional_instructions: instructions,
          batch_size: batchSize,
          model: model,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate variations');
      }

      const result = await response.json();
      const parsedResults = result.generated_data.map(parseGeneratedItem);
      setAllGeneratedContent(prev => [...prev, ...parsedResults]);
      setDownloadDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomBatchSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setCustomBatchSize(value);
      setSelectedBatchSize(''); // Clear selected preset size
    }
  };

  const handlePresetBatchSizeSelect = (value: string) => {
    if (value) {
      setSelectedBatchSize(value);
      setCustomBatchSize(''); // Clear custom size
    }
  };

  const handleDownloadAll = () => {
    const csvContent = convertToCSV(allGeneratedContent);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `similar_content_generation_${generationNumber}.csv`;
    link.click();
    setDownloadDialogOpen(false);
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['content', 'score', 'generation', 'timestamp'];
    const rows = [headers.join(',')];
    
    data.forEach((item, index) => {
      const row = [
        `"${item.content.replace(/"/g, '""')}"`,
        item.score,
        generationNumber,
        new Date().toISOString()
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  };

  const getAverageScore = (items: any[]) => {
    if (!items.length) return 0;
    return items.reduce((acc, item) => acc + (parseGeneratedItem(item).score || 0), 0) / items.length;
  };

  return (
    <Fade in timeout={500}>
      <Box sx={{ p: 2 }}>
        <Paper 
          component={motion.div}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{ p: 3 }}
        >
          <Box sx={styles.headerContainer}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={onBack} size="small" sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography sx={styles.sectionTitle}>
                Similar Content Generation #{generationNumber}
              </Typography>
            </Box>
          </Box>

          {/* Generation Progress */}
          <Stepper activeStep={generationNumber - 1} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Original</StepLabel>
            </Step>
            {Array.from({ length: generationNumber }).map((_, index) => (
              <Step key={index + 1}>
                <StepLabel>{`Generation ${index + 1}`}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Template Comparison */}
          <Collapse in={showTemplateComparison}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Template Comparison
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Original Template
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {baseTemplate}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Reference
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {referenceContent}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Collapse>

          {/* Score Comparison */}
          <Collapse in={showScoreComparison}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Score Comparison
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Average: {getAverageScore([generatedContent]).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Average: {getAverageScore(allGeneratedContent).toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getAverageScore(allGeneratedContent) * 100}
                    sx={{
                      width: 100,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: theme.palette.primary.main,
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Collapse>

          {/* Batch Size Selection */}
          <Box sx={styles.contentBox}>
            <Typography sx={styles.sectionSubtitle}>
              Number of Variations
              <Tooltip title="How many variations to generate">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            
            {/* Custom Size Input */}
            <TextField
              size="small"
              value={customBatchSize}
              onChange={handleCustomBatchSizeChange}
              placeholder="Custom number"
              type="number"
              InputProps={{
                endAdornment: customBatchSize && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setCustomBatchSize('')}
                      edge="end"
                      size="small"
                    >
                      ×
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ width: '200px', mb: 1 }}
            />

            {/* Preset Sizes */}
            <ToggleButtonGroup
              value={selectedBatchSize}
              exclusive
              onChange={(_, value) => handlePresetBatchSizeSelect(value)}
              sx={{ 
                flexWrap: 'wrap',
                '& .MuiToggleButton-root': {
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '4px !important',
                  m: 0.5,
                }
              }}
            >
              {predefinedBatchSizes.map((size) => (
                <ToggleButton 
                  key={size} 
                  value={size.toString()}
                  sx={{
                    px: 2,
                    py: 1,
                    minWidth: '60px',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  }}
                >
                  {size}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Content Cards with Animation */}
          <AnimatePresence>
            <Stack 
              component={motion.div}
              layout
              direction="row" 
              spacing={2} 
              sx={{ mb: 4 }}
            >
              {/* Reference Content Card */}
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Reference Content
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {referenceContent}
                  </Typography>
                </CardContent>
              </Card>

              {/* Generated Content Card */}
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Generated Content
                    </Typography>
                    {generatedContent && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Quality Score:
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={generatedContent.score * 100}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: generatedContent.score >= 0.7
                                ? theme.palette.success.main
                                : generatedContent.score >= 0.4
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                              borderRadius: 3,
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {generatedContent.score.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {isGenerating ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                      <LinearProgress sx={{ width: '100%' }} />
                      <Typography variant="body2" color="text.secondary">
                        Generating similar content...
                      </Typography>
                    </Box>
                  ) : generatedContent ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {generatedContent.content}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Click "Generate" to create similar content
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </AnimatePresence>

          {/* Expandable Instructions Section */}
          <Box sx={styles.contentBox}>
            <Typography sx={styles.sectionSubtitle}>
              Generation Instructions
              <Tooltip title="Customize how the similar content should be generated">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={expandedTextbox ? 8 : 4}
              value={instructions}
              onChange={(e) => isEditing && setInstructions(e.target.value)}
              disabled={!isEditing}
              variant="outlined"
              sx={{
                transition: 'all 0.3s ease',
                '& .MuiInputBase-root': {
                  backgroundColor: isEditing ? 'transparent' : theme.palette.grey[50],
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                  fontSize: '0.9rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.6,
                  padding: 0,
                  '& textarea': {
                    padding: '12px 14px',
                  }
                }
              }}
            />
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AutorenewIcon />}
              onClick={handleGenerate}
              disabled={isGenerating}
              size="large"
            >
              Generate {(customBatchSize || selectedBatchSize || '1')} {
                (customBatchSize || selectedBatchSize || '1') === '1' ? 'Version' : 'Versions'
              }
            </Button>
            {generatedContent && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleContinueWithVersion}
                disabled={isGenerating}
                size="large"
              >
                Continue with This Version
              </Button>
            )}
          </Box>

          {/* Generation History */}
          {history.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Generation History
              </Typography>
              <Stack spacing={2}>
                {history.map((item, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Score: {item.score.toFixed(2)}
                          </Typography>
                          <IconButton size="small">
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        whiteSpace: 'pre-wrap',
                        maxHeight: 100,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.content}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Download Dialog */}
          <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
            <DialogTitle>Download Generated Content</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                {allGeneratedContent.length} variations have been generated.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score: {getAverageScore(allGeneratedContent).toFixed(2)}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleDownloadAll}
                variant="contained" 
                startIcon={<DownloadIcon />}
              >
                Download All
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Fade>
  );
};

export default SimilarContentGenerator; 