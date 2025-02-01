import React, { useState, useEffect } from 'react';
import { HistoryState, AnalysisHistoryItem, ComparisonHistoryItem } from '../../types/history';
import { historyService } from '../../services/historyService';
import { Card, Tabs, Table, Alert, Modal, Button, Typography, Tag, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const HistoryView: React.FC = () => {
  console.log('HistoryView Component Mounted');

  // State
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | ComparisonHistoryItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load history data
  const loadHistory = async () => {
    console.log('🔄 Loading history for tab:', activeTab);
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'analysis') {
        const result = await historyService.getAnalysisHistory();
        console.log('📊 Analysis History Data:', result);
        if (result && Array.isArray(result.items)) {
          setAnalysisHistory(result.items);
        } else {
          console.error('Invalid analysis history data format:', result);
          setError('Invalid data format received from server');
        }
      } else {
        const result = await historyService.getComparisonHistory();
        console.log('🔄 Comparison History Data:', result);
        if (result && Array.isArray(result.items)) {
          setComparisonHistory(result.items);
        } else {
          console.error('Invalid comparison history data format:', result);
          setError('Invalid data format received from server');
        }
      }
    } catch (error) {
      console.error('❌ Error loading history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Tab changed, loading new data for:', activeTab);
    loadHistory();
  }, [activeTab]);

  // Handle view details
  const handleViewDetails = (record: AnalysisHistoryItem | ComparisonHistoryItem) => {
    console.log('👁️ Viewing details for record:', record);
    setSelectedItem(record);
    setIsModalVisible(true);
  };

  // Column definitions
  const analysisColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => text ? format(new Date(text), 'MMM d, yyyy HH:mm:ss') : 'N/A',
      width: 180,
    },
    {
      title: 'Original Prompt',
      dataIndex: 'original_prompt',
      key: 'original_prompt',
      ellipsis: true,
    },
    {
      title: 'Score',
      dataIndex: 'overall_score',
      key: 'overall_score',
      render: (score: number) => score !== undefined ? (
        <Tag color={score >= 0.7 ? 'success' : score >= 0.4 ? 'warning' : 'error'}>
          {Math.round(score * 100)}%
        </Tag>
      ) : 'N/A',
      width: 100,
    },
    {
      title: 'Model',
      dataIndex: 'model_used',
      key: 'model_used',
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: AnalysisHistoryItem) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          Details
        </Button>
      ),
      width: 100,
    },
  ];

  const comparisonColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => text ? format(new Date(text), 'MMM d, yyyy HH:mm:ss') : 'N/A',
      width: 180,
    },
    {
      title: 'Original Prompt',
      dataIndex: 'original_prompt',
      key: 'original_prompt',
      ellipsis: true,
    },
    {
      title: 'Improvement',
      dataIndex: ['comparison_metrics', 'improvement_score'],
      key: 'improvement',
      render: (score: number) => score !== undefined ? (
        <Tag color={score >= 0.7 ? 'success' : score >= 0.4 ? 'warning' : 'error'}>
          {Math.round(score * 100)}%
        </Tag>
      ) : 'N/A',
      width: 100,
    },
    {
      title: 'Model',
      dataIndex: 'model_used',
      key: 'model_used',
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ComparisonHistoryItem) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          Details
        </Button>
      ),
      width: 100,
    },
  ];

  // Render details modal content
  const renderModalContent = () => {
    if (!selectedItem) return null;

    const isAnalysis = 'metrics' in selectedItem;
    console.log('Rendering modal for item:', selectedItem, 'isAnalysis:', isAnalysis);

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>Time</Title>
          <Text>{selectedItem.timestamp ? format(new Date(selectedItem.timestamp), 'PPpp') : 'N/A'}</Text>
        </div>

        <div>
          <Title level={5}>Original Prompt</Title>
          <Text>{selectedItem.original_prompt || 'N/A'}</Text>
        </div>

        <div>
          <Title level={5}>Enhanced Prompt</Title>
          <Text>{selectedItem.enhanced_prompt || 'N/A'}</Text>
        </div>

        {isAnalysis ? (
          <>
            <div>
              <Title level={5}>Overall Score</Title>
              <Tag color={selectedItem.overall_score >= 0.7 ? 'success' : selectedItem.overall_score >= 0.4 ? 'warning' : 'error'}>
                {Math.round((selectedItem.overall_score || 0) * 100)}%
              </Tag>
            </div>
            <div>
              <Title level={5}>Metrics</Title>
              {Object.entries(selectedItem.metrics || {}).map(([key, value]) => (
                <Card size="small" title={key} style={{ marginBottom: 8 }} key={key}>
                  <p>Score: {Math.round((value.score || 0) * 100)}%</p>
                  <p>{value.description || 'No description'}</p>
                  <ul>
                    {(value.suggestions || []).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div>
              <Title level={5}>Improvement Score</Title>
              <Tag color={selectedItem.comparison_metrics?.improvement_score >= 0.7 ? 'success' : selectedItem.comparison_metrics?.improvement_score >= 0.4 ? 'warning' : 'error'}>
                {Math.round((selectedItem.comparison_metrics?.improvement_score || 0) * 100)}%
              </Tag>
            </div>
            <div>
              <Title level={5}>Key Differences</Title>
              <ul>
                {(selectedItem.comparison_metrics?.key_differences || []).map((diff, index) => (
                  <li key={index}>{diff}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Space>
    );
  };

  return (
    <Card>
      {(() => {
        console.log('=== RENDERING ===', {
          activeTab,
          isLoading,
          hasError: !!error,
          analysisCount: analysisHistory.length,
          comparisonCount: comparisonHistory.length
        });
        return null;
      })()}
      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          console.log('📑 Tab changed to:', key);
          setActiveTab(key as 'analysis' | 'comparison');
        }}
        tabBarExtraContent={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              loadHistory();
            }}
            loading={isLoading}
          >
            Refresh
          </Button>
        }
      >
        <TabPane tab="Analysis History" key="analysis">
          {error ? (
            <Alert
              message={error}
              type="error"
              action={
                <Button size="small" onClick={loadHistory}>
                  Retry
                </Button>
              }
            />
          ) : (
            <Table
              dataSource={analysisHistory}
              columns={analysisColumns}
              rowKey={(record) => record.id || Math.random().toString()}
              loading={isLoading}
              pagination={false}
              scroll={{ x: true }}
              locale={{
                emptyText: 'No analysis history available'
              }}
            />
          )}
        </TabPane>
        <TabPane tab="Comparison History" key="comparison">
          {error ? (
            <Alert
              message={error}
              type="error"
              action={
                <Button size="small" onClick={loadHistory}>
                  Retry
                </Button>
              }
            />
          ) : (
            <Table
              dataSource={comparisonHistory}
              columns={comparisonColumns}
              rowKey={(record) => record.id || Math.random().toString()}
              loading={isLoading}
              pagination={false}
              scroll={{ x: true }}
              locale={{
                emptyText: 'No comparison history available'
              }}
            />
          )}
        </TabPane>
      </Tabs>

      <Modal
        title={`${selectedItem && 'metrics' in selectedItem ? 'Analysis' : 'Comparison'} Details`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {renderModalContent()}
      </Modal>
    </Card>
  );
};

export default HistoryView; 