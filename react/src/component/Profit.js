import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import { ArrowBackRounded, AttachMoneyRounded, DownloadRounded, PaidOutlined, ShowChartRounded, SyncRounded } from '@mui/icons-material';
import NavBarContent from '../layout/Navbar.js';
import { URL } from '../config.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const money = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const previousMonthOf = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const compareText = (current, previous) => {
  if (!previous) return 'No previous-month data';
  const change = ((current - previous) / previous) * 100;
  return `vs. previous month ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

export default function Profit() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [previousRows, setPreviousRows] = useState([]);
  const [dailyRows, setDailyRows] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [marginThreshold, setMarginThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (selectedMonth = month) => {
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) return;
    setLoading(true);
    setError('');
    try {
      const requests = await Promise.all([
        axios.get(`${URL}/api/srchProfit/${selectedMonth}`),
        axios.get(`${URL}/api/srchProfit/${previousMonthOf(selectedMonth)}`),
        axios.get(`${URL}/api/srchProfitDaily/${selectedMonth}`),
      ]);
      setRows(requests[0].data.rows || []);
      setPreviousRows(requests[1].data.rows || []);
      setDailyRows(requests[2].data.rows || []);
    } catch (requestError) {
      setError('Could not load revenue and profit data. Check the server connection.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { loadData(month); }, [loadData, month]);

  const totals = useMemo(() => rows.reduce((summary, row) => ({
    sales: summary.sales + (Number(row.sales_amt) || 0),
    margin: summary.margin + (Number(row.margin_amt) || 0),
  }), { sales: 0, margin: 0 }), [rows]);
  const marginRate = totals.sales ? (totals.margin / totals.sales) * 100 : 0;
  const previousTotals = useMemo(() => previousRows.reduce((summary, row) => ({
    sales: summary.sales + (Number(row.sales_amt) || 0),
    margin: summary.margin + (Number(row.margin_amt) || 0),
  }), { sales: 0, margin: 0 }), [previousRows]);
  const lowMarginRows = rows.filter((row) => {
    const rate = Number(row.sales_amt) ? (Number(row.margin_amt) / Number(row.sales_amt)) * 100 : 0;
    return rate <= marginThreshold;
  });
  const topProducts = [...rows].sort((a, b) => Number(b.sales_amt) - Number(a.sales_amt)).slice(0, 5);
  const maxSales = Math.max(...topProducts.map((row) => Number(row.sales_amt) || 0), 1);
  const monthLabel = month ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date(`${month}-01T00:00:00`)) : '';
  const dailyTrend = useMemo(() => {
    if (!month) return [];
    const [year, monthNumber] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const totalsByDay = new Map(dailyRows.map((row) => [Number(String(row.sale_date).slice(-2)), Number(row.sales_amt) || 0]));
    return Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, sales: totalsByDay.get(index + 1) || 0 }));
  }, [dailyRows, month]);
  const maxDailySales = Math.max(...dailyTrend.map((day) => day.sales), 1);
  const trendPoints = dailyTrend.map((day, index) => `${40 + (index * 720) / Math.max(dailyTrend.length - 1, 1)},${150 - (day.sales / maxDailySales) * 120}`).join(' ');

  const exportCsv = () => {
    const csvRows = [
      ['Product Code', 'Revenue (KRW)', 'Gross Profit (KRW)', 'Margin Rate (%)'],
      ...rows.map((row) => [row.prod_cd, Math.round(Number(row.sales_amt) || 0), Math.round(Number(row.margin_amt) || 0), Number(row.sales_amt) ? ((Number(row.margin_amt) / Number(row.sales_amt)) * 100).toFixed(1) : '0.0']),
      ['Total', Math.round(totals.sales), Math.round(totals.margin), marginRate.toFixed(1)],
    ];
    const content = `\uFEFF${csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
    const url = window.URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-profit_${month}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { field: 'rowno', headerName: 'No.', width: 80, sortable: false, align: 'center', headerAlign: 'center' },
    { field: 'prod_cd', headerName: 'Product Code', flex: 1, minWidth: 160 },
    { field: 'sales_amt', headerName: 'Revenue', width: 210, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => `${money(value)} KRW` },
    { field: 'margin_amt', headerName: 'Gross Profit', width: 210, align: 'right', headerAlign: 'right', valueFormatter: ({ value }) => `${money(value)} KRW` },
    { field: 'margin_rate', headerName: 'Margin Rate', width: 130, align: 'right', headerAlign: 'right', valueGetter: ({ row }) => Number(row.sales_amt) ? (Number(row.margin_amt) / Number(row.sales_amt)) * 100 : 0, renderCell: ({ value }) => <span className={Number(value) <= marginThreshold ? 'margin-rate low' : 'margin-rate'}>{Number(value).toFixed(1)}%</span> },
  ];

  return (
    <Box className="dashboard-shell" sx={{ display: 'flex' }}>
      <CssBaseline />
      <NavBarContent />
      <Box component="main" className="dashboard-main">
        <Toolbar />
        <div className="dashboard-content profit-content">
          <header className="dashboard-heading">
            <div>
              <div className="eyebrow">REVENUE &amp; PROFIT <span className="eyebrow-dot" /></div>
              <h1>Revenue &amp; Profit</h1>
              <p>Review revenue and product profitability for {monthLabel || 'the selected month'}.</p>
            </div>
            <div className="heading-actions">
              <label className="profit-month-picker"><span>Month</span><input aria-label="Select month" type="month" value={month} max={currentMonth()} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} /></label>
              <Button className="refresh-button" onClick={() => loadData(month)} disabled={loading || !month} startIcon={<SyncRounded />}>Apply</Button>
              <Button className="refresh-button" onClick={exportCsv} disabled={loading || !rows.length} startIcon={<DownloadRounded />}>Export CSV</Button>
              <Button className="refresh-button" onClick={() => navigate('/home')} startIcon={<ArrowBackRounded />}>Dashboard</Button>
            </div>
          </header>

          <section className="metric-grid profit-metrics" aria-label="Revenue and profit summary">
            <article className="metric-card"><div className="metric-top"><span>Total Revenue</span><span className="metric-icon blue"><AttachMoneyRounded /></span></div><strong className="metric-value">{money(totals.sales)} KRW</strong><span className="metric-note">{monthLabel} · {compareText(totals.sales, previousTotals.sales)}</span></article>
            <article className="metric-card"><div className="metric-top"><span>Gross Profit</span><span className="metric-icon green"><ShowChartRounded /></span></div><strong className="metric-value">{money(totals.margin)} KRW</strong><span className="metric-note">Revenue minus purchase cost · {compareText(totals.margin, previousTotals.margin)}</span></article>
            <article className="metric-card"><div className="metric-top"><span>Average Margin</span><span className="metric-icon purple"><PaidOutlined /></span></div><strong className="metric-value">{marginRate.toFixed(1)}%</strong><span className="metric-note">Gross profit ÷ total revenue</span></article>
            <article className="metric-card"><div className="metric-top"><span>Products Sold</span><span className="metric-icon orange"><PaidOutlined /></span></div><strong className="metric-value">{money(rows.length)}</strong><span className="metric-note">Products with sales this month</span></article>
          </section>

          <section className="panel daily-trend-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">DAILY TREND</span><h2>Daily Revenue</h2></div>
              <span className="profit-chart-caption">{monthLabel}</span>
            </div>
            {dailyRows.length ? <div className="daily-chart">
              <div className="daily-chart-total"><span>Revenue this month</span><strong>{money(totals.sales)} KRW</strong></div>
              <svg viewBox="0 0 800 190" role="img" aria-label={`${monthLabel} daily revenue`} preserveAspectRatio="none">
                <line x1="40" y1="150" x2="760" y2="150" className="chart-axis" />
                <line x1="40" y1="90" x2="760" y2="90" className="chart-gridline" />
                <polyline points={trendPoints} className="daily-chart-line" />
                {dailyTrend.filter((day) => day.sales > 0).map((day) => <circle key={day.day} cx={40 + ((day.day - 1) * 720) / Math.max(dailyTrend.length - 1, 1)} cy={150 - (day.sales / maxDailySales) * 120} r="3.5" className="daily-chart-dot"><title>Day {day.day} · {money(day.sales)} KRW</title></circle>)}
              </svg>
              <div className="daily-chart-labels"><span>Day 1</span><span>Day 8</span><span>Day 15</span><span>Day 22</span><span>Day {dailyTrend.length}</span></div>
            </div> : <div className="empty-state">{loading ? 'Loading data…' : 'No daily sales history yet. Trends will appear after sales are recorded.'}</div>}
          </section>

          <section className="profit-chart-panel panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">MONTHLY PERFORMANCE</span><h2>Revenue by Product</h2></div>
              <span className="profit-chart-caption">Top 5 products by revenue</span>
            </div>
            {topProducts.length ? <div className="bar-list profit-bar-list">{topProducts.map((row, index) => <div className="bar-row" key={row.prod_cd}>
              <div className="bar-label"><span className="bar-rank">{String(index + 1).padStart(2, '0')}</span><span>{row.prod_cd}</span><strong>{money(row.sales_amt)} KRW</strong></div>
              <div className="bar-track"><div className={`bar-fill fill-${index}`} style={{ width: `${Math.max(4, (Number(row.sales_amt) / maxSales) * 100)}%` }} /></div>
            </div>)}</div> : <div className="empty-state">{loading ? 'Loading data…' : 'No revenue data for the selected month.'}</div>}
          </section>

          <section className="panel profit-table-panel">
            <div className="panel-heading profit-table-heading">
              <div><span className="panel-kicker">PRODUCT BREAKDOWN</span><h2>Revenue &amp; Profit by Product</h2></div>
              <label className="margin-threshold">Low-margin threshold <select value={marginThreshold} onChange={(event) => setMarginThreshold(Number(event.target.value))}><option value={5}>5%</option><option value={10}>10%</option><option value={15}>15%</option><option value={20}>20%</option></select></label>
            </div>
            {!!lowMarginRows.length && <div className="low-margin-alert" role="status"><strong>Review margins · {lowMarginRows.length} products</strong><span>{lowMarginRows.slice(0, 5).map((row) => row.prod_cd).join(', ')}{lowMarginRows.length > 5 ? ' and more' : ''} have a margin at or below {marginThreshold}%.</span></div>}
            {error && <div className="sales-message error" role="alert">{error}</div>}
            <div className="sales-grid-wrap profit-grid-wrap">
              <DataGrid rows={rows} columns={columns} getRowId={(row) => row.prod_cd} autoHeight loading={loading} disableSelectionOnClick disableColumnMenu pageSize={10} rowsPerPageOptions={[10, 25, 50]} localeText={{ noRowsLabel: loading ? 'Loading data…' : 'No sales for the selected month.' }} />
            </div>
            <div className="profit-table-footer"><span>{money(rows.length)} products</span><span>Revenue <strong>{money(totals.sales)} KRW</strong></span><span>Gross Profit <strong>{money(totals.margin)} KRW</strong></span></div>
          </section>
        </div>
      </Box>
    </Box>
  );
}
