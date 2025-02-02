import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Tabs as AntTabs, 
  Modal, 
  Button, 
  Space, 
  Alert, 
  Table,
  Tag
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { AnalysisHistoryItem, ComparisonHistoryItem } from '../../types/history';
import { historyService } from '../../services/historyService';

const { TabPane } = AntTabs;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const HistoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | ComparisonHistoryItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'analysis') {
        const result = await historyService.getAnalysisHistory();
        if (Array.isArray(result)) {
          setAnalysisHistory(result);
        } else {
          setError('Invalid data format received from server');
        }
      } else if (activeTab === 'comparison') {
        const result = await historyService.getComparisonHistory();
        if (Array.isArray(result)) {
          setComparisonHistory(result);
        } else {
          setError('Invalid data format received from server');
        }
      }
    } catch (error) {
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setActiveTab(['analysis', 'comparison'][newValue] as 'analysis' | 'comparison');
  };

  return (
    <Paper sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Analysis History" />
          <Tab label="Comparison History" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Card>
          {error && <Alert message={error} type="error" />}
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table
              dataSource={analysisHistory}
              columns={[
                {
                  title: 'Timestamp',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp: string) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss'),
                },
                // ... other columns
              ]}
            />
          )}
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Card>
          {error && <Alert message={error} type="error" />}
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table
              dataSource={comparisonHistory}
              columns={[
                {
                  title: 'Timestamp',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp: string) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss'),
                },
                // ... other columns
              ]}
            />
          )}
        </Card>
      </TabPanel>

      <Modal
        title="History Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {/* Modal content */}
      </Modal>
    </Paper>
  );
};

export default HistoryView; 