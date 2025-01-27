import { useState } from 'react';
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
} from '@mui/icons-material';
import { analyzePrompt, ModelType } from './config/api';
import ReactMarkdown from 'react-markdown';

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
type ViewType = 'analyze' | 'compare';

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
  const drawerWidth = 240;
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyzeStartTime, setAnalyzeStartTime] = useState<number | null>(null);
  const [analyzeEndTime, setAnalyzeEndTime] = useState<number | null>(null);
  const [compareStartTime, setCompareStartTime] = useState<number | null>(null);
  const [compareEndTime, setCompareEndTime] = useState<number | null>(null);

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
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }} />
      <Box sx={{ overflow: 'auto', mt: 1, px: 2 }}>
        <List>
          <ListItem sx={{ mb: 1 }}>
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
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon>
              <AnalyticsIcon color={currentView === 'analyze' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Analyze" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontWeight: currentView === 'analyze' ? 600 : 400 
                } 
              }}
            />
            {currentView === 'analyze' && <ChevronRightIcon color="secondary" />}
          </ListItemButton>
          <ListItemButton
            selected={currentView === 'compare'}
            onClick={handleCompare}
            disabled={!analysis}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon>
              <CompareIcon color={currentView === 'compare' ? 'secondary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Comparison" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontWeight: currentView === 'compare' ? 600 : 400 
                } 
              }}
            />
            {currentView === 'compare' && <ChevronRightIcon color="secondary" />}
          </ListItemButton>
          <Divider sx={{ my: 2 }} />
          <ListItem sx={{ mb: 1 }}>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
              Historical Prompts
            </Typography>
          </ListItem>
          <ListItemButton 
            disabled
            sx={{
              borderRadius: 1,
              opacity: 0.6,
            }}
          >
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>
            <ListItemText primary="Coming Soon" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );

  const renderComparisonView = () => {
    if (!comparison || !comparison.original_prompt || !comparison.enhanced_prompt) {
      return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Generating comparison...
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Prompt Comparison Results
        </Typography>

        {/* Side by Side Prompts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Original Prompt
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                {comparison.original_prompt.prompt}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Enhanced Prompt
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                {comparison.enhanced_prompt.prompt}
              </Box>
              {comparison.enhanced_prompt.comparison && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Comparison Analysis
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <ReactMarkdown>
                      {comparison.enhanced_prompt.comparison}
                    </ReactMarkdown>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Metrics Comparison Table */}
        <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell align="center"><strong>Original Score</strong></TableCell>
                <TableCell align="center"><strong>Enhanced Score</strong></TableCell>
                <TableCell><strong>Improvements</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparison.original_prompt.metrics && Object.entries(comparison.original_prompt.metrics).map(([key, originalMetric]: [string, any]) => {
                const enhancedMetric = comparison.enhanced_prompt.metrics?.[key];
                if (!enhancedMetric) return null;
                
                return (
                  <TableRow key={key}>
                    <TableCell component="th" scope="row" sx={{ textTransform: 'capitalize' }}>
                      {key}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography sx={{ color: getScoreColor(originalMetric.score), fontWeight: 'bold' }}>
                          {formatScore(originalMetric.score)}
                        </Typography>
                        <Tooltip title={`Score: ${formatScore(originalMetric.score)}`}>
                          <LinearProgress
                            variant="determinate"
                            value={originalMetric.score * 100}
                            sx={{
                              width: '80%',
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getScoreColor(originalMetric.score),
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography sx={{ color: getScoreColor(enhancedMetric.score), fontWeight: 'bold' }}>
                          {formatScore(enhancedMetric.score)}
                        </Typography>
                        <Tooltip title={`Score: ${formatScore(enhancedMetric.score)}`}>
                          <LinearProgress
                            variant="determinate"
                            value={enhancedMetric.score * 100}
                            sx={{
                              width: '80%',
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getScoreColor(enhancedMetric.score),
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <List dense disablePadding>
                        {enhancedMetric.suggestions?.map((suggestion: string, idx: number) => (
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Comparison Text */}
        {comparison.enhanced_prompt.comparison && (
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Detailed Comparison
            </Typography>
            <Box sx={{ mt: 2 }}>
              <ReactMarkdown>
                {comparison.enhanced_prompt.comparison}
              </ReactMarkdown>
            </Box>
          </Paper>
        )}

        {/* Timing Information */}
        <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="body2" color="text.secondary">
            Analysis Time: {analyzeStartTime && analyzeEndTime ? 
              `${((analyzeEndTime - analyzeStartTime) / 1000).toFixed(2)} seconds` : 
              'N/A'}
            {' | '}
            Comparison Time: {compareStartTime && compareEndTime ? 
              `${((compareEndTime - compareStartTime) / 1000).toFixed(2)} seconds` : 
              'N/A'}
          </Typography>
        </Paper>

        {/* User Instructions Input */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Instructions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={userInstruction}
            onChange={(e) => setUserInstruction(e.target.value)}
            label="Enter additional instructions for comparison"
            placeholder="Add any specific aspects you'd like to compare or analyze..."
            variant="outlined"
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={!userInstruction.trim()}
            sx={{ mt: 2 }}
            onClick={() => {
              // TODO: Handle user instructions
              console.log('User instructions:', userInstruction);
            }}
          >
            Apply Instructions
          </Button>
        </Paper>
      </Box>
    );
  };

  const renderAnalysisContent = () => {
    if (isGenerating) {
      return <LoadingState message="Analyzing your prompt..." />;
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
            Enhance your prompts with AI-powered analysis and suggestions
          </Typography>

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

  const renderComparisonContent = () => {
    if (isGenerating) {
      return <LoadingState message="Generating comparison..." />;
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
              onClick={() => {
                setError('');
                setCurrentView('analyze');
              }}
            >
              Back to Analysis
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

    return renderComparisonView();
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
          <Toolbar sx={{ minHeight: '64px !important' }}>
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
            mt: '64px'
          }}
        >
          {currentView === 'analyze' ? (
            <Container maxWidth="lg" sx={{ py: 2 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2, md: 4 }, 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
                }}
              >
                {renderAnalysisContent()}
              </Paper>
            </Container>
          ) : (
            <Container maxWidth="lg" sx={{ py: 2 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2, md: 4 }, 
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
                }}
              >
                {renderComparisonContent()}
              </Paper>
            </Container>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 