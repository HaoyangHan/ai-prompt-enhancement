import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { analyzePrompt, getAnalysisHistory, getComparisonHistory, ModelType } from './config/api';
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
} from 'recharts';

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
type ViewType = 'analyze' | 'compare' | 'analysis-history' | 'comparison-history' | 'prompt-comparison' | 'prompt-evaluation';

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

function App() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<ModelType>(ModelType.DEEPSEEK_CHAT);
  const [showWarning, setShowWarning] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('analyze');
  const [comparison, setComparison] = useState<any>(null);
  const [userInstruction, setUserInstruction] = useState('');
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  const expandedDrawerWidth = 280;
  const collapsedDrawerWidth = 65;
  const drawerWidth = isDrawerExpanded ? expandedDrawerWidth : collapsedDrawerWidth;
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyzeStartTime, setAnalyzeStartTime] = useState<number | null>(null);
  const [analyzeEndTime, setAnalyzeEndTime] = useState<number | null>(null);
  const [compareStartTime, setCompareStartTime] = useState<number | null>(null);
  const [compareEndTime, setCompareEndTime] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<{
    analysis: any[];
    comparison: any[];
  }>({
    analysis: [],
    comparison: []
  });
  const [comparisonSessions, setComparisonSessions] = useState<{[key: string]: any}>({});
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
      setAnalysis(response);
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
      // Log the raw analysis data
      console.log('Raw analysis data:', analysis);

      // Format the analysis result to match the expected structure
      const formattedAnalysis = {
        metrics: analysis.metrics,
        suggestions: analysis.suggestions,
        original_prompt: analysis.original_prompt || prompt,
        enhanced_prompt: analysis.enhanced_prompt
      };

      // Log the formatted data
      console.log('Formatted analysis data:', JSON.stringify(formattedAnalysis, null, 2));

      const requestBody = {
        analysis_result: formattedAnalysis,
        preferences: {
          model: model,
          style: "professional",
          tone: "neutral"
        }
      };

      // Log the complete request body
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://localhost:8000/api/v1/prompts/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Log the response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        throw new Error(errorData.detail || 'Failed to compare prompts');
      }
      
      const result = await response.json();
      console.log('Successful response data:', result);
      
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
      });
      setError(error.message || 'Failed to compare prompts. Please try again.');
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
      const [analysisHistory, comparisonHistory] = await Promise.all([
        getAnalysisHistory(),
        getComparisonHistory()
      ]);
      
      setHistoryData({
        analysis: analysisHistory,
        comparison: comparisonHistory
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">
                    Advanced Analytics on Refined Prompt
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCompare}
                    disabled={isGenerating}
                    startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    Generate Again
                </Button>
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
                            }}
                        >
                            {typedComparison.original_prompt.prompt}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Enhanced Prompt with Plain Text and Markdown */}
                <Grid item xs={6}>
                    <Paper 
                        elevation={1} 
                        sx={{ 
                            p: 3,
                            height: '100%',
                            backgroundColor: '#FFFFFF',
                        }}
                    >
                        <Typography variant="h6" gutterBottom color="primary">
                            Enhanced Prompt
                        </Typography>
                        
                        {/* Plain text version */}
                        <Typography
                            sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                mb: 3,
                            }}
                        >
                            {typedComparison.enhanced_prompt.prompt}
                        </Typography>

                        <Divider sx={{ my: 3 }} />
                        
                        <Typography variant="h6" gutterBottom color="primary">
                            Highlighted Version
                        </Typography>
                        
                        {/* Highlighted version */}
                        <Typography
                            component="div"
                            dangerouslySetInnerHTML={{ 
                                __html: parseMarkdown(typedComparison.enhanced_prompt.highlighted_prompt)
                            }}
                            sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.6,
                                '& strong': {
                                    fontWeight: 600,
                                    backgroundColor: '#E6FFE6',
                                    padding: '0 4px',
                                    borderRadius: '2px',
                                },
                                '& em': {
                                    fontStyle: 'italic',
                                    backgroundColor: '#F8E6FF',
                                    padding: '0 4px',
                                    borderRadius: '2px',
                                },
                                '& hr': {
                                    margin: '16px 0',
                                    border: 'none',
                                    height: '1px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                },
                                '& br': {
                                    display: 'block',
                                    content: '""',
                                    marginBottom: '0.5em',
                                }
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Radar Chart */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Metrics Visualization
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <RadarChart data={Object.entries(typedComparison.original_prompt.metrics).map(([key, originalMetric]) => {
                            const enhancedMetric = typedComparison.enhanced_prompt.metrics[key];
                            return {
                                metric: key,
                                original: originalMetric.score * 100,
                                enhanced: enhancedMetric.score * 100,
                            };
                        })}>
                            <PolarGrid />
                            <PolarAngleAxis 
                                dataKey="metric" 
                                tick={{ fill: '#056DAE', fontSize: 14 }}
                                style={{ textTransform: 'capitalize' }}
                            />
                            <PolarRadiusAxis 
                                angle={90} 
                                domain={[0, 100]} 
                                tick={{ fill: '#666' }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Radar
                                name="Original"
                                dataKey="original"
                                stroke="#ff4444"
                                fill="#ff4444"
                                fillOpacity={0.3}
                            />
                            <Radar
                                name="Enhanced"
                                dataKey="enhanced"
                                stroke="#00C851"
                                fill="#00C851"
                                fillOpacity={0.3}
                            />
                            <Legend />
                        </RadarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* Metrics comparison table */}
            <Typography variant="h6" gutterBottom>
                Metrics Comparison
            </Typography>
            <TableContainer component={Paper}>
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
                            const enhancedMetric = typedComparison.enhanced_prompt.metrics[key];
                            const scoreImprovement = enhancedMetric.score - originalMetric.score;
                            
                            return (
                                <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography>{(originalMetric.score * 100).toFixed(0)}%</Typography>
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

            {/* Highlighted prompt section */}
            {typedComparison.enhanced_prompt.highlighted_prompt && (
                <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                        Highlighted Changes
                    </Typography>
                    <Paper sx={{ 
                        p: 3,
                        bgcolor: '#FAFAFA',
                        '& ins': {
                            backgroundColor: '#E6FFE6',
                            textDecoration: 'none',
                            padding: '2px 0',
                        },
                        '& del': {
                            backgroundColor: '#FFE6E6',
                            textDecoration: 'line-through',
                            padding: '2px 0',
                        },
                        '& p': {
                            margin: '8px 0',
                            lineHeight: 1.6,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }
                    }}>
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: typedComparison.enhanced_prompt.highlighted_prompt 
                            }}
                        />
                    </Paper>
                </>
            )}

            {/* Timing information */}
            <Box sx={{ mt: 4, opacity: 0.7 }}>
                <Typography variant="body2" color="textSecondary">
                    Analysis Time: {analyzeStartTime && analyzeEndTime ? 
                      `${((analyzeEndTime - analyzeStartTime) / 1000).toFixed(2)} seconds` : 
                      'N/A'}
                    {' | '}
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
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Analysis History</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Original Prompt</TableCell>
                <TableCell>Enhanced Prompt</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.analysis.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.original_prompt}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.enhanced_prompt}
                  </TableCell>
                  <TableCell>{item.model_used}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setAnalysis(item);
                        setCurrentView('analyze');
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderComparisonHistoryView = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Comparison History</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Original Prompt</TableCell>
                <TableCell>Enhanced Prompt</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.comparison.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.original_prompt.prompt}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.enhanced_prompt.prompt}
                  </TableCell>
                  <TableCell>{item.model_used}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setComparison(item);
                        setCurrentView('compare');
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                <MenuItem value={ModelType.DEEPSEEK_REASONER}>Deepseek Reasoner</MenuItem>
              </Select>
            </FormControl>

            {showWarning && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                This model is currently not available. Only Deepseek Chat is supported at the moment.
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
        <Typography variant="h6" gutterBottom>
          Analysis Results (Using {analysis.model_used}):
        </Typography>

        {renderMetricsTable(analysis.metrics)}

        {/* Overall Suggestions */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Overall Suggestions:
        </Typography>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            bgcolor: '#F8F9FA',
            borderColor: 'primary.main',
            borderWidth: 1
          }}
        >
          <List dense>
            {analysis.suggestions.map((suggestion: string, index: number) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={
                    <Typography variant="body1">
                      • {suggestion}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Enhanced Prompt Section */}
        {analysis.enhanced_prompt && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Enhanced Version:
            </Typography>
            <Grid container spacing={2}>
              {/* Rendered Markdown */}
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    bgcolor: 'background.paper',
                    '& pre': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Rendered Markdown
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ReactMarkdown>
                    {analysis.enhanced_prompt}
                  </ReactMarkdown>
                </Paper>
              </Grid>
              
              {/* Source Markdown */}
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 3,
                    height: '100%',
                    bgcolor: '#f5f5f5'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Source Markdown
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    value={analysis.enhanced_prompt}
                    InputProps={{ 
                      readOnly: true,
                      sx: { 
                        fontFamily: 'monospace',
                        bgcolor: 'background.paper'
                      }
                    }}
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
                Copy Source
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  const tempElement = document.createElement('div');
                  tempElement.innerHTML = analysis.enhanced_prompt;
                  navigator.clipboard.writeText(tempElement.textContent || '');
                }}
              >
                Copy Plain Text
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderPromptComparisonView = () => {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Prompt Comparison on Data
        </Typography>
        {/* Content will be added later */}
        <Typography variant="body1" color="text.secondary">
          Coming soon: Compare multiple prompts and analyze their effectiveness using data-driven metrics.
        </Typography>
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
              <MenuItem value={ModelType.DEEPSEEK_REASONER}>Deepseek Reasoner</MenuItem>
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