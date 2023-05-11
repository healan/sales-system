import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import NavBarContent from '../layout/Navbar.js';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';

export default function Home(){
    const mdTheme = createTheme();
    const navigate = useNavigate();

    return (  
        <>
        <ThemeProvider theme={mdTheme}>
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <NavBarContent />
            <Box
              component="main"
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[900],
                flexGrow: 1,
                height: '100vh',
                overflow: 'auto',
              }}
            >
              <Toolbar />
              <Container maxWidth="lg" sx={{ mt:10, mb: 4,  width:500 }}>
              <Box sx={{ mt: 1,}}>
                        <Button
                              size='large'
                              fullWidth
                              height="50"
                              variant="contained"
                              sx={{ mt: 3, mb: 2 }}
                              onClick={()=>{navigate('/sales')}}
                            >
                            판매량 입력
                        </Button>
                        <Button
                            size='large'
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={()=>{navigate('/profit')}}
                        >
                            매출/이익 확인
                        </Button>
                        <Button
                            size='large'
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={()=>{navigate('/product')}}
                        >
                            제품 정보 입력
                        </Button>
                        <Button
                            size='large'
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={()=>{navigate('/')}}
                        >
                            로그아웃
                        </Button>
                    </Box>
             </Container>    
            </Box>
          </Box>
        </ThemeProvider>
        </>
      );
};