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
import { useRecoilState } from 'recoil';
import { productmodalState } from './state.js';
import moment from 'moment';
import {URL} from '../config.js';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const mdTheme = createTheme();

export default function Product(){
    const [rows, setRows] = useState([]);
    const [prodCd, setProdCd] = useState();
    const [open, setOpen] = React.useState(false);

    const formatNumber = (number) => {
        return Math.floor(number)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    };

    const columns = [
        { field: 'rowno', headerName: '순번', width: 150, editable: false,},
        { field: 'prod_cd', headerName: '제품코드', width: 150, editable: true,},
        { field: 'pur_price', headerName: '사입가(원)', width: 150, editable: true,
            valueFormatter: params => formatNumber(params.value)},
        { field: 'sale_price', headerName: '판매가(원)', width: 150, editable: true,
            valueFormatter: params => formatNumber(params.value)} 
      ];

    useEffect(() => {
        loadData();
    },[]);

    const loadData = async() => {
        await axios.get(URL+'/api/srchProduct/')
                   .then((res) => {
                       setRows(res.data.rows);
                   });
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handeAddProd = async(newProductData)=> {
        console.log(48, newProductData);

        await axios.post(URL+'/api/addProduct/', newProductData)
                   .then((res) => {
                       console.log(52, res);
                       if(res.status == 200){
                            handleClose();
                            loadData();
                       }else{
                            alert('저장에 실패하였습니다. 관리자에게 문의하세요.')
                       };
                   });
    };

    const handeUpdateProd = async(updateProdData) => {
        await axios.put(URL+'/api/updateProduct/', updateProdData)
            .then((res) => {
                if(res.status == 200){
                    loadData();
                }else{
                    alert('저장에 실패하였습니다. 관리자에게 문의하세요.')
                };
            });
    };
    
    const handelDelProd = async() => {
        if(prodCd==null || prodCd == undefined){
            alert('삭제 항목을 선택하여주세요.');
            return;
        };
        console.log(97, prodCd);
        let cf = window.confirm('전체 데이터가 삭제됩니다. 계속 하시겠습니까?');
        if(cf == true){
            await axios.delete(URL+'/api/delProduct/'+prodCd)
                .then((res) => {
                    loadData();
                });
        }else{
            loadData();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault(); 
        const data = new FormData(event.currentTarget);
        const newData = {
          code: data.get('code'),
          purprice: data.get('purprice'),
          saleprice: data.get('saleprice'),
        };

        if( newData.code == ''){
            alert('제품코드를 입력하여 주세요.')
        }else{
            console.log(88, newData);
            handeAddProd(newData);
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
              <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={5}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                                제품 정보
                            </Typography>   
                            <DataGrid
                                rows={ rows }
                                columns={columns}
                                getRowId={(row) => row.prod_cd}
                                autoHeight={true}
                                checkboxSelection
                                disableSelectionOnClick
                                selectionModel={prodCd}
                                onSelectionModelChange={(e) => {
                                    if(e.length > 1){
                                        e = e[e.length - 1];
                                        setProdCd(e);
                                    }else{ 
                                        setProdCd(e);
                                    };
                                }}
                                onCellEditCommit={(e)=>{
                                    handeUpdateProd(e);
                                }}
                            />
                           
                       </Paper>
                    </Grid> 
                </Grid>
                <Grid container alignItems='flex-start'>
                    <Grid item>
                        <Button variant="contained" size='small' sx={{minWidth:90, maxWidth:90, mt:2}} onClick={handleClickOpen}>추가</Button>
                        <Button variant="contained" size='small' sx={{minWidth:90, maxWidth:90, mt:2, ml:1}} onClick={handelDelProd}>삭제</Button>
                    </Grid>
                </Grid>
             </Container>    
            </Box>
          </Box>
        </ThemeProvider>
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>제품 정보 입력</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate onSubmit={handleSubmit}>
                    <TextField
                        autoFocus
                        margin="dense"
                        required
                        id="code"
                        name="code"
                        label="제품코드"
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="purprice"
                        name='purprice'
                        label="사입가(원)"
                        fullWidth
                        variant="standard"
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="saleprice"
                        name='saleprice'
                        label="판매가(원)"
                        fullWidth
                        variant="standard"
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                    저장
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                onClick={handleClose}
                                fullWidth
                                variant="outlined"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                취소
                            </Button>   
                        </Grid>
                    </Grid>                   
                </Box>
            </DialogContent>
        </Dialog>
        </>
      );
};