import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';
import { AddRounded, ArrowBackRounded, Inventory2Outlined, SearchRounded, SyncRounded, TrendingUpRounded } from '@mui/icons-material';
import NavBarContent from '../layout/Navbar.js';
import { URL } from '../config.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));

export default function Product() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: '', purprice: '', saleprice: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${URL}/api/srchProduct/`);
      setRows(response.data.rows || []);
      setSelection((current) => current.filter((id) => (response.data.rows || []).some((row) => row.prod_cd === id)));
    } catch (requestError) {
      setError('Could not load product data. Check the server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return rows;
    return rows.filter((row) => String(row.prod_cd).toLocaleLowerCase().includes(query));
  }, [rows, search]);

  const averageMarginRate = useMemo(() => {
    if (!rows.length) return 0;
    const rates = rows.map((row) => Number(row.sale_price) ? ((Number(row.sale_price) - Number(row.pur_price)) / Number(row.sale_price)) * 100 : 0);
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }, [rows]);

  const addProduct = async (event) => {
    event.preventDefault();
    const code = newProduct.code.trim();
    const purchasePrice = Number(newProduct.purprice);
    const salePrice = Number(newProduct.saleprice);
    if (!code) return setError('Enter a product code.');
    if (rows.some((row) => String(row.prod_cd).toLowerCase() === code.toLowerCase())) return setError('This product code is already registered.');
    if (!Number.isInteger(purchasePrice) || purchasePrice < 0 || !Number.isInteger(salePrice) || salePrice < 0) {
      return setError('Enter purchase and sale prices as whole numbers greater than or equal to zero.');
    }

    setSaving(true);
    setError('');
    try {
      await axios.post(`${URL}/api/addProduct/`, { code, purprice: purchasePrice, saleprice: salePrice });
      setOpen(false);
      setNewProduct({ code: '', purprice: '', saleprice: '' });
      setNotice(`Product ${code} was added.`);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.status === 409 ? 'This product code is already registered.' : 'Could not add the product. Check the details and server connection.');
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async ({ id, field, value }) => {
    const numericValue = Number(value);
    if (!['pur_price', 'sale_price'].includes(field) || !Number.isInteger(numericValue) || numericValue < 0) {
      setError('Enter a price as a whole number greater than or equal to zero.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await axios.put(`${URL}/api/updateProduct/`, { id, field, value: numericValue });
      setNotice(`Price information for ${id} was updated.`);
      await loadData();
    } catch (requestError) {
      setError('Could not update the price. Please try again.');
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selection.length) {
      setNotice('Select a product to delete.');
      return;
    }
    const confirmed = window.confirm(`This will delete the product details, current sales entries, and inventory for ${selection.length} selected product(s). Historical sales records will be kept. Continue?`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      for (const code of selection) await axios.delete(`${URL}/api/delProduct/${encodeURIComponent(code)}`);
      setNotice(`Deleted ${selection.length} product(s).`);
      setSelection([]);
      await loadData();
    } catch (requestError) {
      setError('Some products could not be deleted. Refresh the list to review the results.');
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { field: 'rowno', headerName: 'No.', width: 82, sortable: false, align: 'center', headerAlign: 'center' },
    { field: 'prod_cd', headerName: 'Product Code', flex: 1, minWidth: 170 },
    {
      field: 'pur_price', headerName: 'Purchase Price', width: 210, type: 'number', editable: true, align: 'right', headerAlign: 'right',
      valueFormatter: ({ value }) => `${formatNumber(value)} KRW`,
      preProcessEditCellProps: ({ props }) => ({ ...props, hasError: !Number.isInteger(Number(props.value)) || Number(props.value) < 0 }),
    },
    {
      field: 'sale_price', headerName: 'Sale Price', width: 210, type: 'number', editable: true, align: 'right', headerAlign: 'right',
      valueFormatter: ({ value }) => `${formatNumber(value)} KRW`,
      preProcessEditCellProps: ({ props }) => ({ ...props, hasError: !Number.isInteger(Number(props.value)) || Number(props.value) < 0 }),
    },
    { field: 'margin', headerName: 'Profit per Unit', width: 180, align: 'right', headerAlign: 'right', valueGetter: ({ row }) => Number(row.sale_price) - Number(row.pur_price), valueFormatter: ({ value }) => `${formatNumber(value)} KRW` },
  ];

  return (
    <Box className="dashboard-shell" sx={{ display: 'flex' }}>
      <CssBaseline />
      <NavBarContent />
      <Box component="main" className="dashboard-main">
        <Toolbar />
        <div className="dashboard-content product-content">
          <header className="dashboard-heading">
            <div>
              <div className="eyebrow">PRODUCT CATALOG <span className="eyebrow-dot" /></div>
              <h1>Product Management</h1>
              <p>Add products and maintain their purchase and sale prices.</p>
            </div>
            <div className="heading-actions">
              <Button className="refresh-button" onClick={loadData} disabled={loading || saving} startIcon={<SyncRounded />}>Refresh</Button>
              <Button className="refresh-button" onClick={() => navigate('/home')} startIcon={<ArrowBackRounded />}>Dashboard</Button>
            </div>
          </header>

          <section className="metric-grid product-metrics" aria-label="Product summary">
            <article className="metric-card"><div className="metric-top"><span>Products</span><span className="metric-icon blue"><Inventory2Outlined /></span></div><strong className="metric-value">{formatNumber(rows.length)}</strong><span className="metric-note">Total products in catalog</span></article>
            <article className="metric-card"><div className="metric-top"><span>Average Margin</span><span className="metric-icon green"><TrendingUpRounded /></span></div><strong className="metric-value">{averageMarginRate.toFixed(1)}%</strong><span className="metric-note">Average across products</span></article>
            <article className="metric-card"><div className="metric-top"><span>Selected</span><span className="metric-icon purple"><Inventory2Outlined /></span></div><strong className="metric-value">{formatNumber(selection.length)}</strong><span className="metric-note">Products selected for deletion</span></article>
            <article className="metric-card product-help-card"><div className="metric-top"><span>Edit Prices</span><span className="metric-icon orange"><TrendingUpRounded /></span></div><strong className="metric-help">Double-click a price</strong><span className="metric-note">Press Enter to save changes</span></article>
          </section>

          <section className="panel product-table-panel">
            <div className="panel-heading product-table-heading">
              <div><span className="panel-kicker">PRODUCT CATALOG</span><h2>Product List</h2></div>
              <div className="product-table-actions">
                <TextField className="product-search" size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product code" inputProps={{ 'aria-label': 'Search product code' }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
                <Button className="product-add-button" onClick={() => { setError(''); setOpen(true); }} disabled={saving} startIcon={<AddRounded />}>Add Product</Button>
                <Button className="product-delete-button" onClick={deleteSelected} disabled={saving || !selection.length}>Delete Selected</Button>
              </div>
            </div>
            {error && <div className="sales-message error" role="alert">{error}</div>}
            {notice && <div className="sales-message success" role="status">{notice}</div>}
            <div className="sales-grid-wrap product-grid-wrap">
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.prod_cd}
                autoHeight
                loading={loading}
                checkboxSelection
                disableSelectionOnClick
                disableColumnMenu
                selectionModel={selection}
                onSelectionModelChange={(nextSelection) => setSelection(nextSelection)}
                onCellEditCommit={updateProduct}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                localeText={{ noRowsLabel: loading ? 'Loading products…' : search ? 'No products match your search.' : 'No products have been added yet.' }}
              />
            </div>
            <div className="product-table-footer"><span>Showing {formatNumber(filteredRows.length)} product(s)</span><span>{saving && <><CircularProgress size={13} /> Saving…</>}</span></div>
          </section>
        </div>
      </Box>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="product-dialog-title">Add a Product</DialogTitle>
        <DialogContent>
          <p className="product-dialog-description">Enter the product code and prices. The product will also be added to sales and inventory.</p>
          {error && <div className="sales-message error" role="alert">{error}</div>}
          <Box component="form" className="product-form" onSubmit={addProduct}>
            <TextField autoFocus required fullWidth label="Product Code" value={newProduct.code} onChange={(event) => setNewProduct((current) => ({ ...current, code: event.target.value }))} inputProps={{ maxLength: 191 }} />
            <div className="product-price-fields">
              <TextField required fullWidth type="number" label="Purchase Price (KRW)" value={newProduct.purprice} onChange={(event) => setNewProduct((current) => ({ ...current, purprice: event.target.value }))} inputProps={{ min: 0, step: 1 }} />
              <TextField required fullWidth type="number" label="Sale Price (KRW)" value={newProduct.saleprice} onChange={(event) => setNewProduct((current) => ({ ...current, saleprice: event.target.value }))} inputProps={{ min: 0, step: 1 }} />
            </div>
            <div className="product-form-actions">
              <Button type="button" className="refresh-button" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" className="product-add-button" disabled={saving} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <AddRounded />}>{saving ? 'Adding…' : 'Add Product'}</Button>
            </div>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
