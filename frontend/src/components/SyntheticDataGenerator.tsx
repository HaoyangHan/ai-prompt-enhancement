import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  useTheme,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  IconButton,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  LinearProgress,
  TablePagination,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CachedIcon from '@mui/icons-material/Cached';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { ModelType } from '../config/api';
import CircularProgress from '@mui/material/CircularProgress';
import SimilarContentGenerator from './SimilarContentGenerator';
import HistoryView from './History/HistoryView';

const SAMPLE_DATA = [
  {
    title: "Nvidia Market Analysis",
    template: `Nvidia has become the world's most valuable company, with a $3.3 trillion market cap, fueled by soaring demand for its AI-focused GPUs. The stock's 170% year-to-date surge reflects its dominance in powering generative AI tools like ChatGPT and data centers. A recent 10-for-1 stock split boosted retail investor participation, while record-breaking earnings ($26 billion Q1 revenue) underscored its growth. However, challenges loom: competitors like AMD and tech giants developing in-house chips, regulatory scrutiny over antitrust concerns, and reliance on China's market amid trade tensions. CEO Jensen Huang envisions a $10 trillion AI infrastructure build-out, with Nvidia's Blackwell GPUs poised to accelerate innovation. Despite bullish sentiment, skeptics warn of overvaluation and execution risks. Nvidia's trajectory symbolizes both AI's transformative potential and the volatility of market hype.`,
    instructions: `The article adopts a journalistic, authoritative tone characteristic of *The New York Times*, blending factual rigor with narrative engagement. It balances technical financial details (e.g., market cap, stock splits) with vivid metaphors ("creating the wave") to demystify complex concepts. Subheadings structure the narrative into thematic segments, while quotes from analysts and executives add credibility and human perspective. The prose maintains objectivity, presenting both bullish and bearish viewpoints to reflect market complexities. A forward-looking angle emphasizes Nvidia's strategic moves (e.g., Blackwell GPUs, partnerships) while cautioning about risks (regulation, competition). The style is concise yet descriptive, leveraging data points and historical context to contextualize Nvidia's rise. The closing disclaimer reinforces journalistic ethics, and the headline's use of "meteoric" captures urgency, aligning with NYT's knack for impactful yet measured storytelling.`,
  },
  {
    title: "Bloomberg Style Analysis",
    template: `Nvidia has become the world's most valuable company, with a $3.3 trillion market cap, fueled by soaring demand for its AI-focused GPUs. The stock's 170% year-to-date surge reflects its dominance in powering generative AI tools like ChatGPT and data centers. A recent 10-for-1 stock split boosted retail investor participation, while record-breaking earnings ($26 billion Q1 revenue) underscored its growth. However, challenges loom: competitors like AMD and tech giants developing in-house chips, regulatory scrutiny over antitrust concerns, and reliance on China's market amid trade tensions. CEO Jensen Huang envisions a $10 trillion AI infrastructure build-out, with Nvidia's Blackwell GPUs poised to accelerate innovation. Despite bullish sentiment, skeptics warn of overvaluation and execution risks. Nvidia's trajectory symbolizes both AI's transformative potential and the volatility of market hype.`,
    instructions: `Write in Bloomberg's signature style: data-driven, market-focused, and technically precise. Use bullet points for key metrics, include relevant market indices and competitor comparisons. Emphasize quantitative analysis and expert commentary from market analysts. Structure should follow Bloomberg's format with clear section breaks for Market Impact, Technical Analysis, and Future Outlook. Include relevant trading multiples and industry benchmarks. Maintain Bloomberg's neutral, analytical tone while providing actionable insights for investors.`,
  },
  {
    title: "WSJ Opinion Style",
    template: `Nvidia has become the world's most valuable company, with a $3.3 trillion market cap, fueled by soaring demand for its AI-focused GPUs. The stock's 170% year-to-date surge reflects its dominance in powering generative AI tools like ChatGPT and data centers. A recent 10-for-1 stock split boosted retail investor participation, while record-breaking earnings ($26 billion Q1 revenue) underscored its growth. However, challenges loom: competitors like AMD and tech giants developing in-house chips, regulatory scrutiny over antitrust concerns, and reliance on China's market amid trade tensions. CEO Jensen Huang envisions a $10 trillion AI infrastructure build-out, with Nvidia's Blackwell GPUs poised to accelerate innovation. Despite bullish sentiment, skeptics warn of overvaluation and execution risks. Nvidia's trajectory symbolizes both AI's transformative potential and the volatility of market hype.`,
    instructions: `Write in the Wall Street Journal's opinion style: authoritative, thought-provoking, and slightly contrarian. Take a clear stance while acknowledging counterarguments. Use sophisticated vocabulary and complex sentence structures. Include historical market parallels and broader economic implications. Focus on policy impacts and market philosophy. Maintain WSJ's conservative-leaning economic perspective while engaging with multiple viewpoints. End with a strong concluding statement that challenges conventional wisdom.`,
  }
];

const predefinedBatchSizes = [5, 10, 20, 50, 100];

interface GenerationStep {
  referenceContent: string;
  generatedContent: any;
  instructions: string;
}

interface LocalGenerationRecord {
  id: string;
  timestamp: string;
  template: string;
  model: string;
  data: any[];
  generation_time: number;
  is_cached?: boolean;
  cached_at?: string | null;
  reference_content?: string;
  type?: 'synthetic' | 'similar';
  instructions?: string;
}

const SyntheticDataGenerator: React.FC = () => {
  const theme = useTheme();
  const [sampleData, setSampleData] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showSamples, setShowSamples] = useState(true);
  const [selectedBatchSize, setSelectedBatchSize] = useState<string>('1');
  const [customBatchSize, setCustomBatchSize] = useState<string>('');
  const [model, setModel] = useState<ModelType>(ModelType.DEEPSEEK_CHAT);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(7);
  const [cachedSelections, setCachedSelections] = useState<{ [key: string]: Set<number> }>({});
  const [selectedForRegeneration, setSelectedForRegeneration] = useState<number | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [expandedSampleBox, setExpandedSampleBox] = useState(false);
  const [expandedInstructionsBox, setExpandedInstructionsBox] = useState(false);

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel);
    setShowWarning(newModel !== ModelType.DEEPSEEK_CHAT);
  };

  const addToHistory = (data: any[], type: 'synthetic' | 'similar', referenceContent?: string) => {
    const record: LocalGenerationRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      model,
      template: sampleData,
      instructions: additionalInstructions,
      reference_content: referenceContent,
      data: data.map(item => ({
        content: item.content,
        score: item.score
      })),
      generation_time: 0,
      is_cached: false
    };

    // Load existing history
    const savedHistory = localStorage.getItem('generationHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    // Add new record
    history.unshift(record);
    
    // Keep only last 100 records
    if (history.length > 100) {
      history.pop();
    }
    
    // Save back to localStorage
    localStorage.setItem('generationHistory', JSON.stringify(history));
  };

  const handleGenerate = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      setRegenerating(true);
    } else {
      setLoading(true);
      setIsGenerating(true);
      setGeneratedData(null);
      setSelectedItems(new Set());
    }
    setError(null);

    const batchSize = customBatchSize ? parseInt(customBatchSize) : parseInt(selectedBatchSize || '1');

    try {
      const response = await fetch('http://localhost:8000/api/v1/synthetic-data/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: sampleData,
          additional_instructions: additionalInstructions,
          batch_size: batchSize,
          model: model,
          force_refresh: true // Always force refresh when generating
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate data');
      }

      const result = await response.json();
      
      // Ensure consistent format for display
      const formattedData = result.generated_data.map((item: any) => ({
        content: item.content || '',
        score: typeof item.score === 'number' ? item.score : 0
      }));
      
      setGeneratedData(formattedData);
      
      // Add to history
      addToHistory(formattedData, 'synthetic');
      
      // Show cache status if result is from cache
      if (result.is_cached) {
        setError(`Using cached result from ${new Date(result.cached_at).toLocaleString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate data');
    } finally {
      setLoading(false);
      setIsGenerating(false);
      setRegenerating(false);
    }
  };

  const handleSampleClick = (sample: typeof SAMPLE_DATA[0]) => {
    setSampleData(sample.template);
    setAdditionalInstructions(sample.instructions);
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

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && generatedData) {
      setSelectedItems(new Set(generatedData.map((_, index) => index)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (selectedItems.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleDownloadCSV = () => {
    if (!generatedData) return;

    const selectedData = Array.from(selectedItems).map(index => {
      const item = generatedData[index];
      // If item is a string, wrap it in an object with content field
      return typeof item === 'string' ? { content: item } : item;
    });
    const csvContent = convertToCSV(selectedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'generated_data.csv';
    link.click();
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    // Get all unique keys from all objects
    const headers = Array.from(new Set(
      data.flatMap(obj => Object.keys(obj))
    ));
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    data.forEach(obj => {
      const row = headers.map(header => {
        const value = obj[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  // Cache key generation function
  const generateCacheKey = (data: any[]) => {
    return JSON.stringify(data.map(item => 
      typeof item === 'string' ? item : item.content
    ));
  };

  // Load cached selections when data changes
  useEffect(() => {
    if (generatedData) {
      const cacheKey = generateCacheKey(generatedData);
      const cached = cachedSelections[cacheKey];
      if (cached) {
        setSelectedItems(cached);
      } else {
        setSelectedItems(new Set());
      }
    }
  }, [generatedData]);

  // Update cache when selections change
  useEffect(() => {
    if (generatedData) {
      const cacheKey = generateCacheKey(generatedData);
      setCachedSelections(prev => ({
        ...prev,
        [cacheKey]: selectedItems
      }));
    }
  }, [selectedItems]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleGenerateLikeThis = (index: number) => {
    if (!generatedData) return;
    
    const selectedItem = generatedData[index];
    
    // Add new generation step
    setGenerationSteps(prev => [
      ...prev,
      {
        referenceContent: selectedItem.content,
        generatedContent: null,
        instructions: additionalInstructions
      }
    ]);
    
    // Add to history before navigating
    addToHistory([selectedItem], 'similar', selectedItem.content);
    
    // Navigate to the new step
    setCurrentStep(generationSteps.length);
  };

  const handleBackToMain = () => {
    setCurrentStep(null);
  };

  const handleHistorySelect = (record: LocalGenerationRecord) => {
    setSampleData(record.template);
    setAdditionalInstructions(record.instructions || '');
    if (record.type === 'similar' && record.reference_content) {
      handleGenerateLikeThis(0);
    }
  };

  const handleHistoryDelete = (id: string) => {
    const savedHistory = localStorage.getItem('generationHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory).filter((record: LocalGenerationRecord) => record.id !== id);
      localStorage.setItem('generationHistory', JSON.stringify(history));
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Load history records
  const getHistoryRecords = () => {
    const savedHistory = localStorage.getItem('generationHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('generationHistory');
      setError('History cleared successfully');
    }
  };

  // Render the appropriate view based on current step
  if (currentStep !== null) {
    return (
      <SimilarContentGenerator
        referenceContent={generationSteps[currentStep].referenceContent}
        baseTemplate={sampleData}
        baseInstructions={generationSteps[currentStep].instructions}
        model={model}
        onBack={handleBackToMain}
        generationNumber={currentStep + 1}
      />
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" color="primary">
            LLM Data Generation
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setShowSamples(!showSamples)} size="small">
              {showSamples ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Model Selection */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
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
            <Alert severity="warning" sx={{ mt: 2 }}>
              Some features may be limited with non-Deepseek models.
            </Alert>
          )}
        </Box>

        {/* Sample Templates Section */}
        <Collapse in={showSamples}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Sample Templates
              <Tooltip title="Click on any template to use it as a starting point">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2 }}>
              {SAMPLE_DATA.map((sample, index) => (
                <Card 
                  key={index}
                  sx={{ 
                    minWidth: 300,
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onClick={() => handleSampleClick(sample)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {sample.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      height: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {sample.template}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
          <Divider sx={{ mb: 4 }} />
        </Collapse>

        {/* Main Input Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Data Sample
              <Tooltip title="Use {variable_name} for dynamic values">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            <IconButton 
              onClick={() => setExpandedSampleBox(!expandedSampleBox)} 
              size="small"
            >
              {expandedSampleBox ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={expandedSampleBox ? 8 : 4}
            value={sampleData}
            onChange={(e) => setSampleData(e.target.value)}
            placeholder="Enter your data sample here..."
            variant="outlined"
            sx={{
              transition: 'all 0.3s ease',
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
              }
            }}
          />
        </Box>

        {/* Writing Style Instructions */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Writing Style
            </Typography>
            <IconButton 
              onClick={() => setExpandedInstructionsBox(!expandedInstructionsBox)} 
              size="small"
            >
              {expandedInstructionsBox ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={expandedInstructionsBox ? 8 : 4}
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Enter writing style instructions or constraints..."
            variant="outlined"
            sx={{
              transition: 'all 0.3s ease',
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
              }
            }}
          />
        </Box>

        {/* Generation Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Batch Size Selection */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Number of Variations
              <Tooltip title="How many different versions to generate">
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
                    <Tooltip title="Clear custom number">
                      <IconButton
                        onClick={() => setCustomBatchSize('')}
                        edge="end"
                        size="small"
                      >
                        ×
                      </IconButton>
                    </Tooltip>
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

          {/* Generate Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={loading && !generatedData ? <CircularProgress size={20} /> : <AutorenewIcon />}
              onClick={() => handleGenerate(false)}
              color="primary"
              disabled={loading || regenerating || !sampleData.trim()}
              size="large"
              sx={{ minWidth: 200 }}
            >
              Generate {(customBatchSize || selectedBatchSize || '1')} {
                (customBatchSize || selectedBatchSize || '1') === '1' ? 'Version' : 'Versions'
              }
            </Button>
            {generatedData && (
              <Button
                variant="outlined"
                startIcon={regenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={() => handleGenerate(true)}
                disabled={loading || regenerating}
                size="large"
              >
                Regenerate
              </Button>
            )}
          </Box>
        </Box>

        {/* Error/Info Display */}
        {error && (
          <Alert 
            severity={error.includes('cached result') ? 'info' : 'error'} 
            sx={{ mt: 3 }}
            icon={error.includes('cached result') ? <CachedIcon /> : undefined}
          >
            {error}
          </Alert>
        )}

        {/* Loading States */}
        {(isGenerating || regenerating) && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {regenerating ? 'Regenerating Data...' : 'Generating Data...'}
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Results Display */}
        {generatedData && !regenerating && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Generated Data ({generatedData.length} items)
                {error?.includes('cached result') && (
                  <Tooltip title={error}>
                    <CachedIcon color="action" fontSize="small" />
                  </Tooltip>
                )}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadCSV}
                  disabled={selectedItems.size === 0}
                >
                  Download Selected ({selectedItems.size})
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedItems.size > 0 && selectedItems.size < generatedData.length}
                        checked={selectedItems.size === generatedData.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Content</TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      <Tooltip title="Quality score (0-1)">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          Score
                          <InfoIcon fontSize="small" color="action" />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(generatedData || [])
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => {
                      const actualIndex = page * rowsPerPage + index;
                      // Parse the content and score properly
                      const content = typeof item === 'string' ? item : (item?.content || '');
                      const score = typeof item === 'number' ? item : (typeof item?.score === 'number' ? item.score : 0);
                      const isGeneratingLikeThis = selectedForRegeneration === actualIndex;
                      
                      return (
                        <TableRow
                          key={actualIndex}
                          hover
                          selected={selectedItems.has(actualIndex)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox 
                              checked={selectedItems.has(actualIndex)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(actualIndex);
                              }}
                            />
                          </TableCell>
                          <TableCell>{actualIndex + 1}</TableCell>
                          <TableCell 
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              maxWidth: '500px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: 'monospace',
                              '& .highlight': {
                                backgroundColor: theme.palette.action.selected,
                              }
                            }}
                            onClick={() => handleSelectItem(actualIndex)}
                          >
                            {content}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'flex-end',
                              gap: 1 
                            }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={score * 100}
                                sx={{ 
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: theme.palette.grey[200],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: score >= 0.7 
                                      ? theme.palette.success.main
                                      : score >= 0.4 
                                        ? theme.palette.warning.main
                                        : theme.palette.error.main,
                                    borderRadius: 3,
                                  }
                                }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {(score * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title={isGeneratingLikeThis ? "Generating..." : "Generate similar content"}>
                                <span>
                                  <IconButton 
                                    onClick={() => handleGenerateLikeThis(actualIndex)}
                                    disabled={selectedForRegeneration !== null}
                                    color="primary"
                                    sx={{
                                      position: 'relative',
                                      '&.Mui-disabled': {
                                        backgroundColor: isGeneratingLikeThis ? theme.palette.action.selected : 'transparent'
                                      }
                                    }}
                                  >
                                    {isGeneratingLikeThis ? (
                                      <CircularProgress 
                                        size={20} 
                                        sx={{ 
                                          position: 'absolute',
                                          color: theme.palette.primary.main
                                        }}
                                      />
                                    ) : (
                                      <ContentCopyIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={generatedData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[7]}
            />
          </Box>
        )}

        {/* History Dialog */}
        {showHistoryDialog && (
          <Dialog 
            open={showHistoryDialog} 
            onClose={() => setShowHistoryDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Generation History</DialogTitle>
            <DialogContent>
              <HistoryView />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        )}
      </Paper>
    </Box>
  );
};

export default SyntheticDataGenerator; 