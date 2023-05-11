import React, { useEffect, useState } from 'react';
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
import {URL} from '../config.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const mdTheme = createTheme();

export default function Sales(){
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [prodCd, setProdCd] = useState();
    
    let today = new Date();
    let todayFormat = '(' + today.getFullYear() + '년 ' + today.getMonth() + '월 '+ today.getDate() + '일)';

    const formatNumber = (number) => {
        return Math.floor(number)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    };

    const columns = [
        { field: 'rowno', headerName: '순번', width: 150, editable: false,},
        { field: 'prod_cd', headerName: '제품코드', width: 150, editable: false,},
        { field: 'pur_price', headerName: '사입가(원)', width: 150, editable: false,
            valueFormatter: params => formatNumber(params.value)},
        { field: 'sale_price', headerName: '판매가(원)', width: 150, editable: false,
            valueFormatter: params => formatNumber(params.value)},
        { field: 'sale_cnt', headerName: '금일 판매량', width: 150, editable: false,
            valueFormatter: params => formatNumber(params.value)},
        { field: 'cur_sale_cnt', headerName: '판매량 입력', width: 150, editable: true,} 
    ];

    useEffect(() => {
        loadData();
    },[]);

    const loadData = async() => {
        await axios.get(URL+'/api/srchQuantity/')
                   .then((res) => {
                       console.log(54, res);
                       setRows(res.data.rows);
                   });
    };

    const handeUpdateProd = async(updateProdData) => {
        console.log(72, updateProdData);
        

        await axios.put(URL+'/api/updateQuantity/', updateProdData)
            .then((res) => {
                if(res.status == 200){
                    
                    
                    
                    loadData();
                }else{
                    alert('저장에 실패하였습니다. 관리자에게 문의하세요.')
                };
            });
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
              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={5}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                                판매량 {todayFormat}
                            </Typography>   
                            <DataGrid
                                rows={ rows }
                                columns={columns}
                                getRowId={(row) => row.prod_cd}
                                autoHeight={true}
                                onCellEditCommit={(e)=>{
                                    handeUpdateProd(e);
                                }}
                            />
                           
                       </Paper>
                    </Grid> 
                </Grid>
                <Grid container alignItems='flex-start'>
                    <Grid item>
                        <Button variant="outlined" size='small' sx={{minWidth:90, maxWidth:90, mt:2, ml:1}} onClick={()=>{navigate('/home')}}>홈으로</Button>
                    </Grid>
                </Grid>
             </Container>    
            </Box>
          </Box>
        </ThemeProvider>
        </>
      );
};