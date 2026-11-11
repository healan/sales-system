import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { URL } from '../config.js';
import NavBarContent from '../layout/Navbar.js';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import {
  ArrowForwardRounded, AttachMoneyRounded, Inventory2Outlined,
  LocalMallOutlined, LogoutRounded, PaymentsOutlined, ShowChartRounded,
} from '@mui/icons-material';

const money = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [profit, setProfit] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    const month = new Date();
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const results = await Promise.allSettled([
      axios.get(`${URL}/api/srchQuantity/`),
      axios.get(`${URL}/api/srchInventory/`),
      axios.get(`${URL}/api/srchProfit/${monthKey}`),
    ]);
    if (results[0].status === 'fulfilled') setProducts(results[0].value.data.rows || []);
    if (results[1].status === 'fulfilled') setInventory(results[1].value.data.rows || []);
    if (results[2].status === 'fulfilled') setProfit(results[2].value.data.rows || []);
    setUpdatedAt(new Date());
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  const totals = useMemo(() => ({
    sales: profit.reduce((sum, row) => sum + (Number(row.sales_amt) || 0), 0),
    margin: profit.reduce((sum, row) => sum + (Number(row.margin_amt) || 0), 0),
    units: products.reduce((sum, row) => sum + (Number(row.sale_cnt) || 0), 0),
    lowStock: inventory.filter((row) => Number(row.invt_cnt) <= 5).length,
  }), [profit, products, inventory]);

  const topProducts = [...profit].sort((a, b) => Number(b.sales_amt) - Number(a.sales_amt)).slice(0, 5);
  const maxSales = Math.max(...topProducts.map((row) => Number(row.sales_amt) || 0), 1);
  const monthLabel = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date());
  const actions = [
    { title: 'Enter Sales', detail: 'Record sales quantities for your products', icon: <LocalMallOutlined />, path: '/sales', tone: 'blue' },
    { title: 'Revenue & Profit', detail: 'Review monthly performance by product', icon: <ShowChartRounded />, path: '/profit', tone: 'green' },
    { title: 'Manage Products', detail: 'Maintain products and selling prices', icon: <Inventory2Outlined />, path: '/product', tone: 'purple' },
    { title: 'Current Inventory', detail: 'Review stock and record incoming units', icon: <PaymentsOutlined />, path: '/inventory', tone: 'orange' },
  ];

  return (
    <Box className="dashboard-shell" sx={{ display: 'flex' }}>
      <CssBaseline />
      <NavBarContent />
      <Box component="main" className="dashboard-main">
        <Toolbar />
        <div className="dashboard-content">
          <header className="dashboard-heading">
            <div>
              <div className="eyebrow">OVERVIEW <span className="eyebrow-dot" /></div>
              <h1>Welcome back. Here's your overview.</h1>
              <p>Review sales and inventory for {monthLabel}.</p>
            </div>
            <div className="heading-actions">
              <Button className="refresh-button" onClick={loadDashboard} disabled={loading} startIcon={<ShowChartRounded />}>
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
              <Button className="refresh-button logout-button" onClick={() => navigate('/')} startIcon={<LogoutRounded />}>Log out</Button>
            </div>
          </header>

          <section className="metric-grid" aria-label="Key metrics">
            <MetricCard title="Revenue This Month" value={`${money(totals.sales)} KRW`} icon={<AttachMoneyRounded />} tone="blue" note="Month-to-date revenue" />
            <MetricCard title="Gross Profit" value={`${money(totals.margin)} KRW`} icon={<ShowChartRounded />} tone="green" note="Revenue minus purchase cost" />
            <MetricCard title="Units Sold" value={`${money(totals.units)} units`} icon={<LocalMallOutlined />} tone="purple" note="Registered sales quantity" />
            <MetricCard title="Low-Stock Products" value={`${money(totals.lowStock)}`} icon={<Inventory2Outlined />} tone="orange" note="5 units or fewer" />
          </section>

          <section className="dashboard-panels">
            <article className="panel sales-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">PERFORMANCE</span><h2>Revenue by Product</h2></div>
                <button className="text-link" onClick={() => navigate('/profit')}>View details <ArrowForwardRounded /></button>
              </div>
              {topProducts.length ? <div className="bar-list">
                {topProducts.map((row, index) => <div className="bar-row" key={row.prod_cd}>
                  <div className="bar-label"><span className="bar-rank">{String(index + 1).padStart(2, '0')}</span><span>{row.prod_cd}</span><strong>{money(row.sales_amt)} KRW</strong></div>
                  <div className="bar-track"><div className={`bar-fill fill-${index}`} style={{ width: `${Math.max(4, (Number(row.sales_amt) / maxSales) * 100)}%` }} /></div>
                </div>)}
              </div> : <EmptyState loading={loading} text="No revenue data for this month." />}
              <div className="panel-footnote">{monthLabel} · Top 5 products by revenue</div>
            </article>

            <article className="panel inventory-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">INVENTORY</span><h2>Stock Overview</h2></div>
                <button className="text-link" onClick={() => navigate('/inventory')}>View all <ArrowForwardRounded /></button>
              </div>
              <div className="stock-summary"><span className="stock-icon"><Inventory2Outlined /></span><div><strong>{money(inventory.length)}<small>products</small></strong><span>Products tracked</span></div><div className="stock-divider" /><div><strong className={totals.lowStock ? 'stock-warning' : ''}>{money(totals.lowStock)}<small>products</small></strong><span>Low stock</span></div></div>
              <div className="stock-list">
                {inventory.length ? inventory.slice(0, 4).map((row) => {
                  const count = Number(row.invt_cnt) || 0;
                  return <div className="stock-row" key={row.prod_cd}><span className="stock-product"><i className={count <= 5 ? 'stock-indicator warning' : 'stock-indicator'} />{row.prod_cd}</span><span className={count <= 5 ? 'stock-count warning-text' : 'stock-count'}>{money(count)} units</span></div>;
                }) : <EmptyState loading={loading} text="No inventory has been added yet." />}
              </div>
            </article>
          </section>

          <section className="quick-section">
            <div className="quick-heading"><div><span className="panel-kicker">QUICK ACCESS</span><h2>Quick Actions</h2></div><span className="updated-label">Last updated {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="action-grid">{actions.map((action) => <button className="action-card" key={action.path} onClick={() => navigate(action.path)}><span className={`action-icon ${action.tone}`}>{action.icon}</span><span className="action-copy"><strong>{action.title}</strong><small>{action.detail}</small></span><ArrowForwardRounded className="action-arrow" /></button>)}</div>
          </section>
          <footer className="dashboard-footer">Product Sales Information System <span>·</span> Your business overview at a glance</footer>
        </div>
      </Box>
    </Box>
  );
}

function MetricCard({ title, value, icon, tone, note }) {
  return <article className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}>{icon}</span></div><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></article>;
}

function EmptyState({ loading, text }) {
  return <div className="empty-state">{loading ? 'Loading data…' : text}</div>;
}
