import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'

function ReloadWarning({ open, onConfirm, onCancel }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="reload-warning-title"
      aria-describedby="reload-warning-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="reload-warning-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6" component="span">
          Warning: Test Will Reset
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="reload-warning-description" sx={{ fontSize: '16px', lineHeight: 1.6 }}>
          If you reload or leave this page, your test progress will be lost and you will need to restart the test from the beginning.
          <br />
          <br />
          <strong>Do you want to restart the test?</strong>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={onCancel} color="primary" variant="outlined" sx={{ minWidth: '100px' }}>
          No, Continue Test
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ minWidth: '100px' }}>
          Yes, Restart
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReloadWarning
