import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';

const formatTimestamp = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getAmountAtRevision = (entry) => {
  const amount = entry?.transaction?.amount
    ?? entry?.transactionDetails?.amount
    ?? entry?.transactionState?.amount;

  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'N/A';
  }

  return `$${Number(amount).toFixed(2)}`;
};

const getRevisionType = (entry) => {
  return entry?.revisionType || entry?.changeType || 'UNKNOWN';
};

const getTimestamp = (entry) => {
  return entry?.timestamp || entry?.changeDateTime;
};

const TransactionHistoryModal = ({ open, onClose, historyData }) => {
  const sortedHistory = [...(historyData || [])].sort(
    (a, b) => new Date(getTimestamp(b) || 0).getTime() - new Date(getTimestamp(a) || 0).getTime()
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Transaction History</DialogTitle>
      <DialogContent dividers>
        {sortedHistory.length === 0 ? (
          <Typography color="text.secondary">No history available.</Typography>
        ) : (
          <Timeline position="right" sx={{ p: 0, m: 0 }}>
            {sortedHistory.map((entry, index) => {
              const revisionType = getRevisionType(entry);
              const timestamp = getTimestamp(entry);

              return (
                <TimelineItem key={`${revisionType}-${timestamp || index}-${index}`}>
                  <TimelineOppositeContent sx={{ maxWidth: '220px', flex: 0.35 }} color="text.secondary">
                    {formatTimestamp(timestamp)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={revisionType === 'DELETE' ? 'error' : 'primary'} />
                    {index < sortedHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {revisionType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Amount: {getAmountAtRevision(entry)}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionHistoryModal;
