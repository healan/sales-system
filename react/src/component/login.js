import React, { useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import NavBarContent from '../layout/Navbar.js';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { URL } from '../config.js';
export default function Login(){
    const mdTheme = createTheme({
        palette: {
            primary: { main: '#344a63', dark: '#263447', contrastText: '#ffffff' },
            background: { default: '#f5f7fb', paper: '#ffffff' },
        },
        shape: { borderRadius: 9 },
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError('');
        setLoading(true);
        try {
            const response = await axios.post(`${URL}/api/login/`, {
                username: data.get('id'),
                password: data.get('password'),
            });
            if (response.data.authenticated) navigate('/home');
            else setError('Invalid username or password.');
        } catch (requestError) {
            setError(requestError.response?.status === 401
                ? 'Invalid username or password.'
                : 'Could not reach the sign-in service. Check that the server is running.');
        } finally {
            setLoading(false);
        }
      };
    return (  
        <>
        <ThemeProvider theme={mdTheme}>
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <NavBarContent />
            <Box component="main" className="login-main">
              <Toolbar sx={{ minHeight: '68px !important' }} />
              <Container maxWidth="sm" className="login-container">
                    <Box className="login-card">
                      <div className="login-heading">
                        <span className="login-mark">PS</span>
                        <span className="login-eyebrow">PRODUCT SALES SYSTEM</span>
                        <h1>Sign in</h1>
                        <p>Sign in to view your product sales dashboard.</p>
                      </div>
                      <Box component="form" noValidate onSubmit={handleSubmit} className="login-form">
                        <TextField
                            required
                            fullWidth
                            id="id"
                            label="Username"
                            name="id"
                            autoComplete="id"
                            autoFocus
                            className="login-field"
                        />
                        <TextField
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            className="login-field"
                        />
                        {error && <div className="login-error" role="alert">{error}</div>}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            className="login-submit"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                      </Box>
                    </Box>
              </Container>
            </Box>
          </Box>
        </ThemeProvider>
        </>
      );
};
