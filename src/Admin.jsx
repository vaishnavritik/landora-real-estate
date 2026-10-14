import { useCallback, useEffect, useMemo, useState } from 'react';
import './admin.css';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function Admin() {
  const [tokenInput, setTokenInput] = useState(() => sessionStorage.getItem('landoraAdminToken') || '');
  const [token, setToken] = useState(() => sessionStorage.getItem('landoraAdminToken') || '');
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadLeads = useCallback(async (adminToken = token, query = search) => {
    if (!adminToken) return;
    setLoading(true);
    setStatus('');
    try {
      const params = new URLSearchParams({ limit: '5000', search: query });
      const response = await fetch(`/api/leads?${params.toString()}`, { headers: { 'X-Admin-Token': adminToken } });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        sessionStorage.removeItem('landoraAdminToken');
        setToken('');
        setIsAuthenticated(false);
        setStatus('Access denied. Check your admin token.');
        return;
      }
      if (!response.ok) throw new Error(result.message || 'Could not load enquiries.');
      setLeads(result.leads || []);
      setTotal(result.total || 0);
      setIsAuthenticated(true);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (token) loadLeads(token, '');
  // Load only the token on first render; search is handled by the refresh button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leads;
    return leads.filter((lead) => [lead.name, lead.phone, lead.email, lead.city, lead.address, lead.interest].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [leads, search]);

  const signIn = async (event) => {
    event.preventDefault();
    const value = tokenInput.trim();
    if (!value) return;
    sessionStorage.setItem('landoraAdminToken', value);
    setToken(value);
    await loadLeads(value, '');
  };

  const logout = () => {
    sessionStorage.removeItem('landoraAdminToken');
    setToken('');
    setTokenInput('');
    setIsAuthenticated(false);
    setLeads([]);
    setTotal(0);
    setStatus('You have signed out.');
  };

  const exportExcel = async () => {
    setStatus('');
    try {
      const response = await fetch('/api/leads/export', { headers: { 'X-Admin-Token': token } });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Excel export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'landora-leads.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus('Excel workbook downloaded.');
    } catch (error) {
      setStatus(error.message || 'Excel export failed.');
    }
  };

  if (!isAuthenticated) {
    return <main className="admin-shell"><section className="admin-login"><a href="/" className="admin-brand">LANDORA <span>LEAD DESK</span></a><p className="admin-eyebrow">PRIVATE ADMIN AREA</p><h1>Manage enquiries.</h1><p className="admin-description">Sign in with the admin token configured for the Node.js backend. Only authorized users can view personal contact details or download the lead register.</p><form onSubmit={signIn} className="admin-login-form"><label htmlFor="admin-token">Admin token</label><input id="admin-token" type="password" autoComplete="current-password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} required placeholder="Enter admin token" /><button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Open lead dashboard'}</button></form>{status && <p className="admin-status" role="status">{status}</p>}<a className="admin-back" href="/">← Back to website</a></section></main>;
  }

  return <main className="admin-shell admin-dashboard"><header className="admin-topbar"><a href="/" className="admin-brand">LANDORA <span>LEAD DESK</span></a><div className="admin-top-actions"><a href="/">View website ↗</a><button onClick={logout} className="admin-logout">Sign out</button></div></header><section className="admin-main"><div className="admin-heading-row"><div><p className="admin-eyebrow">ENQUIRY MANAGEMENT</p><h1>Lead dashboard</h1><p className="admin-description">Submissions are saved by the backend and synchronized to the Excel workbook on the server.</p></div><button className="export-button" onClick={exportExcel}>↓ Download Excel</button></div><div className="admin-stats"><article><span>Total enquiries</span><strong>{total}</strong></article><article><span>Displayed here</span><strong>{visibleLeads.length}</strong></article><article><span>Export format</span><strong>XLSX</strong></article></div><div className="admin-table-panel"><div className="admin-table-toolbar"><div><h2>Submitted enquiries</h2><p>Names, phone numbers, contact preferences and property interests.</p></div><div className="admin-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email, city…" aria-label="Search leads"/><button onClick={() => loadLeads(token, search)} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></div></div>{status && <p className="admin-status" role="status">{status}</p>}<div className="admin-table-wrap"><table className="leads-table"><thead><tr><th>Submitted</th><th>Name / phone</th><th>Email</th><th>Address</th><th>Interest</th><th>Budget</th><th>Contact via</th><th>Message</th></tr></thead><tbody>{visibleLeads.map((lead) => <tr key={lead.id}><td className="date-cell">{formatDate(lead.createdAt)}</td><td><strong>{lead.name}</strong><a href={`tel:${lead.phone}`} className="lead-phone">{lead.phone}</a></td><td>{lead.email || '—'}</td><td>{[lead.address, lead.city, lead.postalCode].filter(Boolean).join(', ') || '—'}</td><td>{lead.interest || 'General enquiry'}<small>{lead.selectedListing && lead.selectedListing !== 'General enquiry' ? `Listing: ${lead.selectedListing}` : ''}{lead.plotSize ? `${lead.selectedListing && lead.selectedListing !== 'General enquiry' ? ' · ' : ''}Plot size: ${lead.plotSize}` : ''}</small></td><td>{lead.budget || '—'}</td><td>{lead.preferredContact || 'Phone'}</td><td className="message-cell">{lead.message || '—'}</td></tr>)}</tbody></table>{!visibleLeads.length && <div className="admin-empty"><strong>{search ? 'No enquiries match your search' : 'No enquiries yet'}</strong><p>{search ? 'Try another name, phone number or city.' : 'New website form submissions will appear here automatically.'}</p></div>}</div></div><p className="admin-footnote">Keep this page private. Do not share exported contact data with people who do not need access.</p></section></main>;
}
