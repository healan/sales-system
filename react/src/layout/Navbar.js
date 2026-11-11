import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';


const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: '#263447',
  color: '#f4f6f8',
  boxShadow: '0 2px 12px rgba(25, 39, 56, 0.12)',
}));

export default function NavBarContent() {

  return (
  <>
    <AppBar position="absolute" elevation={0}>
    <Toolbar sx={{ minHeight: '68px !important', position: 'relative', justifyContent: 'center' }}>
      <Typography
          component="h1"
          variant="subtitle1"
          sx={{ color: 'inherit', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center' }}
          noWrap
        >
          Product Sales Information System
      </Typography>
    </Toolbar>
  </AppBar>
  </>
  );
}
