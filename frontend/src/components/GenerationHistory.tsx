import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  Collapse,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Pagination,
  Alert,
  DialogActions,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

export interface GenerationRecord {
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

export interface GenerationHistoryProps {
  onSelectRecord: (record: GenerationRecord) => void;
  onCopyContent: (content: string) => void;
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 10;

const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  onSelectRecord,
  onCopyContent,
  onDelete,
}) => {
  const [open, setOpen] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<GenerationRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [filterModel, setFilterModel] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [refreshInterval, setRefreshInterval] = React.useState<number>(30000); // 30 seconds
  const [showFilters, setShowFilters] = React.useState(false);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/v1/synthetic-data/history?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setRecords(data);
      setTotalRecords(data.length); // Update when backend provides total count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Initial fetch and refresh interval
  React.useEffect(() => {
    fetchHistory();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchHistory, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHistory, refreshInterval]);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/synthetic-data/history/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      
      // Refresh the list
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/v1/synthetic-data/history', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear history');
      }
      
      // Refresh the list
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  const filteredRecords = React.useMemo(() => {
    return records
      .filter(record => {
        if (filterModel !== 'all' && record.model !== filterModel) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            record.template.toLowerCase().includes(query) ||
            record.data.some(r => r.content.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }, [records, filterModel, searchQuery, sortOrder]);

  return (
    <>
      <Tooltip title="View Generation History">
        <IconButton onClick={() => setOpen(true)} color="primary">
          <HistoryIcon />
        </IconButton>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Generation History</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Toggle Filters">
                <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={fetchHistory} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Chip 
                label={`${totalRecords} Records`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={filterModel}
                    label="Model"
                    onChange={(e) => setFilterModel(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort Order"
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <MenuItem value="desc">Newest First</MenuItem>
                    <MenuItem value="asc">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in templates and results..."
              />
            </Box>
          </Collapse>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Records List */}
          <List>
            {filteredRecords.map((record) => (
              <React.Fragment key={record.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(record.timestamp).toLocaleString()}
                      </Typography>
                      {record.is_cached && (
                        <Chip 
                          label="Cached" 
                          size="small" 
                          variant="outlined" 
                          color="info"
                        />
                      )}
                      {record.reference_content && (
                        <Chip 
                          label="Similar" 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${record.data.length} items`} 
                        size="small" 
                        variant="outlined"
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleExpand(record.id)}
                      >
                        {expandedId === record.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => handleDelete(record.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={expandedId === record.id} sx={{ width: '100%' }}>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Model: {record.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Template: {record.template}
                      </Typography>
                      {record.reference_content && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Reference: {record.reference_content}
                        </Typography>
                      )}
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Results:
                      </Typography>
                      <List dense>
                        {record.data.map((result, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={result.content}
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => onCopyContent(result.content)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onSelectRecord(record)}
                        >
                          Use as Template
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={Math.ceil(totalRecords / PAGE_SIZE)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            color="error"
            onClick={handleClearHistory}
            disabled={loading || records.length === 0}
          >
            Clear All History
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GenerationHistory;