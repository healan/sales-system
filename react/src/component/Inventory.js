import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';
import { AddRounded, ArrowBackRounded, Inventory2Outlined, LocalShippingOutlined, SyncRounded, WarningAmberRounded } from '@mui/icons-material';
import NavBarContent from '../layout/Navbar.js';
import { URL } from '../config.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));

export default function Inventory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${URL}/api/srchInventory/`);
      setRows(response.data.rows || []);
      setDrafts({});
    } catch (requestError) {
      setError('Could not load inventory. Check the server connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? rows.filter((row) => String(row.prod_cd).toLocaleLowerCase().includes(query)) : rows;
  }, [rows, search]);
  const totalUnits = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.invt_cnt) || 0), 0), [rows]);
  const lowStockRows = rows.filter((row) => Number(row.invt_cnt) <= 5);
  const outOfStockCount = rows.filter((row) => Number(row.invt_cnt) <= 0).length;
  const pendingRows = Object.entries(drafts).filter(([, value]) => value !== '' && Number(value) > 0);
  const pendingUnits = pendingRows.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

  const columns = [
    { field: 'rowno', headerName: 'No.', width: 82, sortable: false, align: 'center', headerAlign: 'center' },
    { field: 'prod_cd', headerName: 'Product Code', flex: 1, minWidth: 170 },
    {
      field: 'invt_cnt', headerName: 'Current Stock', width: 190, align: 'right', headerAlign: 'right',
      valueFormatter: ({ value }) => `${formatNumber(value)} units`,
      renderCell: ({ value }) => <span className={Number(value) <= 5 ? 'inventory-count low' : 'inventory-count'}>{formatNumber(value)} units</span>,
    },
    {
      field: 'cur_invt_cnt', headerName: 'Add Incoming Stock', width: 210, sortable: false, align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => <TextField
        size="small" type="number" value={drafts[row.prod_cd] ?? ''}
        onChange={(event) => {
          const value = event.target.value;
          if (value === '' || (/^\d+$/.test(value) && Number(value) <= 1000000)) {
            setDrafts((current) => ({ ...current, [row.prod_cd]: value }));
            setNotice('');
          }
        }}
        inputProps={{ min: 0, step: 1, 'aria-label': `Incoming quantity for ${row.prod_cd}` }}
        placeholder="Quantity" className="sales-input" />,
    },
  ];

  const saveInventory = async () => {
    if (!pendingRows.length) {
      setNotice('Enter incoming quantities before saving.');
      return;
    }
    const submittedUnits = pendingUnits;
    setSaving(true);
    setNotice('');
    setError('');
    let savedCount = 0;
    try {
      for (const [productCode, quantity] of pendingRows) {
        await axios.put(`${URL}/api/updateInventory/`, { id: productCode, field: 'cur_invt_cnt', value: Number(quantity) });
        savedCount += 1;
        setDrafts((current) => {
          const next = { ...current };
          delete next[productCode];
          return next;
        });
      }
      setNotice(`Saved ${formatNumber(submittedUnits)} incoming units.`);
      await loadData();
    } catch (requestError) {
      try {
        const response = await axios.get(`${URL}/api/srchInventory/`);
        setRows(response.data.rows || []);
      } catch (refreshError) {
        // Keep unsaved inputs in place so they can be retried.
      }
      setError(savedCount
        ? `Saved inventory for ${savedCount} products, but some updates failed. Review the remaining entries and try again.`
        : 'Could not save inventory. Check the entered quantities and server connection.');
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
      setNotice('Enter an incoming quantity as a whole number greater than zero.');
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
        <div className="dashboard-content inventory-content">
          <header className="dashboard-heading">
            <div>
              <div className="eyebrow">INVENTORY CONTROL <span className="eyebrow-dot" /></div>
              <h1>Current Inventory</h1>
              <p>Review stock levels and record incoming quantities by product.</p>
            </div>
            <div className="heading-actions">
              <Button className="refresh-button" onClick={loadData} disabled={loading || saving} startIcon={<SyncRounded />}>Refresh</Button>
              <Button className="refresh-button" onClick={() => navigate('/home')} startIcon={<ArrowBackRounded />}>Dashboard</Button>
            </div>
          </header>

          <section className="metric-grid inventory-metrics" aria-label="Inventory summary">
            <article className="metric-card"><div className="metric-top"><span>Products</span><span className="metric-icon blue"><Inventory2Outlined /></span></div><strong className="metric-value">{formatNumber(rows.length)}</strong><span className="metric-note">Products tracked</span></article>
            <article className="metric-card"><div className="metric-top"><span>Total Stock</span><span className="metric-icon green"><LocalShippingOutlined /></span></div><strong className="metric-value">{formatNumber(totalUnits)}</strong><span className="metric-note">Units across all products</span></article>
            <article className="metric-card"><div className="metric-top"><span>Low Stock</span><span className="metric-icon orange"><WarningAmberRounded /></span></div><strong className="metric-value">{formatNumber(lowStockRows.length)}</strong><span className="metric-note">5 units or fewer</span></article>
            <article className="metric-card"><div className="metric-top"><span>Out of Stock</span><span className="metric-icon purple"><Inventory2Outlined /></span></div><strong className="metric-value">{formatNumber(outOfStockCount)}</strong><span className="metric-note">Zero units or fewer</span></article>
          </section>

          <section className="panel inventory-table-panel">
            <div className="panel-heading inventory-table-heading">
              <div><span className="panel-kicker">STOCK OVERVIEW</span><h2>Inventory by Product</h2></div>
              <div className="inventory-table-actions">
                <TextField className="product-search" size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product code" inputProps={{ 'aria-label': 'Search product code' }} />
              </div>
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
                <span>Incoming Quantity</span>
                <input type="number" min="1" max="1000000" step="1" inputMode="numeric" placeholder="Enter quantity" value={quickQuantity} onChange={(event) => setQuickQuantity(event.target.value)} disabled={loading} />
              </label>
              <Button type="submit" className="sales-add-button" disabled={loading || !rows.length} startIcon={<AddRounded />}>Add to List</Button>
            </form>
            <div className="inventory-guidance"><Inventory2Outlined /><span>Incoming quantities are added to current stock. Enter received units only.</span></div>
            {error && <div className="sales-message error" role="alert">{error}</div>}
            {notice && <div className="sales-message success" role="status">{notice}</div>}
            {lowStockRows.length > 0 && <div className="low-stock-alert"><strong>Low stock · {lowStockRows.length} products</strong><span>{lowStockRows.slice(0, 5).map((row) => row.prod_cd).join(', ')}{lowStockRows.length > 5 ? ' and more' : ''}</span></div>}
            <div className="sales-grid-wrap product-grid-wrap inventory-grid-wrap">
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.prod_cd}
                autoHeight
                loading={loading}
                disableSelectionOnClick
                disableColumnMenu
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                localeText={{ noRowsLabel: loading ? 'Loading inventory…' : search ? 'No products match your search.' : 'No products have been added yet.' }}
              />
            </div>
            <div className="sales-table-footer"><span>{filteredRows.length} products shown · {formatNumber(pendingUnits)} incoming units pending</span><Button className="sales-save-button" onClick={saveInventory} disabled={saving || loading || !pendingRows.length} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LocalShippingOutlined />}>{saving ? 'Saving…' : 'Save Stock Receipt'}</Button></div>
          </section>
        </div>
      </Box>
    </Box>
  );
}
