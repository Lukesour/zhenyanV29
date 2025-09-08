import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

const ProblemChild: React.FC = () => {
  throw new Error('Network error: failed to fetch');
};

describe('ErrorBoundary', () => {
  test('should render localized error and recovery actions', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    // Message should be localized title
    expect(screen.getByText(/网络|Network|网络连接异常|Network error/)).toBeInTheDocument();
    // Should render at least one recovery button or provide default reload
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});


