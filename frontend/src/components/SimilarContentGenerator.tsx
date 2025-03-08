import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ModelType } from '../config/api';

const predefinedBatchSizes = [5, 10, 20, 50, 100];

interface GeneratedItem {
  content: string;
  score: number;
  index?: number;
  timestamp?: string;
}

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
  
  // State management
  const [editedReference, setEditedReference] = useState(referenceContent);
  const [instructions, setInstructions] = useState(baseInstructions);
  const [customBatchSize, setCustomBatchSize] = useState('');
  const [selectedBatchSize, setSelectedBatchSize] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedItem[]>([]);

  // Handle generation
  const handleGenerate = async (forceRefresh: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    const batchSize = customBatchSize ? parseInt(customBatchSize) : parseInt(selectedBatchSize);

    try {
      const response = await fetch('http://localhost:8000/api/v1/synthetic-data/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_content: editedReference,
          template: baseTemplate,
          additional_instructions: instructions,
          batch_size: batchSize,
          model: model,
          force_refresh: forceRefresh
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate similar content');
      }

      const result = await response.json();
      console.log('API Response:', result); // Add this for debugging

      // Simplify data processing
      let processedData: GeneratedItem[] = [];
      
      if (result.data) {
        processedData = result.data.map((item: any, index: number) => ({
          content: item.content || '',
          score: typeof item.score === 'number' ? item.score : 0,
          index: index + 1,
          timestamp: item.timestamp || new Date().toISOString()
        }));
      }

      setGeneratedContent(processedData);
      console.log('Generated Data Summary:', processedData); // Add this line
    } catch (err) {
      console.error('Generation error:', err); // Add this for debugging
      setError(err instanceof Error ? err.message : 'Failed to generate similar content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvContent = [
      ['Content', 'Score', 'Generation', 'Timestamp'],
      ...generatedContent.map(item => [
        item.content,
        item.score.toString(),
        `Generation ${generationNumber}`,
        item.timestamp || new Date().toISOString()
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `similar_content_generation_${generationNumber}.csv`;
    link.click();
  };

  const handleCustomBatchSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setCustomBatchSize(value);
      setSelectedBatchSize('');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      {/* Header Section with Generation Progress */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        pb: 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
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
          Similar Content Generation
        </Typography>
        <Stepper activeStep={generationNumber} sx={{ mt: 2 }}>
          <Step>
            <StepLabel>Original</StepLabel>
          </Step>
          {Array.from({ length: generationNumber + 1 }).map((_, index) => (
            <Step key={index + 1}>
              <StepLabel>{`Generation ${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Template and Reference Content Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Template Display */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: `${theme.palette.grey[50]}80`,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            height: '100%',
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
            Original Template
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {baseTemplate}
          </Typography>
        </Paper>

        {/* Reference Content Edit */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.primary.main}30`,
            height: '100%',
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              mb: 2,
              color: theme.palette.primary.main,
              letterSpacing: '0.02em',
            }}
          >
            Reference Content
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedReference}
            onChange={(e) => setEditedReference(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.9rem',
              }
            }}
          />
        </Paper>
      </Box>

      {/* Instructions Edit */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.primary.main}30`,
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            mb: 2,
            color: theme.palette.primary.main,
            letterSpacing: '0.02em',
          }}
        >
          Generation Instructions
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.9rem',
            }
          }}
        />
      </Paper>

      {/* Generation Controls */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        p: 2.5,
        borderRadius: '12px',
        backgroundColor: `${theme.palette.primary.main}08`,
      }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.primary.main,
            letterSpacing: '0.02em',
          }}
        >
          Number of Variations (k)
        </Typography>
        
        {/* Batch Size Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Custom number"
            value={customBatchSize}
            onChange={handleCustomBatchSizeChange}
            type="number"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">
                    k =
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{ width: '150px' }}
          />
          <Divider orientation="vertical" flexItem />
          <ToggleButtonGroup
            value={selectedBatchSize}
            exclusive
            onChange={(_, value) => {
              if (value) {
                setSelectedBatchSize(value);
                setCustomBatchSize('');
              }
            }}
            size="small"
          >
            {predefinedBatchSizes.map((size) => (
              <ToggleButton 
                key={size} 
                value={size.toString()}
                sx={{
                  px: 2,
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

        {/* Generate Button and Download */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            variant="contained"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutorenewIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Similar Content'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: `${theme.palette.primary.main}08`,
              }
            }}
          >
            Regenerate
          </Button>
          {generatedContent.length > 0 && (
            <Tooltip title="Download as CSV">
              <IconButton
                onClick={handleDownloadCSV}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}15`,
                  }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Results Section */}
      {(isGenerating || generatedContent.length > 0) && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                letterSpacing: '0.02em',
              }}
            >
              Generated Similar Content
            </Typography>
            {generatedContent.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Average Score: {
                    (generatedContent.reduce((acc, item) => acc + item.score, 0) / generatedContent.length).toFixed(2)
                  }
                </Typography>
                <Tooltip title="Download as CSV">
                  <IconButton
                    onClick={handleDownloadCSV}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}15`,
                      }
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {isGenerating ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2, 
              py: 4 
            }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Generating similar content...
              </Typography>
            </Box>
          ) : (
            <Fade in timeout={500}>
              <TableContainer 
                sx={{ 
                  maxHeight: 600,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: theme.palette.grey[100],
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.palette.grey[300],
                    borderRadius: '4px',
                    '&:hover': {
                      background: theme.palette.grey[400],
                    },
                  },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        width="5%"
                        sx={{ 
                          backgroundColor: theme.palette.grey[50],
                          fontWeight: 600,
                        }}
                      >
                        #
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: theme.palette.grey[50],
                          fontWeight: 600,
                        }}
                      >
                        Content
                      </TableCell>
                      <TableCell 
                        width="10%"
                        align="center"
                        sx={{ 
                          backgroundColor: theme.palette.grey[50],
                          fontWeight: 600,
                        }}
                      >
                        Score
                      </TableCell>
                      <TableCell 
                        width="10%"
                        align="center"
                        sx={{ 
                          backgroundColor: theme.palette.grey[50],
                          fontWeight: 600,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatedContent.map((item, index) => (
                      <TableRow 
                        key={index}
                        sx={{
                          '&:hover': {
                            backgroundColor: `${theme.palette.primary.main}08`,
                          }
                        }}
                      >
                        <TableCell>{item.index || index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: '800px' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                              }}
                            >
                              {item.content}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.primary.main,
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.5,
                              borderRadius: '4px',
                              backgroundColor: `${theme.palette.primary.main}15`,
                            }}
                          >
                            {item.score.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Copy content">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyContent(item.content)}
                              sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                  color: theme.palette.primary.main,
                                  backgroundColor: `${theme.palette.primary.main}15`,
                                }
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Fade>
          )}
        </Paper>
      )}

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Stack>
  );
};

export default SimilarContentGenerator; 