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
import { USER } from '../config.js';
export default function Login(){
    const mdTheme = createTheme();
    const navigate = useNavigate();
    
    const handleSubmit = (event) => {
        event.preventDefault(); 
        const data = new FormData(event.currentTarget);
        const loginData = {
          id: data.get('id'),
          password: data.get('password'),
        };
       
        if (loginData.id == USER.id && loginData.password == USER.pw){
            navigate('/home');
        }else{
            alert('로그인 정보를 다시 확인하여주세요.')
        };
      };
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
              <Container maxWidth="lg" sx={{ mt:20, mb: 4,  width:500 }}>   
                    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1,}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="id"
                            label="아이디"
                            name="id"
                            autoComplete="id"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="비밀번호"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            로그인
                        </Button>
                    </Box>
             </Container>    
            </Box>
          </Box>
        </ThemeProvider>
        </>
      );
};