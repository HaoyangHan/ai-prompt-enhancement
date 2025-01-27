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
  Alert
} from '@mui/material';
import { analyzePrompt, ModelType } from './config/api';

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

function App() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState<ModelType>(ModelType.DEEPSEEK_V3);
  const [showWarning, setShowWarning] = useState(false);

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel);
    setShowWarning(newModel !== ModelType.DEEPSEEK_V3);
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
      setError(error.response?.data?.detail || 'Failed to analyze prompt. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  <MenuItem value={ModelType.DEEPSEEK_V3}>Deepseek v3</MenuItem>
                  <MenuItem value={ModelType.GPT_4}>GPT-4</MenuItem>
                  <MenuItem value={ModelType.CLAUDE_3_SONNET}>Claude 3 Sonnet</MenuItem>
                </Select>
              </FormControl>

              {showWarning && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  This model is currently not available. Only Deepseek v3 is supported at the moment.
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
                  {error}
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
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    bgcolor: '#F8F9FA',
                    borderColor: 'primary.main',
                    borderWidth: 1
                  }}
                >
                  <List>
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                  
                  {analysis.enhanced_prompt && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Enhanced Version:
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={analysis.enhanced_prompt}
                        InputProps={{ 
                          readOnly: true,
                          sx: { 
                            bgcolor: 'background.paper',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'transparent'
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 2 }}
                        onClick={() => navigator.clipboard.writeText(analysis.enhanced_prompt)}
                      >
                        Copy to Clipboard
                      </Button>
                    </>
                  )}
                </Paper>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 