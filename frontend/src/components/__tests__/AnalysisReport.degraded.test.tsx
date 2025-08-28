import { render, screen } from '@testing-library/react';
import AnalysisReport from '../../components/AnalysisReport';

const baseReport: any = {
  competitiveness: { strengths: 's', weaknesses: 'w', summary: 'sum' },
  school_recommendations: { recommendations: [], analysis_summary: 'no data' },
  similar_cases: [],
  background_improvement: null,
  radar_scores: [0,0,0,0,0],
};

describe('AnalysisReport degraded rendering', () => {
  it('shows degraded alert and lists partial_failures', () => {
    render(
      <AnalysisReport
        report={{ ...baseReport, degraded: true, partial_failures: { case_1: 'boom' } }}
        onBackToForm={() => {}}
      />
    );
    expect(screen.getByText('部分结果生成失败，已返回可用部分')).toBeInTheDocument();
    expect(screen.getByText('case_1:')).toBeInTheDocument();
  });

  it('shows empty-state alerts when no recommendations or cases', () => {
    render(
      <AnalysisReport
        report={{ ...baseReport, degraded: false }}
        onBackToForm={() => {}}
      />
    );
    expect(screen.getByText('未找到相似案例，返回空推荐列表')).toBeInTheDocument();
    expect(screen.getByText('没有可用的相似案例解析')).toBeInTheDocument();
  });
});

















