import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import * as api from '../services/api';

jest.mock('../services/api');
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe('TransactionList', () => {
  const mockTransactions = [
    { id: 1, description: 'Coffee', amount: 3.50, date: '2024-04-10', category: 'Food' },
    { id: 2, description: 'Taxi', amount: 12.75, date: '2024-04-09', category: 'Transport' },
    { id: 3, description: 'Groceries', amount: 45.20, date: '2024-04-08', category: 'Shopping' },
  ];

  beforeEach(() => {
    api.getTransactions.mockResolvedValue(mockTransactions);
    api.getTotalSum.mockResolvedValue(61.45);
    api.getFilteredTransactions.mockResolvedValue(mockTransactions);
    api.deleteTransaction.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders three transaction rows in the table', async () => {
    const { container } = render(<Dashboard />);
    const tbody = await waitFor(() => container.querySelector('tbody'));

    expect(tbody).toBeInTheDocument();
    const rows = within(tbody).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  test('clicking a Delete button calls deleteTransaction API function', async () => {
    render(<Dashboard />);
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteTransaction).toHaveBeenCalledWith(1);
    });
  });
});
