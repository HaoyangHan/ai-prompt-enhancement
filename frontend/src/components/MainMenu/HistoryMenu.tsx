import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Drawer,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Compare as CompareIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import NewHistoryView from '../History/NewHistoryView';

interface HistoryMenuProps {
  analysisCount?: number;
  comparisonCount?: number;
}

const HistoryMenu: React.FC<HistoryMenuProps> = ({
  analysisCount = 0,
  comparisonCount = 0,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<'analysis' | 'comparison'>('analysis');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenHistory = (type: 'analysis' | 'comparison') => {
    setSelectedView(type);
    setIsDrawerOpen(true);
    handleClose();
  };

  const totalCount = analysisCount + comparisonCount;

  return (
    <>
      <Tooltip title="History">
        <IconButton
          onClick={handleClick}
          size="large"
          sx={{ ml: 2 }}
        >
          <Badge badgeContent={totalCount} color="primary">
            <HistoryIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              py: 1,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleOpenHistory('analysis')}>
          <ListItemIcon>
            <Badge badgeContent={analysisCount} color="primary">
              <AnalyticsIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Analysis History"
            secondary="View past prompt analyses"
          />
        </MenuItem>
        <MenuItem onClick={() => handleOpenHistory('comparison')}>
          <ListItemIcon>
            <Badge badgeContent={comparisonCount} color="primary">
              <CompareIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Comparison History"
            secondary="View past prompt comparisons"
          />
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '1200px',
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 2,
            }}
          >
            <Typography variant="h6">
              {selectedView === 'analysis' ? 'Analysis History' : 'Comparison History'}
            </Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <NewHistoryView />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default HistoryMenu; 