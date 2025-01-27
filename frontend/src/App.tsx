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
  Divider
} from '@mui/material';
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

function App() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<ModelType>(ModelType.DEEPSEEK_CHAT);
  const [showWarning, setShowWarning] = useState(false);

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel);
    setShowWarning(newModel !== ModelType.DEEPSEEK_CHAT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await analyzePrompt(prompt, model);
      setAnalysis(response);
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
    }
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI Prompt Enhancement
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
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

              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {typeof error === 'string' ? error : 'An error occurred while analyzing the prompt. Please try again.'}
                </Typography>
              )}

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

            {analysis && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Analysis Results (Using {analysis.model_used}):
                </Typography>

                {/* Render metrics table */}
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
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 