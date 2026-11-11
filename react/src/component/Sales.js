import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';
import { ArrowBackRounded, Inventory2Outlined, LocalMallOutlined, SaveOutlined, SyncRounded } from '@mui/icons-material';
import NavBarContent from '../layout/Navbar.js';
import { URL } from '../config.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));

export default function Sales() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${URL}/api/srchQuantity/`);
      setRows(response.data.rows || []);
      setDrafts({});
    } catch (requestError) {
      setError('Could not load sales data. Check the server connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  }).format(new Date());
  const pendingRows = Object.entries(drafts).filter(([, value]) => value !== '' && Number(value) > 0);
  const pendingUnits = pendingRows.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
  const registeredUnits = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.sale_cnt) || 0), 0), [rows]);

  const columns = [
    { field: 'rowno', headerName: 'No.', width: 80, sortable: false, headerAlign: 'center', align: 'center' },
    { field: 'prod_cd', headerName: 'Product Code', flex: 1, minWidth: 150 },
    { field: 'pur_price', headerName: 'Purchase Price', width: 150, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => `${formatNumber(value)} KRW` },
    { field: 'sale_price', headerName: 'Sale Price', width: 150, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => `${formatNumber(value)} KRW` },
    { field: 'sale_cnt', headerName: 'Current Quantity', width: 160, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => `${formatNumber(value)} units` },
    {
      field: 'cur_sale_cnt', headerName: 'Add Sales Quantity', width: 190, sortable: false, align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => <TextField
        size="small" type="number" value={drafts[row.prod_cd] ?? ''}
        onChange={(event) => {
          const value = event.target.value;
          if (value === '' || (/^\d+$/.test(value) && Number(value) <= 1000000)) {
            setDrafts((current) => ({ ...current, [row.prod_cd]: value }));
            setNotice('');
          }
        }}
        inputProps={{ min: 0, step: 1, 'aria-label': `Sales quantity for ${row.prod_cd}` }}
        placeholder="Quantity" className="sales-input" />,
    },
  ];

  const saveSales = async () => {
    if (!pendingRows.length) {
      setNotice('Enter sales quantities before saving.');
      return;
    }
    setSaving(true);
    setNotice('');
    setError('');
    let savedCount = 0;
    try {
      for (const [productCode, quantity] of pendingRows) {
        await axios.put(`${URL}/api/updateQuantity/`, {
          id: productCode,
          field: 'cur_sale_cnt',
          value: Number(quantity),
        });
        savedCount += 1;
        setDrafts((current) => {
          const next = { ...current };
          delete next[productCode];
          return next;
        });
      }
      setNotice(`Saved ${formatNumber(pendingUnits)} sales units.`);
      await loadData();
    } catch (requestError) {
      try {
        const response = await axios.get(`${URL}/api/srchQuantity/`);
        setRows(response.data.rows || []);
      } catch (refreshError) {
        // Keep the unsaved inputs available for retry if refreshing also fails.
      }
      setError(savedCount
        ? `Saved ${savedCount} products, but some updates failed. Review the remaining entries and try again.`
        : 'Could not save sales quantities. Check the entered values and server connection.');
    } finally {
      setSaving(false);
    }
  };

  const addQuickQuantity = (event) => {
    event.preventDefault();
    const quantity = Number(quickQuantity);
    if (!selectedProduct) {
      setNotice('Select a product.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
      setNotice('Enter a sales quantity as a whole number greater than zero.');
      return;
    }
    const accumulatedQuantity = (Number(drafts[selectedProduct]) || 0) + quantity;
    setDrafts((current) => ({ ...current, [selectedProduct]: String(accumulatedQuantity) }));
    setNotice(`Added ${formatNumber(quantity)} units for ${selectedProduct}. Pending total: ${formatNumber(accumulatedQuantity)}.`);
    setQuickQuantity('');
  };

  return (
    <Box className="dashboard-shell" sx={{ display: 'flex' }}>
      <CssBaseline />
      <NavBarContent />
      <Box component="main" className="dashboard-main">
        <Toolbar />
        <div className="dashboard-content sales-content">
          <header className="dashboard-heading">
            <div>
              <div className="eyebrow">SALES ENTRY <span className="eyebrow-dot" /></div>
              <h1>Sales Entry</h1>
              <p>{today} · Enter sales quantities by product and save them together.</p>
            </div>
            <div className="heading-actions">
              <Button className="refresh-button" onClick={loadData} disabled={loading || saving} startIcon={<SyncRounded />}>Refresh</Button>
              <Button className="refresh-button" onClick={() => navigate('/home')} startIcon={<ArrowBackRounded />}>Dashboard</Button>
            </div>
          </header>

          <section className="metric-grid sales-metrics" aria-label="Sales summary">
            <article className="metric-card"><div className="metric-top"><span>Products</span><span className="metric-icon blue"><Inventory2Outlined /></span></div><strong className="metric-value">{formatNumber(rows.length)}</strong><span className="metric-note">Products available for entry</span></article>
            <article className="metric-card"><div className="metric-top"><span>Current Quantity</span><span className="metric-icon green"><LocalMallOutlined /></span></div><strong className="metric-value">{formatNumber(registeredUnits)} units</strong><span className="metric-note">Total registered quantity</span></article>
            <article className="metric-card"><div className="metric-top"><span>Pending Sales</span><span className="metric-icon purple"><SaveOutlined /></span></div><strong className="metric-value">{formatNumber(pendingUnits)} units</strong><span className="metric-note">Quantity ready to save</span></article>
            <article className="metric-card sales-help-card"><div className="metric-top"><span>Entry Tip</span><span className="metric-icon orange"><SyncRounded /></span></div><strong className="metric-help">Enter units sold</strong><span className="metric-note">Saved quantities are added to the total.</span></article>
          </section>

          <section className="panel sales-table-panel">
            <div className="panel-heading sales-table-heading">
              <div><span className="panel-kicker">PRODUCT SALES</span><h2>Sales by Product</h2></div>
              <span className="sales-date-label">{today}</span>
            </div>
            <form className="sales-quick-form" onSubmit={addQuickQuantity}>
              <label className="sales-form-field sales-product-field">
                <span>Select Product</span>
                <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} disabled={loading || !rows.length}>
                  <option value="">Choose a product</option>
                  {rows.map((row) => <option key={row.prod_cd} value={row.prod_cd}>{row.prod_cd}</option>)}
                </select>
              </label>
              <label className="sales-form-field sales-quantity-field">
                <span>Sales Quantity</span>
                <input type="number" min="1" max="1000000" step="1" inputMode="numeric" placeholder="Enter quantity" value={quickQuantity} onChange={(event) => setQuickQuantity(event.target.value)} disabled={loading} />
              </label>
              <Button type="submit" className="sales-add-button" disabled={loading || !rows.length}>Add to List</Button>
            </form>
            {error && <div className="sales-message error" role="alert">{error}</div>}
            {notice && <div className="sales-message success" role="status">{notice}</div>}
            <div className="sales-grid-wrap">
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.prod_cd}
                autoHeight
                loading={loading}
                disableSelectionOnClick
                disableColumnMenu
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                localeText={{ noRowsLabel: loading ? 'Loading products…' : 'No products have been added yet.', footerRowSelected: (count) => `${count} selected` }}
              />
            </div>
            <div className="sales-table-footer">
              <span>Entered quantities are added to existing sales. Zero values are not saved.</span>
              <Button className="sales-save-button" onClick={saveSales} disabled={saving || loading || !pendingRows.length} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}>
                {saving ? 'Saving…' : 'Save Sales'}
              </Button>
            </div>
          </section>
        </div>
      </Box>
    </Box>
  );
}
