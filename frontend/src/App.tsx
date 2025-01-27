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
  CircularProgress
} from '@mui/material';
import axios from 'axios';

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
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/v1/enhance', { prompt });
      setEnhancedPrompt(response.data.enhanced_prompt);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to enhance prompt. Please try again.');
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
              Auto Prompt Refinement
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h1" gutterBottom align="center" sx={{ mb: 4 }}>
              Auto Prompt Refinement
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              Enhance your prompts with AI-powered refinement for better results
            </Typography>

            <form onSubmit={handleSubmit}>
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
                    'Refine Prompt'
                  )}
                </Button>
              </Box>
            </form>

            {enhancedPrompt && (
              <Box sx={{ mt: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Enhanced Prompt:
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
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={enhancedPrompt}
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
                    onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                  >
                    Copy to Clipboard
                  </Button>
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