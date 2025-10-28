export const attendanceStyles = {
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    marginBottom: '16px'
  },
  modalIcon: {
    marginRight: '8px',
    fontSize: '20px'
  },
  modalBody: {
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto' as const,
  },
  confirmIcon: {
    marginRight: '8px',
    fontSize: '20px',
    color: '#52c41a'
  },
  mainIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  message: {
    marginBottom: '16px',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  infoContainer: {
    backgroundColor: '#fff2e8',
    border: '1px solid #ffcc7a',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
    textAlign: 'left' as const
  },
  infoText: {
    color: '#d46b08'
  }
} as const;