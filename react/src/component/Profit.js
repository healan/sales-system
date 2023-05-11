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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CustomFooterTotalComponent } from "./customFooter.js";

const mdTheme = createTheme();


export default function Profit(){
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [sales_amts, setSalesAmts] = useState();
    const [margin_amts, setMarginAmts] = useState();

    const formatNumber = (number) => {
        return Math.floor(number)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    };

    const columns = [
        { field: 'rowno', headerName: '순번', width: 150, editable: false,},
        { field: 'prod_cd', headerName: '제품코드', width: 150, editable: false,},
        { field: 'sales_amt', headerName: '매출액', width: 150, editable: false,
            valueFormatter: params => formatNumber(params.value)},
        { field: 'margin_amt', headerName: '매출총이익 (마진)', width: 150, editable: false,
            valueFormatter: params => formatNumber(params.value)},
    ];

    useEffect(() => {
        loadData();
    },[]);

    function getYmd10(d) {
        return d.getFullYear() + "-" + ((d.getMonth() + 1) > 9 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1));
    };

    const loadData = async() => {
        let dt = getYmd10(startDate);
        await axios.get(URL+'/api/srchProfit/'+ dt)
                   .then((res) => {
                       console.log(54, res);
                       setRows(res.data.rows);
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
                <Grid container>
                    <Grid item xs={8}></Grid>
                    <Grid item xs={2.5} sx={{mb:1}}>
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="MMMM yyyy" showMonthYearPicker/>
                    </Grid>
                    <Grid item xs={1}>
                        <Button variant="contained" size='small' sx={{minWidth:80, maxHeight:23}} onClick={loadData}>조회</Button>
                    </Grid>
                </Grid>
                <Grid container spacing={5}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                                매출/이익 상태
                            </Typography> 
                            <DataGrid
                                rows={ rows }
                                columns={columns}
                                getRowId={(row) => row.prod_cd}
                                autoHeight={true}
                                components={{
                                    Footer: CustomFooterTotalComponent
                                }}
                                componentsProps={{
                                    footer: { sales_amts, margin_amts }
                                }}
                                onStateChange={() => {
                                    const sales_amts = rows
                                      .map((item) => item.sales_amt)
                                      .reduce((a, b) => a + b, 0);
                                    setSalesAmts(sales_amts);
        
                                    const margin_amts = rows
                                        .map((item) => item.margin_amt)
                                        .reduce((a, b) => a + b, 0);
                                    setMarginAmts(margin_amts);
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