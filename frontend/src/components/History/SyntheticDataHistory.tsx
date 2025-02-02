import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Tag as TagIcon,
  Note as NoteIcon,
  History as HistoryIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface SyntheticDataHistoryInput {
  template: string;
  model: string;
  batch_size: number;
  additional_instructions?: string;
  reference_content?: string;
}

interface SyntheticDataHistoryOutput {
  generated_items: Array<{
    content: string;
    index: number;
    timestamp: string;
  }>;
  generation_time: number;
  is_cached: boolean;
  cached_at?: string;
}

interface SyntheticDataHistoryEntry {
  id: string;
  timestamp: string;
  session_id?: string;
  input: SyntheticDataHistoryInput;
  output: SyntheticDataHistoryOutput;
  type: 'synthetic' | 'similar';
  tags: string[];
  notes?: string;
}

interface HistoryRowProps {
  entry: SyntheticDataHistoryEntry;
  onDelete: (id: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

const HistoryRow: React.FC<HistoryRowProps> = ({ entry, onDelete, onUpdateTags, onUpdateNotes }) => {
  const [open, setOpen] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newNotes, setNewNotes] = useState(entry.notes || '');

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...entry.tags, newTag.trim()];
      onUpdateTags(entry.id, updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = entry.tags.filter(tag => tag !== tagToRemove);
    onUpdateTags(entry.id, updatedTags);
  };

  const handleSaveNotes = () => {
    onUpdateNotes(entry.id, newNotes);
    setEditingNotes(false);
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
        <TableCell>{entry.input.model}</TableCell>
        <TableCell>{entry.type}</TableCell>
        <TableCell>{entry.input.batch_size}</TableCell>
        <TableCell>{entry.output.generation_time.toFixed(2)}s</TableCell>
        <TableCell>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => onDelete(entry.id)}>
              <DeleteIcon />
            </IconButton>
            <IconButton size="small" onClick={() => setEditingTags(true)}>
              <TagIcon />
            </IconButton>
            <IconButton size="small" onClick={() => setEditingNotes(true)}>
              <NoteIcon />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Generation Details
              </Typography>
              
              {/* Tags Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {entry.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>

              {/* Notes Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.notes || 'No notes added'}
                </Typography>
              </Box>

              {/* Template Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Template
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, backgroundColor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {entry.input.template}
                  </Typography>
                </Paper>
              </Box>

              {/* Additional Instructions */}
              {entry.input.additional_instructions && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Additional Instructions
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {entry.input.additional_instructions}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Generated Items */}
              <Typography variant="subtitle2" gutterBottom>
                Generated Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Content</TableCell>
                      <TableCell>Generated At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entry.output.generated_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.index + 1}</TableCell>
                        <TableCell sx={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>
                          {item.content}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.timestamp), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyContent(item.content)}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Edit Tags Dialog */}
      <Dialog open={editingTags} onClose={() => setEditingTags(false)}>
        <DialogTitle>Edit Tags</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add new tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Box sx={{ mt: 2 }}>
              {entry.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTags(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Notes Dialog */}
      <Dialog open={editingNotes} onClose={() => setEditingNotes(false)}>
        <DialogTitle>Edit Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingNotes(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const SyntheticDataHistory: React.FC = () => {
  const [entries, setEntries] = useState<SyntheticDataHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/synthetic-data/history');
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/synthetic-data/history/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEntries(entries.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/synthetic-data/history/${id}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });
      
      if (response.ok) {
        setEntries(entries.map(entry =>
          entry.id === id ? { ...entry, tags } : entry
        ));
      } else {
        console.error('Error updating tags:', await response.text());
      }
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/synthetic-data/history/${id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (response.ok) {
        setEntries(entries.map(entry =>
          entry.id === id ? { ...entry, notes } : entry
        ));
      } else {
        console.error('Error updating notes:', await response.text());
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Synthetic Data Generation History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Timestamp</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Batch Size</TableCell>
              <TableCell>Generation Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onUpdateTags={handleUpdateTags}
                onUpdateNotes={handleUpdateNotes}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SyntheticDataHistory; 