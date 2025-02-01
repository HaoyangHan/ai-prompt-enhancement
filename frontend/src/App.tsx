import React, { useState, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Paper,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  LinearProgress,
  Grid,
  Divider,
  Drawer,
  ListItemButton,
  ListItemIcon,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  DataObject as DataObjectIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getAnalysisHistory, getComparisonHistory } from './api/api';
import { analyzePrompt, ModelType } from './config/api';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LabelList,
  Tooltip as RechartsTooltip,
} from 'recharts';
import AnalysisHistory from './components/AnalysisHistory';
import SyntheticDataGenerator from './components/SyntheticDataGenerator';

// Create a theme similar to Citi's style
const theme = createTheme({
  palette: {
    primary: {
      main: '#056DAE', // Citi blue
      dark: '#034B87',
      light: '#0A8BC0',
    },
    secondary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#056DAE',
    },
    h6: {
      fontWeight: 600,
      color: '#056DAE',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '.highlighted-content span': {
          display: 'inline-block',
          margin: '0 2px',
          padding: '2px 6px',
          borderRadius: '4px'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Helper function to get color based on score
const getScoreColor = (score: number): string => {
  if (score < 0.4) return '#ff4444';  // Red
  if (score < 0.7) return '#ffbb33';  // Yellow
  return '#00C851';  // Green
};

// Helper function to format score as percentage
const formatScore = (score: number): string => `${Math.round(score * 100)}%`;

// Define view types
type ViewType = 'analyze' | 'compare' | 'analysis-history' | 'comparison-history' | 'prompt-comparison' | 'prompt-evaluation' | 'synthetic-data';

interface Metric {
    score: number;
    description: string;
    suggestions: string[];
}

interface Metrics {
    [key: string]: Metric;
}

interface PromptVersion {
    prompt: string;
    metrics: Metrics;
    suggestions: string[];
}

interface ComparisonResult {
    original_prompt: PromptVersion;
    enhanced_prompt: PromptVersion & {
        highlighted_prompt: string;
    };
    model_used: string;
    timestamp?: string;
}

interface MetricData {
  metric: string;
  score: number;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
}

interface ChartMetric {
  metric: string;
  score?: number;
  original?: number;
  enhanced?: number;
}

interface EvaluationPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  variables: string[];
}

// Add sample prompts data
const SAMPLE_PROMPTS = [
  {
    title: "Congratulatory Email",
    prompt: "Write a congratulatory email to a team member who successfully completed a major project. Include specific achievements and maintain a professional tone.",
  },
  {
    title: "Product Description",
    prompt: "Create a compelling product description for a new eco-friendly water bottle. Highlight its sustainable features and unique selling points.",
  },
  {
    title: "Meeting Summary",
    prompt: "Summarize the key points from our quarterly review meeting, including project updates, challenges, and next steps. Keep it concise and actionable.",
  }
];

const LoadingState = ({ message }: { message: string }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    p: 4
  }}>
    <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
    <Typography variant="h6" color="primary" gutterBottom>
      {message}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
      This might take a few moments as our AI carefully analyzes and enhances your prompt.
    </Typography>
  </Box>
);

// Update history data interfaces
interface SyntheticDataResult {
  content: string;
  score: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'synthetic' | 'comparison' | 'similar';
  model: string;
  template?: string;
  instructions?: string | null;
  batch_size?: number;
  results: SyntheticDataResult[];
  generation_time: number;
  is_cached?: boolean;
  cached_at?: string | null;
  statistics: {
    average_score: number;
    min_score: number;
    max_score: number;
  };
  reference_content?: string | null;
  prompts?: string[];
  raw_responses?: string[];
}

interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface HistoryData {
  analysis: HistoryItem[];
  comparison: HistoryItem[];
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>(ModelType.DEEPSEEK_CHAT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('analyze');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryData>({ analysis: [], comparison: [] });
  const [comparisonSessions, setComparisonSessions] = useState<{[key: string]: any}>({});
  const [userInstruction, setUserInstruction] = useState('');
  const [analyzeStartTime, setAnalyzeStartTime] = useState<number | null>(null);
  const [analyzeEndTime, setAnalyzeEndTime] = useState<number | null>(null);
  const [compareStartTime, setCompareStartTime] = useState<number | null>(null);
  const [compareEndTime, setCompareEndTime] = useState<number | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  const expandedDrawerWidth = 280;
  const collapsedDrawerWidth = 65;
  const drawerWidth = isDrawerExpanded ? expandedDrawerWidth : collapsedDrawerWidth;
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [selectedModels, setSelectedModels] = useState<ModelType[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [promptValidation, setPromptValidation] = useState<{
    isValid: boolean;
    message: string;
    variables?: string[];
  } | null>(null);
  const [evaluationPrompts, setEvaluationPrompts] = useState<EvaluationPrompt[]>([]);
  const [promptFetchError, setPromptFetchError] = useState<string | null>(null);
  const [comparisonPromptA, setComparisonPromptA] = useState('');
  const [comparisonPromptB, setComparisonPromptB] = useState('');

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel);
    setShowWarning(newModel !== ModelType.DEEPSEEK_CHAT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsGenerating(true);
    setError('');
    setAnalyzeStartTime(Date.now());
    try {
      const response = await analyzePrompt(prompt, model);
      console.log('Analysis response:', response);
      setAnalysis({
        ...response,
        original_prompt: prompt // Ensure original prompt is preserved
      });
      setAnalyzeEndTime(Date.now());
    } catch (error: any) {
      console.error('Error:', error);
      let errorMessage = 'Failed to analyze prompt. Please try again.';
      if (error.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0]?.msg || errorMessage
          : error.response.data.detail;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleCompare = async () => {
    if (!analysis) return;
    setLoading(true);
    setIsGenerating(true);
    setError('');
    setCompareStartTime(Date.now());
    try {
      // Log the analysis object and its type
      console.log('Analysis object type:', typeof analysis);
      console.log('Analysis object keys:', Object.keys(analysis));
      console.log('Full analysis object:', JSON.stringify(analysis, null, 2));
      console.log('Current prompt:', prompt);

      // Validate required fields before creating request
      if (!analysis.original_prompt && !prompt) {
        throw new Error('Missing original prompt');
      }
      if (!analysis.enhanced_prompt) {
        throw new Error('Missing enhanced prompt');
      }

      const requestBody = {
        analysis_result: {
          original_prompt: analysis.original_prompt || prompt,
          enhanced_prompt: analysis.enhanced_prompt,
          metrics: analysis.metrics,
          suggestions: analysis.suggestions,
          model_used: analysis.model_used  // Use the original model name
        },
        preferences: {
          model: model,  // Use the original model name
          style: "professional",
          tone: "neutral"
        }
      };

      // Detailed request validation logging
      console.log('Request validation:');
      console.log('- Original prompt length:', requestBody.analysis_result.original_prompt?.length);
      console.log('- Enhanced prompt length:', requestBody.analysis_result.enhanced_prompt?.length);
      console.log('- Has metrics:', !!requestBody.analysis_result.metrics);
      console.log('- Has suggestions:', !!requestBody.analysis_result.suggestions);
      console.log('- Model used:', requestBody.analysis_result.model_used);
      console.log('- Preferences model:', requestBody.preferences.model);
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8000/api/v1/prompts/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Detailed response logging
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response full data:', JSON.stringify(errorData, null, 2));
        console.error('Error response detail:', errorData.detail);
        
        // Log specific validation errors if they exist
        if (errorData.validation_errors) {
          console.error('Validation errors:', JSON.stringify(errorData.validation_errors, null, 2));
        }
        
        // Create a more descriptive error message
        const errorMessage = errorData.detail 
          ? `API Error: ${JSON.stringify(errorData.detail)}` 
          : errorData.validation_errors 
            ? `Validation Error: ${JSON.stringify(errorData.validation_errors)}`
            : 'Failed to compare prompts';
            
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Success response:', JSON.stringify(result, null, 2));
      
      // Cache the comparison result with a timestamp as key
      const timestamp = Date.now();
      setComparisonSessions(prev => ({
        ...prev,
        [timestamp]: result
      }));
      
      setComparison(result);
      setCompareEndTime(Date.now());
      setCurrentView('compare');
    } catch (error: any) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
      
      // Set a user-friendly error message
      setError(
        error.message && !error.message.includes('[object Object]')
          ? error.message
          : 'Failed to compare prompts. Please try again.'
      );
      setCurrentView('analyze');
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setPrompt('');
    setAnalysis(null);
    setComparison(null);
    setError('');
    setCurrentView('analyze');
    setIsGenerating(false);
    setUserInstruction('');
  };

  const loadHistory = async () => {
    try {
      console.log('Loading history...');
      const [analysisHistory, comparisonHistory] = await Promise.all([
        getAnalysisHistory(),  // Remove parameters as they're optional
        getComparisonHistory()  // Remove parameters as they're optional
      ]);
      
      console.log('Analysis history:', analysisHistory);
      console.log('Comparison history:', comparisonHistory);
      
      // Update historyData with the items from paginated response
      setHistoryData({
        analysis: analysisHistory.items || [],
        comparison: comparisonHistory.items || []
      });
      
      // Update comparisonSessions if needed
      if (comparisonHistory.items && comparisonHistory.items.length > 0) {
        const sessionsObject = comparisonHistory.items.reduce((acc: Record<string, HistoryItem>, comparison: HistoryItem) => {
          const timestamp = comparison.timestamp ? 
            new Date(comparison.timestamp).getTime() : 
            Date.now();
          acc[timestamp.toString()] = comparison;
          return acc;
        }, {});
        setComparisonSessions(sessionsObject);
      }
      
      console.log('History loaded:', { 
        analysisHistory: analysisHistory.items, 
        comparisonHistory: comparisonHistory.items, 
        historyDataUpdated: true 
      });
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load history. Please try again.');
    }
  };

  useEffect(() => {
    if (currentView === 'analysis-history' || currentView === 'comparison-history') {
      loadHistory();
    }
  }, [currentView]);

  const renderMetricsTable = (metrics: any) => {
    // Filter out error metrics if present
    const validMetrics = Object.entries(metrics).filter(([key]) => key !== 'error');
    
    return (
      <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Metric</strong></TableCell>
              <TableCell align="center"><strong>Score</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Suggestions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validMetrics.map(([key, value]: [string, any]) => (
              <TableRow key={key}>
                <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                  {key}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography 
                      sx={{ 
                        color: getScoreColor(value.score),
                        fontWeight: 'bold'
                      }}
                    >
                      {formatScore(value.score)}
                    </Typography>
                    <Tooltip title={`Score: ${formatScore(value.score)}`}>
                      <LinearProgress
                        variant="determinate"
                        value={value.score * 100}
                        sx={{
                          width: '80%',
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(value.score),
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>• {value.description}</TableCell>
                <TableCell>
                  <List dense disablePadding>
                    {value.suggestions.map((suggestion: string, idx: number) => (
                      <ListItem key={idx} dense disableGutters>
                        <ListItemText 
                          primary={
                            <Typography variant="body2">
                              • {suggestion}
                            </Typography>
                          } 
                        />
                      </ListItem>
                    ))}
                  </List>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMenu = () => (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1, px: 2 }}>
        <List>
          <ListItem sx={{ mb: 1, display: isDrawerExpanded ? 'block' : 'none' }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              Current Prompt
            </Typography>
          </ListItem>
          <ListItemButton
            selected={currentView === 'analyze'}
            onClick={() => setCurrentView('analyze')}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <AnalyticsIcon color={currentView === 'analyze' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Prompt Refinement" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'analyze' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>

          <ListItemButton
            selected={currentView === 'compare'}
            onClick={handleCompare}
            disabled={!analysis}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <CompareIcon color={currentView === 'compare' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Advanced Analytics on Refined Prompt" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'compare' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>

          {/* Evaluation Section */}
          <ListItem sx={{ mb: 1, mt: 2, display: isDrawerExpanded ? 'block' : 'none' }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              Evaluation
            </Typography>
          </ListItem>
          <ListItemButton
            selected={currentView === 'prompt-comparison'}
            onClick={() => setCurrentView('prompt-comparison')}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <CompareIcon color={currentView === 'prompt-comparison' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Prompt Comparison on Data" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'prompt-comparison' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>
          <ListItemButton
            selected={currentView === 'prompt-evaluation'}
            onClick={() => setCurrentView('prompt-evaluation')}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <AnalyticsIcon color={currentView === 'prompt-evaluation' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Prompt Evaluation" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'prompt-evaluation' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>

          {/* Synthetic Data Section */}
          <ListItem sx={{ mb: 1, mt: 2, display: isDrawerExpanded ? 'block' : 'none' }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              Synthetic Data
            </Typography>
          </ListItem>
          <ListItemButton
            onClick={() => setCurrentView('synthetic-data')}
            selected={currentView === 'synthetic-data'}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <DataObjectIcon color={currentView === 'synthetic-data' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="LLM Data Generation" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'synthetic-data' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>

          <Divider sx={{ my: 2, display: isDrawerExpanded ? 'block' : 'none' }} />
          
          <ListItem sx={{ mb: 1, display: isDrawerExpanded ? 'block' : 'none' }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              Historical Prompts
            </Typography>
          </ListItem>
          <ListItemButton
            selected={currentView === 'analysis-history'}
            onClick={() => setCurrentView('analysis-history')}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <DescriptionIcon color={currentView === 'analysis-history' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Analysis History" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'analysis-history' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>
          <ListItemButton
            selected={currentView === 'comparison-history'}
            onClick={() => setCurrentView('comparison-history')}
            sx={{
              borderRadius: 1,
              mb: 1,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{
              minWidth: 0,
              mr: isDrawerExpanded ? 3 : 'auto',
              justifyContent: 'center',
            }}>
              <CompareIcon color={currentView === 'comparison-history' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Comparison History" 
                sx={{ 
                  opacity: isDrawerExpanded ? 1 : 0,
                  '& .MuiTypography-root': { 
                    fontWeight: currentView === 'comparison-history' ? 600 : 400 
                  } 
                }}
              />
            )}
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );

  const parseMarkdown = (markdownContent: string): string => {
    if (!markdownContent) return '';
    
    // First handle the newlines
    let content = markdownContent.replace(/\\n/g, '\n');
    
    // Convert markdown to HTML
    content = content
      // Convert horizontal rules
      .replace(/\n---\n/g, '<hr/>')
      // Convert bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert newlines
      .replace(/\n/g, '<br/>');
    
    return content;
  };

  const renderComparisonView = () => {
    if (!comparison) return null;
    
    const typedComparison = comparison as ComparisonResult;
    
    return (
        <Box sx={{ p: 3 }}>
            {/* Header with actions */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
            }}>
                <Typography variant="h5">
                    Advanced Analytics on Refined Prompt
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigator.clipboard.writeText(typedComparison.enhanced_prompt.prompt)}
                        startIcon={<ContentCopyIcon />}
                    >
                        Copy Enhanced Prompt
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            setComparisonPromptA(typedComparison.original_prompt.prompt);
                            setComparisonPromptB(typedComparison.enhanced_prompt.prompt);
                            setCurrentView('prompt-comparison');
                        }}
                        startIcon={<CompareIcon />}
                    >
                        Compare on Data
                    </Button>
                </Box>
            </Box>
            
            {/* Side by side comparison */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Original Prompt */}
                <Grid item xs={6}>
                    <Paper 
                        elevation={1} 
                        sx={{ 
                            p: 3,
                            height: '100%',
                            backgroundColor: '#FFFFFF',
                            position: 'relative'
                        }}
                    >
                        <Typography variant="h6" gutterBottom color="primary">
                            Original Prompt
                        </Typography>
                        <Typography
                            sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                mt: 2
                            }}
                        >
                            {typedComparison.original_prompt.prompt}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Highlighted Version */}
                <Grid item xs={6}>
                    <Paper 
                        elevation={1} 
                        sx={{ 
                            p: 3,
                            height: '100%',
                            backgroundColor: '#FFFFFF',
                            position: 'relative'
                        }}
                    >
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Enhanced Version with Highlights
                            </Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 3, 
                                p: 2,
                                bgcolor: 'rgba(0, 0, 0, 0.02)',
                                borderRadius: 1,
                                border: '1px solid rgba(0, 0, 0, 0.08)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        bgcolor: '#00C851',
                                        borderRadius: '50%',
                                        opacity: 0.3
                                    }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                        New Content
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        bgcolor: '#9C27B0',
                                        borderRadius: '50%',
                                        opacity: 0.3
                                    }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                        Refined Content
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: typedComparison.enhanced_prompt.highlighted_prompt 
                            }}
                            style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                            }}
                            className="highlighted-content"
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Generate Again Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCompare}
                    disabled={isGenerating}
                    startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                    sx={{ minWidth: 200 }}
                >
                    Generate Again
                </Button>
            </Box>

            {/* Metrics Visualization */}
            <Paper sx={{ p: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Metrics Visualization
              </Typography>
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={Object.entries(typedComparison.original_prompt.metrics).map(([key, originalMetric]) => {
                      const enhancedMetric = typedComparison.enhanced_prompt.metrics[key] as Metric;
                      const originalMetricTyped = originalMetric as Metric;
                      return {
                        metric: key,
                        original: originalMetricTyped.score * 100,
                        enhanced: enhancedMetric.score * 100,
                      } as ChartMetric;
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="metric" 
                      interval={0}
                      tick={{ fill: '#666', fontSize: 14 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value: number) => `${value}%`}
                      label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <RechartsTooltip />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                    />
                    <Bar
                      dataKey="original"
                      fill="#82ca9d"
                      name="Original"
                      animationDuration={1500}
                    >
                      <LabelList
                        dataKey="original"
                        position="top"
                        formatter={(value: number) => `${value.toFixed(0)}%`}
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </Bar>
                    <Bar
                      dataKey="enhanced"
                      fill="#056DAE"
                      name="Enhanced"
                      animationDuration={1500}
                    >
                      <LabelList
                        dataKey="enhanced"
                        position="top"
                        formatter={(value: number) => `${value.toFixed(0)}%`}
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* Metrics comparison table */}
            <Paper sx={{ p: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Metrics Comparison
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Original Score</TableCell>
                      <TableCell align="center">Enhanced Score</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Suggestions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(typedComparison.original_prompt.metrics).map(([key, originalMetric]) => {
                      const enhancedMetric = typedComparison.enhanced_prompt.metrics[key] as Metric;
                      const originalMetricTyped = originalMetric as Metric;
                      const scoreImprovement = enhancedMetric.score - originalMetricTyped.score;
                      
                      return (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography>{(originalMetricTyped.score * 100).toFixed(0)}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography>
                                {(enhancedMetric.score * 100).toFixed(0)}%
                                {scoreImprovement > 0 && (
                                  <span style={{ color: 'green', marginLeft: '4px' }}>
                                    (+{(scoreImprovement * 100).toFixed(0)}%)
                                  </span>
                                )}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{enhancedMetric.description}</TableCell>
                          <TableCell>
                            <List dense>
                              {enhancedMetric.suggestions.map((suggestion, index) => (
                                <ListItem key={index}>
                                  <Typography>• {suggestion}</Typography>
                                </ListItem>
                              ))}
                            </List>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Bottom section with timing */}
            <Box sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: '1px solid rgba(0, 0, 0, 0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                Comparison Time: {compareStartTime && compareEndTime ? 
                  `${((compareEndTime - compareStartTime) / 1000).toFixed(2)} seconds` : 
                  'N/A'}
              </Typography>
            </Box>
        </Box>
    );
  };

  const renderAnalysisHistoryView = () => {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Analysis History {historyData?.analysis?.length ? `(${historyData.analysis.length} items)` : ''}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={loadHistory}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Results</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Generation Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData?.analysis?.length ? (
                historyData.analysis.map((item: HistoryItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 300 }}>
                        {item.results.map((result, idx) => (
                          <Tooltip key={idx} title={result.content}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {result.content}
                            </Typography>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {(item.statistics.average_score * 100).toFixed(0)}%
                        </Typography>
                        <Tooltip title={`Min: ${(item.statistics.min_score * 100).toFixed(0)}% | Max: ${(item.statistics.max_score * 100).toFixed(0)}%`}>
                          <InfoIcon fontSize="small" color="action" />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.generation_time.toFixed(2)}s
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setAnalysis({
                            ...item,
                            original_prompt: item.results[0]?.content || '',
                            enhanced_prompt: item.results[item.results.length - 1]?.content || '',
                            model_used: item.model
                          });
                          setCurrentView('analyze');
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No analysis history available yet.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderComparisonHistoryView = () => {
    console.log('Rendering comparison history view with data:', historyData);
    
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Comparison History {historyData?.comparison?.length ? `(${historyData.comparison.length} items)` : ''}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={loadHistory}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Original Prompt</TableCell>
                <TableCell>Enhanced Prompt</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData?.comparison?.length ? (
                historyData.comparison.map((item: HistoryItem) => {
                  const originalPrompt = item.results[0]?.content || 'N/A';
                  const enhancedPrompt = item.results[item.results.length - 1]?.content || 'N/A';
                  const averageScore = item.statistics.average_score;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell sx={{ 
                        maxWidth: 300,
                        '& .content': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }
                      }}>
                        <Tooltip title={originalPrompt}>
                          <Typography className="content" variant="body2">
                            {originalPrompt}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ 
                        maxWidth: 300,
                        '& .content': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }
                      }}>
                        <Tooltip title={enhancedPrompt}>
                          <Typography className="content" variant="body2">
                            {enhancedPrompt}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>
                            {(averageScore * 100).toFixed(0)}%
                          </Typography>
                          <Tooltip title={`Min: ${(item.statistics.min_score * 100).toFixed(0)}% | Max: ${(item.statistics.max_score * 100).toFixed(0)}%`}>
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setComparison({
                              original_prompt: {
                                prompt: originalPrompt,
                                metrics: {},
                                suggestions: []
                              },
                              enhanced_prompt: {
                                prompt: enhancedPrompt,
                                metrics: {},
                                suggestions: [],
                                highlighted_prompt: enhancedPrompt
                              },
                              model_used: item.model
                            });
                            setCurrentView('compare');
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No comparison history available yet.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const handleSamplePromptClick = (prompt: string) => {
    setPrompt(prompt);
  };

  const renderSamplePrompts = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
        Sample Prompts
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {SAMPLE_PROMPTS.map((sample, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              cursor: 'pointer',
              minWidth: 200,
              maxWidth: 300,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
                bgcolor: 'primary.light',
                color: 'white',
              },
            }}
            onClick={() => handleSamplePromptClick(sample.prompt)}
          >
            <Typography variant="subtitle2" gutterBottom>
              {sample.title}
            </Typography>
            <Typography variant="body2" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {sample.prompt}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );

  const renderAnalysisContent = () => {
    if (isGenerating) {
      return <LoadingState message="Refining your prompt..." />;
    }

    if (error) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setError('')}
            >
              Try Again
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleStartOver}
            >
              Start Over
            </Button>
          </Box>
        </Box>
      );
    }

    if (!analysis) {
      return (
        <>
          <Typography variant="h1" gutterBottom align="center" sx={{ mb: 4 }}>
              AI Prompt Enhancement
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
            Refine and enhance your prompts with AI-powered analysis
          </Typography>

          {/* Add sample prompts section */}
          {renderSamplePrompts()}

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                value={model}
                label="Model"
                onChange={(e) => handleModelChange(e.target.value as ModelType)}
              >
                <MenuItem value={ModelType.DEEPSEEK_CHAT}>Deepseek Chat</MenuItem>
                <MenuItem value={ModelType.OPENAI_GPT4}>OpenAI GPT-4</MenuItem>
                <MenuItem value={ModelType.OPENAI_GPT35}>OpenAI GPT-3.5 Turbo</MenuItem>
              </Select>
            </FormControl>

            {showWarning && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Some features may be limited with non-Deepseek models.
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              label="Enter your prompt"
              placeholder="Type or paste your prompt here..."
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !prompt.trim()}
                size="large"
                sx={{
                  minWidth: 200,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Analyze Prompt'
                )}
              </Button>
            </Box>
          </form>
        </>
      );
    }

    return (
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Analysis Results (Using {analysis.model_used}):
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleStartOver}
            startIcon={<RefreshIcon />}
          >
            Start Over
          </Button>
        </Box>

        {renderMetricsTable(analysis.metrics)}

        {/* Original Prompt Display */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Original Prompt:
          </Typography>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {analysis.original_prompt}
            </Typography>
          </Paper>
        </Box>

        {/* Metrics Visualization */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Metrics Visualization
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={Object.entries(analysis.metrics).map(([key, metric]) => {
                  const metricTyped = metric as Metric;
                  return {
                    metric: key,
                    score: metricTyped.score * 100
                  } as ChartMetric;
                })}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric" 
                  interval={0}
                  tick={{ fill: '#666', fontSize: 14 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip />
                <Bar
                  dataKey="score"
                  fill="#056DAE"
                  name="Score"
                  animationDuration={1500}
                >
                  <LabelList
                    dataKey="score"
                    position="top"
                    formatter={(value: number) => `${value.toFixed(0)}%`}
                    style={{ fill: '#056DAE', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Enhanced Prompt Section */}
        {analysis.enhanced_prompt && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Enhanced Version:
            </Typography>
            <Grid container spacing={3}>
              {/* Original Prompt */}
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Original Prompt
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {analysis.original_prompt}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Enhanced Prompt */}
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 3,
                    height: '100%',
                    bgcolor: '#f5f5f5'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Enhanced Prompt
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: analysis.highlighted_prompt || analysis.enhanced_prompt 
                    }}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}
                    className="highlighted-content"
                  />
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigator.clipboard.writeText(analysis.enhanced_prompt)}
              >
                Copy Enhanced Version
              </Button>
            </Box>
          </Box>
        )}

        {/* Bottom section with actions and timing */}
        <Box sx={{ 
          mt: 4, 
          pt: 3, 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Analysis Time: {analyzeStartTime && analyzeEndTime ? 
                `${((analyzeEndTime - analyzeStartTime) / 1000).toFixed(2)} seconds` : 
                'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleStartOver}
              startIcon={<RefreshIcon />}
            >
              Start New Analysis
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCompare}
              startIcon={<CompareIcon />}
            >
              Compare Results
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderPromptComparisonView = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Prompt Comparison on Data
        </Typography>
        
        {/* Prompt Input Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Prompt A
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={comparisonPromptA}
                onChange={(e) => setComparisonPromptA(e.target.value)}
                placeholder="Enter your first prompt here..."
                variant="outlined"
              />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Prompt B
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={comparisonPromptB}
                onChange={(e) => setComparisonPromptB(e.target.value)}
                placeholder="Enter your second prompt here..."
                variant="outlined"
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Data Upload Section */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Upload Test Data
          </Typography>
          <Box sx={{ 
            border: '2px dashed #ccc',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            mb: 2,
            bgcolor: '#fafafa'
          }}>
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button
                variant="outlined"
                component="span"
                sx={{ mb: 1 }}
              >
                Choose CSV File
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              or drag and drop your CSV file here
            </Typography>
          </Box>

          {/* CSV Preview Section */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Data Preview (First 5 rows)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Column 1</TableCell>
                    <TableCell>Column 2</TableCell>
                    <TableCell>Column 3</TableCell>
                    <TableCell>Column 4</TableCell>
                    <TableCell>Column 5</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Upload a CSV file to preview data
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>

        {/* Comparison Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ minWidth: 200 }}
          >
            Compare Prompts
          </Button>
        </Box>

        {/* Results Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Comparison Results
          </Typography>
          <Box sx={{ 
            bgcolor: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            minHeight: 200
          }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Results will appear here after comparison
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  };

  const fetchEvaluationPrompts = async () => {
    try {
      setPromptFetchError(null);
      const response = await fetch('http://localhost:8000/api/v1/evaluation/prompts');
      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.statusText}`);
      }
      const prompts = await response.json();
      setEvaluationPrompts(prompts);
    } catch (error) {
      console.error('Error fetching evaluation prompts:', error);
      setPromptFetchError('Failed to load evaluation prompts. Please try refreshing the page.');
    }
  };

  useEffect(() => {
    if (currentView === 'prompt-evaluation') {
      fetchEvaluationPrompts();
    }
  }, [currentView]);

  const renderPromptEvaluationView = () => {
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'text/csv') {
        setUploadedFile(file);
      }
    };

    const handlePromptSelect = (promptId: string) => {
      setSelectedPromptId(promptId);
      setIsCustomPrompt(false);
      // Reset validation when changing prompts
      setPromptValidation(null);
    };

    const handleCustomPromptToggle = () => {
      setIsCustomPrompt(true);
      setSelectedPromptId('');
      setPromptValidation(null);
    };

    const validatePrompt = async () => {
      const promptToValidate = isCustomPrompt ? customPrompt : 
        evaluationPrompts.find(p => p.id === selectedPromptId)?.prompt || '';

      try {
        const response = await fetch('http://localhost:8000/api/v1/prompts/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: promptToValidate,
            file: uploadedFile ? await uploadedFile.text() : null
          }),
        });

        const result = await response.json();
        setPromptValidation(result);
      } catch (error) {
        setPromptValidation({
          isValid: false,
          message: 'Failed to validate prompt. Please try again.'
        });
      }
    };

    const handleStartEvaluation = () => {
      // To be implemented in the next phase
      console.log('Starting evaluation...');
    };

    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          LLM-as-a-judge Evaluation
        </Typography>

        {promptFetchError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setPromptFetchError(null);
                  fetchEvaluationPrompts();
                }}
              >
                Retry
              </Button>
            }
          >
            {promptFetchError}
          </Alert>
        )}

        {/* Dataset Upload Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Dataset
          </Typography>
          <Box sx={{ mb: 2 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="csv-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<DescriptionIcon />}
              >
                Upload CSV File
              </Button>
            </label>
            {uploadedFile && (
              <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                File uploaded: {uploadedFile.name}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Prompt Selection Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Evaluation Prompt
          </Typography>
          
          {/* Pre-designed prompts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Pre-designed Prompts
            </Typography>
            <Grid container spacing={2}>
              {evaluationPrompts.map((prompt) => (
                <Grid item xs={12} md={4} key={prompt.id}>
                  <Paper
                    elevation={selectedPromptId === prompt.id ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedPromptId === prompt.id ? 2 : 1,
                      borderColor: selectedPromptId === prompt.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handlePromptSelect(prompt.id)}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {prompt.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {prompt.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Custom prompt option */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Custom Prompt
            </Typography>
            <Button
              variant={isCustomPrompt ? "contained" : "outlined"}
              onClick={handleCustomPromptToggle}
              sx={{ mb: 2 }}
            >
              Use Custom Prompt
            </Button>
            {isCustomPrompt && (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom prompt with variables in {variable_name} format"
                helperText="Example: Rate the sentiment of this review: {review_text}. Explain your rating."
              />
            )}
          </Box>
        </Paper>

        {/* Model Selection Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Models
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="models-select-label">Models</InputLabel>
            <Select
              labelId="models-select-label"
              multiple
              value={selectedModels}
              onChange={(e) => setSelectedModels(e.target.value as ModelType[])}
              renderValue={(selected) => selected.join(', ')}
            >
              <MenuItem value={ModelType.DEEPSEEK_CHAT}>Deepseek Chat</MenuItem>
              <MenuItem value={ModelType.OPENAI_GPT4}>OpenAI GPT-4</MenuItem>
              <MenuItem value={ModelType.OPENAI_GPT35}>OpenAI GPT-3.5 Turbo</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Validation and Start Button */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={validatePrompt}
            disabled={!uploadedFile || (!selectedPromptId && !customPrompt)}
          >
            Validate Setup
          </Button>
          <Button
            variant="contained"
            onClick={handleStartEvaluation}
            disabled={!promptValidation?.isValid}
          >
            Start Evaluation
          </Button>
        </Box>

        {/* Validation Results */}
        {promptValidation && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: promptValidation.isValid ? 'success.light' : 'error.light' }}>
            <Typography color={promptValidation.isValid ? 'success.dark' : 'error.dark'}>
              {promptValidation.message}
            </Typography>
            {promptValidation.variables && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Detected variables: {promptValidation.variables.join(', ')}
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    );
  };

  const renderErrorState = () => {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setError('')}
          >
            Try Again
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    if (isGenerating) {
      return <LoadingState message={currentView === 'analyze' ? "Refining your prompt..." : "Processing..."} />;
    }

    if (error) {
      return renderErrorState();
    }

    switch (currentView) {
      case 'analyze':
        return renderAnalysisContent();
      case 'compare':
        return renderComparisonView();
      case 'analysis-history':
        return renderAnalysisHistoryView();
      case 'comparison-history':
        return renderComparisonHistoryView();
      case 'prompt-comparison':
        return renderPromptComparisonView();
      case 'prompt-evaluation':
        return renderPromptEvaluationView();
      case 'synthetic-data':
        return <SyntheticDataGenerator />;
      default:
        return renderAnalysisContent();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'white',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
          }}
        >
          <Toolbar sx={{ 
            minHeight: '64px !important',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <IconButton
              onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
              sx={{
                color: 'primary.main',
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
              size="large"
            >
              {isDrawerExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main' }}>
              AI Prompt Enhancement
            </Typography>
          </Toolbar>
        </AppBar>

        {renderMenu()}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            mt: '64px',
            transition: 'margin-left 0.3s ease, width 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Container maxWidth="lg" sx={{ width: '100%' }}>
            {renderContent()}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 