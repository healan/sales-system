import React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import NavBarContent from '../layout/Navbar.js';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { DataGrid} from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useRecoilState } from 'recoil';
import { bomModalState, bomListModalState } from './state.js';

const mdTheme = createTheme();
var rows = [{
    itemcode: 'A0071'
    , itemname: '메모지'
    , process: '기초공정'
    , matCnt: '120'
    , bomAdd: 'bom'
    , bomSrch: 'bom'
    }];
var columns = [];

export default function Bom(){

    const [bomModal, setbomModal] = useRecoilState(bomModalState);
    const [bomListModal, setbomListModal] = useRecoilState(bomListModalState);

    columns = [
        { field: 'itemcode', headerName: '품목코드', width: 200, editable: false },
        { field: 'itemname', headerName: '품목명', width: 200, editable: false },
        { field: 'process', headerName: '생산공정', width: 200, editable: false },
        { field: 'matCnt', headerName: '원재료갯수', width: 150, editable: false },
        { field: 'bomAdd', headerName: 'BOM 등록', width: 150, editable: false,
            renderCell: (v) => { 
                return (<Button variant="outlined" size='small' 
                            sx={{minWidth:100, maxWidth:100}}
                            onClick={(e) => {setbomModal(true)}}
                        >
                            BOM 등록
                        </Button>); 
            }
        },
        { field: 'bomSrch', headerName: '조회', width: 150, editable: false,
            renderCell: (v) => { 
              return (<Button variant="outlined" size='small' 
                          sx={{minWidth:100, maxWidth:100}}
                          onClick={(e) => {setbomListModal(true)}}
                          >
                            BOM 조회
                          </Button>); 
            }
        }, 
      ];

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
              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={5}>
                    <Grid item>

                    </Grid>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography component="h2" variant="h6" color="primary" gutterBottom>
                            BOM 조회
                        </Typography>   
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.itemcode}
                            autoHeight={true}
                            disableSelectionOnClick={true}
                        />
                        <Button variant="contained" size='small' sx={{minWidth:90, maxWidth:90, mt:2}}>품목등록</Button>
                        </Paper>
                    </Grid>
                </Grid>
             </Container>  


            </Box>
          </Box>
        </ThemeProvider>
        </>
      );
};