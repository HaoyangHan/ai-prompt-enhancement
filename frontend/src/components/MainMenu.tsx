import React from 'react';
import {
  Box,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { GenerationRecord } from './GenerationHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface MainMenuProps {
  historyCount: number;
  onClearHistory: () => void;
  onShowHistory: () => void;
  onShowStats: () => void;
  recentRecords?: GenerationRecord[];
}

const MainMenu: React.FC<MainMenuProps> = ({
  historyCount = 0,
  onClearHistory,
  onShowHistory,
  onShowStats,
  recentRecords = [],
}) => {
  // Ensure recentRecords is always a valid array, even during updates
  const records = React.useMemo(() => {
    if (!Array.isArray(recentRecords)) return [];
    return recentRecords.filter(record => record && typeof record === 'object');
  }, [recentRecords]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShowHistory = () => {
    handleClose();
    onShowHistory();
  };

  const handleShowStats = () => {
    handleClose();
    onShowStats();
  };

  const handleClearHistory = () => {
    handleClose();
    onClearHistory();
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} color="primary">
        <Badge badgeContent={historyCount} color="error">
          <MenuIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleShowHistory}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShowStats}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generation Stats</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDialog}>
          <ListItemIcon>
            <StorageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recent Activity</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClearHistory}>
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Clear History</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Recent Generations" />
              <Tab label="Settings" />
            </Tabs>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {records.length > 0 ? (
                records.slice(0, 5).map((record) => (
                  <Paper key={record.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {record.timestamp && new Date(record.timestamp).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Badge 
                          badgeContent={Array.isArray(record.data) ? record.data.length : 0} 
                          color="primary"
                          sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
                        >
                          <StorageIcon fontSize="small" />
                        </Badge>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {record.template && record.template.substring(0, 100)}...
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No recent generations
                </Typography>
              )}
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  History Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure history retention and display preferences
                </Typography>
              </Paper>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainMenu; 