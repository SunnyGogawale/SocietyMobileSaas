import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import './App.css'

const navigation = [
  {
    group: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'residents', label: 'Residents', icon: Users },
      { id: 'maintenance', label: 'Maintenance', icon: Receipt },
      { id: 'complaints', label: 'Complaints', icon: MessageSquare },
      { id: 'visitors', label: 'Visitors & security', icon: ShieldCheck },
      { id: 'facilities', label: 'Facilities', icon: CalendarDays },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'accounting', label: 'Accounting', icon: Wallet },
      { id: 'staff', label: 'Staff & vendors', icon: Building2 },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'communication', label: 'Communication', icon: Megaphone },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    group: 'Platform',
    items: [
      { id: 'societies', label: 'Societies', icon: Building2 },
      { id: 'subscriptions', label: 'Subscriptions', icon: Receipt },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

const roleModules = {
  'Society Admin': ['overview', 'residents', 'maintenance', 'complaints', 'visitors', 'facilities', 'accounting', 'staff', 'documents', 'communication', 'reports', 'settings'],
  'Society Manager': ['overview', 'residents', 'maintenance', 'complaints', 'visitors', 'facilities', 'staff', 'documents', 'communication', 'reports'],
  Accountant: ['overview', 'maintenance', 'accounting', 'reports', 'documents'],
  Resident: ['overview', 'maintenance', 'complaints', 'visitors', 'facilities', 'documents', 'communication'],
  'Security Guard': ['overview', 'visitors', 'complaints'],
  'Super Admin': ['overview', 'societies', 'subscriptions', 'residents', 'maintenance', 'complaints', 'accounting', 'reports', 'settings'],
}

const moduleDetails = {
  residents: { title: 'Residents', description: 'People and households across your community', action: 'Invite resident', columns: ['Resident', 'Unit', 'Member since', 'Status'] },
  maintenance: { title: 'Maintenance', description: 'Bills, collections, and outstanding dues', action: 'Create bill', columns: ['Bill', 'Unit', 'Due date', 'Amount', 'Status'] },
  complaints: { title: 'Complaints', description: 'Track requests and keep every resolution moving', action: 'New request', columns: ['Request', 'Category', 'Updated', 'Assigned to', 'Status'] },
  visitors: { title: 'Visitors & security', description: 'Live entry log and pre-approved visitors', action: 'Pre-approve visitor', columns: ['Visitor', 'Purpose', 'Entry time', 'Host unit', 'Status'] },
  facilities: { title: 'Facilities', description: 'Bookings and availability for shared spaces', action: 'Add facility', columns: ['Facility', 'Booked by', 'Date & time', 'Charge', 'Status'] },
  accounting: { title: 'Accounting', description: 'Income, expenses, and society transactions', action: 'Record transaction', columns: ['Transaction', 'Category', 'Date', 'Amount', 'Status'] },
  staff: { title: 'Staff & vendors', description: 'People and partners who keep the society running', action: 'Add staff member', columns: ['Name', 'Role', 'Contact', 'Joined', 'Status'] },
  documents: { title: 'Documents', description: 'Society records, rules, and important files', action: 'Upload document', columns: ['Document', 'Category', 'Updated', 'Access', 'Status'] },
  communication: { title: 'Communication', description: 'Notices, events, and updates for residents', action: 'Create announcement', columns: ['Announcement', 'Audience', 'Published', 'Reach', 'Status'] },
  reports: { title: 'Reports & analytics', description: 'A closer look at your society’s activity', action: 'Export report', columns: ['Report', 'Period', 'Generated', 'Owner', 'Status'] },
  societies: { title: 'Societies', description: 'Manage organizations on the SocietyOS platform', action: 'Add society', columns: ['Society', 'Location', 'Plan', 'Residents', 'Status'] },
  subscriptions: { title: 'Subscriptions', description: 'Plans, renewals, and platform billing', action: 'Create plan', columns: ['Subscription', 'Plan', 'Renewal', 'Amount', 'Status'] },
  settings: { title: 'Platform settings', description: 'Configure access and platform preferences', action: 'Save changes', columns: ['Setting', 'Category', 'Last updated', 'Updated by', 'Status'] },
}

const records = {
  residents: [
    { subject: 'Aarav Sharma', detail: 'B-1204 · Owner', date: '14 Feb 2022', status: 'Active' },
    { subject: 'Meera Joshi', detail: 'A-602 · Tenant', date: '03 Mar 2023', status: 'Active' },
    { subject: 'Rohan Desai', detail: 'C-801 · Owner', date: '21 Aug 2021', status: 'Active' },
    { subject: 'Ananya Iyer', detail: 'B-503 · Tenant', date: '11 Jan 2024', status: 'Pending' },
    { subject: 'Kabir Mehta', detail: 'A-1102 · Owner', date: '27 Sep 2020', status: 'Active' },
    { subject: 'Diya Nair', detail: 'C-204 · Family member', date: '05 Jun 2022', status: 'Active' },
  ],
  maintenance: [
    { subject: 'April maintenance', detail: 'Monthly charge · B-1204', date: '10 Apr 2025', amount: '₹4,500', status: 'Paid' },
    { subject: 'April maintenance', detail: 'Monthly charge · A-602', date: '10 Apr 2025', amount: '₹4,500', status: 'Overdue' },
    { subject: 'Parking fee', detail: 'Annual charge · C-801', date: '15 Apr 2025', amount: '₹1,200', status: 'Pending' },
    { subject: 'April maintenance', detail: 'Monthly charge · B-503', date: '10 Apr 2025', amount: '₹4,500', status: 'Paid' },
    { subject: 'Late fee', detail: 'Outstanding balance · A-1102', date: '18 Apr 2025', amount: '₹250', status: 'Overdue' },
  ],
  complaints: [
    { subject: 'Lift not responding', detail: 'CMP-204 · Electrical', date: 'Today, 9:18 AM', assigned: 'Ramesh P.', status: 'In progress' },
    { subject: 'Water pressure is low', detail: 'CMP-203 · Plumbing', date: 'Today, 8:42 AM', assigned: 'Facilities', status: 'Open' },
    { subject: 'Clubhouse AC repair', detail: 'CMP-202 · Maintenance', date: 'Yesterday', assigned: 'CoolAir Services', status: 'In progress' },
    { subject: 'Street light near gate', detail: 'CMP-201 · Electrical', date: '22 Mar 2025', assigned: 'Ramesh P.', status: 'Resolved' },
  ],
  visitors: [
    { subject: 'Meera Joshi', detail: 'Guest · MH 02 DN 4821', date: 'Today, 10:42 AM', assigned: 'A-602', status: 'Inside' },
    { subject: 'BlueDart delivery', detail: 'Delivery · No vehicle', date: 'Today, 10:25 AM', assigned: 'B-1204', status: 'Inside' },
    { subject: 'Sanjay Patil', detail: 'Cab · MH 12 KL 3018', date: 'Today, 9:58 AM', assigned: 'C-801', status: 'Checked out' },
    { subject: 'Urban Company', detail: 'Service · Pre-approved', date: 'Today, 9:30 AM', assigned: 'B-503', status: 'Expected' },
  ],
  facilities: [
    { subject: 'Clubhouse', detail: 'Birthday gathering · 35 guests', date: '29 Mar · 6:00 PM', amount: '₹2,000', status: 'Approved' },
    { subject: 'Tennis court', detail: 'Rohan Desai · 2 guests', date: '29 Mar · 7:30 AM', amount: 'Free', status: 'Confirmed' },
    { subject: 'Banquet hall', detail: 'Ananya Iyer · 60 guests', date: '30 Mar · 5:00 PM', amount: '₹4,500', status: 'Pending' },
    { subject: 'Guest suite', detail: 'Aarav Sharma · 2 nights', date: '02 Apr · 2:00 PM', amount: '₹3,000', status: 'Approved' },
  ],
  accounting: [
    { subject: 'Maintenance collection', detail: 'April · 38 payments', date: 'Today', amount: '+₹1,71,000', status: 'Completed' },
    { subject: 'Lift servicing', detail: 'Kone Elevators · Invoice 1182', date: 'Yesterday', amount: '−₹24,500', status: 'Paid' },
    { subject: 'Security payroll', detail: 'March · 8 guards', date: '25 Mar 2025', amount: '−₹96,000', status: 'Processed' },
    { subject: 'Clubhouse booking', detail: 'Weekend reservations', date: '24 Mar 2025', amount: '+₹12,000', status: 'Completed' },
  ],
  staff: [
    { subject: 'Ramesh Patil', detail: 'Maintenance technician', date: '12 Jun 2020', assigned: '+91 98765 43210', status: 'On duty' },
    { subject: 'Sunita More', detail: 'Housekeeping supervisor', date: '03 Feb 2021', assigned: '+91 98220 12345', status: 'On duty' },
    { subject: 'Securitas India', detail: 'Security vendor · 8 guards', date: '01 Apr 2023', assigned: 'Annual contract', status: 'Active' },
    { subject: 'CoolAir Services', detail: 'HVAC vendor', date: '16 Nov 2022', assigned: 'Annual contract', status: 'Active' },
  ],
  documents: [
    { subject: 'Society bylaws 2024.pdf', detail: 'Governance · 2.4 MB', date: '12 Jan 2025', assigned: 'All residents', status: 'Current' },
    { subject: 'AGM meeting minutes.pdf', detail: 'Meetings · 1.1 MB', date: '08 Jan 2025', assigned: 'Committee', status: 'Current' },
    { subject: 'Fire safety certificate.pdf', detail: 'Compliance · Expires 30 Apr', date: '04 Dec 2024', assigned: 'Society admin', status: 'Expiring' },
    { subject: 'Lift maintenance contract.pdf', detail: 'Vendor contracts · 840 KB', date: '01 Nov 2024', assigned: 'Committee', status: 'Current' },
  ],
  communication: [
    { subject: 'Water tank cleaning', detail: 'Scheduled maintenance', date: 'Today · 9:00 AM', assigned: 'All residents', status: 'Published' },
    { subject: 'Annual general meeting', detail: 'Meeting · Clubhouse', date: 'Yesterday', assigned: 'All residents', status: 'Published' },
    { subject: 'Spring festival sign-up', detail: 'Community event', date: '24 Mar 2025', assigned: 'All residents', status: 'Draft' },
    { subject: 'Pool maintenance notice', detail: 'Facility update', date: '22 Mar 2025', assigned: 'Tower A, B', status: 'Published' },
  ],
  reports: [
    { subject: 'Collection summary', detail: 'Maintenance and other charges', date: 'March 2025', assigned: 'Accountant', status: 'Ready' },
    { subject: 'Complaint resolution', detail: 'Volume, turnaround, feedback', date: 'March 2025', assigned: 'Society admin', status: 'Ready' },
    { subject: 'Visitor activity', detail: 'Entry and exit log', date: 'March 2025', assigned: 'Security', status: 'Ready' },
    { subject: 'Occupancy report', detail: 'Units, residents, move-ins', date: 'Q1 2025', assigned: 'Society admin', status: 'Ready' },
  ],
  societies: [
    { subject: 'Maple Grove Residences', detail: 'Pune, Maharashtra', date: '03 Jan 2024', amount: '342 residents', status: 'Active' },
    { subject: 'The Canopy', detail: 'Mumbai, Maharashtra', date: '18 Feb 2024', amount: '216 residents', status: 'Trial' },
    { subject: 'Cedar Park', detail: 'Bengaluru, Karnataka', date: '07 May 2024', amount: '508 residents', status: 'Active' },
    { subject: 'Lakeside One', detail: 'Hyderabad, Telangana', date: '22 Jun 2024', amount: '144 residents', status: 'Past due' },
  ],
  subscriptions: [
    { subject: 'Maple Grove Residences', detail: 'Growth · 300–500 units', date: '01 Apr 2025', amount: '₹8,999 / mo', status: 'Active' },
    { subject: 'The Canopy', detail: 'Starter · Trial period', date: '05 Apr 2025', amount: '₹0', status: 'Trial' },
    { subject: 'Cedar Park', detail: 'Enterprise · 500+ units', date: '12 Apr 2025', amount: '₹14,999 / mo', status: 'Active' },
    { subject: 'Lakeside One', detail: 'Growth · Payment retry', date: '27 Mar 2025', amount: '₹8,999 / mo', status: 'Past due' },
  ],
  settings: [
    { subject: 'Resident directory visibility', detail: 'Privacy and access', date: 'Today', assigned: 'S. Mehta', status: 'Enabled' },
    { subject: 'Maintenance billing cycle', detail: 'Billing preferences', date: '12 Mar 2025', assigned: 'A. Rao', status: 'Enabled' },
    { subject: 'Visitor OTP verification', detail: 'Security preferences', date: '08 Mar 2025', assigned: 'S. Mehta', status: 'Enabled' },
    { subject: 'Late fee after due date', detail: 'Billing preferences', date: '01 Mar 2025', assigned: 'A. Rao', status: 'Enabled' },
  ],
}

const recentActivity = [
  { title: 'Maintenance payment received', detail: 'Aarav Sharma · B-1204', time: '11:24 AM', amount: '+₹4,500', type: 'positive' },
  { title: 'New complaint submitted', detail: 'Water pressure is low · A-602', time: '10:42 AM', amount: 'CMP-203', type: 'warning' },
  { title: 'Visitor checked in', detail: 'Meera Joshi · Guest of B-1204', time: '10:18 AM', amount: 'At gate', type: 'neutral' },
]

const notifications = [
  { title: '3 maintenance bills are overdue', time: '12 minutes ago', icon: Receipt },
  { title: 'New complaint in Tower B', time: '38 minutes ago', icon: MessageSquare },
  { title: 'Fire safety certificate expires soon', time: 'Yesterday', icon: FileText },
]

const chartBars = [42, 61, 48, 77, 56, 84, 72, 92, 68, 86, 63, 76, 95, 80]

function App() {
  const [activeModule, setActiveModule] = useState('overview')
  const [activeRole, setActiveRole] = useState('Society Admin')
  const [search, setSearch] = useState('')
  const [darkTheme, setDarkTheme] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalModule, setModalModule] = useState('overview')
  const [toast, setToast] = useState('')

  const visibleNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) => roleModules[activeRole]?.includes(item.id)),
  })).filter((group) => group.items.length > 0)
  const activeDetails = moduleDetails[activeModule]
  const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const visibleRows = (records[activeModule] ?? []).filter((record) =>
    Object.values(record).join(' ').toLowerCase().includes(search.toLowerCase()),
  )
  const pageTitle = activeModule === 'overview' ? 'Good morning, Samira' : activeDetails?.title ?? 'Overview'

  function selectModule(module) {
    setActiveModule(module)
    setSearch('')
    setSidebarOpen(false)
  }

  function changeRole(event) {
    const nextRole = event.target.value
    setActiveRole(nextRole)
    if (!roleModules[nextRole].includes(activeModule)) setActiveModule('overview')
    setSearch('')
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function openAction(module = activeModule) {
    const targetModule = typeof module === 'string' ? module : activeModule
    if (targetModule === 'reports') {
      showToast('Your report is being prepared for export.')
      return
    }
    setModalModule(targetModule)
    setModalOpen(true)
  }

  function submitAction(event) {
    event.preventDefault()
    setModalOpen(false)
    showToast('Your changes have been saved.')
  }

  const actionLabel = activeModule === 'overview'
    ? 'Invite resident'
    : activeDetails?.action ?? 'Create new'

  return (
    <div className={`app-shell${darkTheme ? ' dark-theme' : ''}`}>
      {sidebarOpen && <button className="mobile-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Building2 size={20} strokeWidth={2.2} /></div>
          <span>society<span className="brand-light">OS</span></span>
          <button className="icon-button sidebar-close" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <button className="community-switcher" type="button" onClick={() => showToast('You are viewing Maple Grove Residences.')}>
          <span className="community-avatar">MG</span>
          <span className="community-copy"><strong>Maple Grove</strong><small>Residential society</small></span>
          <ChevronDown size={15} />
        </button>

        <nav className="side-nav" aria-label="Main navigation">
          {visibleNavigation.map((group) => (
            <div className="nav-group" key={group.group}>
              <p className="nav-label">{group.group}</p>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button className={`nav-item${activeModule === id ? ' active' : ''}`} key={id} type="button" onClick={() => selectModule(id)}>
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                  {id === 'complaints' && <span className="nav-count">3</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><CircleHelp size={16} /></span>
            <div><strong>Need a hand?</strong><span>Visit the help centre</span></div>
            <ArrowUpRight size={15} />
          </div>
          <button className="profile-button" type="button" onClick={() => showToast('Account settings are up to date.')}>
            <span className="profile-avatar">SM</span>
            <span className="profile-copy"><strong>Samira Mehta</strong><small>{activeRole}</small></span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Maple Grove</span><span className="breadcrumb-divider">/</span><strong>{activeDetails?.title ?? 'Overview'}</strong></div>
          <div className="topbar-actions">
            <label className="role-picker">
              <span className="role-dot" />
              <select aria-label="Preview role" value={activeRole} onChange={changeRole}>
                {Object.keys(roleModules).map((role) => <option key={role}>{role}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
            <div className="topbar-search"><Search size={17} /><input aria-label="Search this page" placeholder="Search anything..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div>
            <button className="icon-button theme-toggle" type="button" aria-label={darkTheme ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDarkTheme(!darkTheme)}>{darkTheme ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="notification-wrap">
              <button className={`icon-button notification-button${notificationsOpen ? ' selected' : ''}`} type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={18} /><span className="notification-dot" /></button>
              {notificationsOpen && <div className="notification-popover"><div className="popover-heading"><strong>Notifications</strong><button type="button" onClick={() => { setNotificationsOpen(false); showToast('All caught up.')}}>Mark all read</button></div>{notifications.map(({ title, time, icon: Icon }) => <div className="notification-item" key={title}><span className="notification-icon"><Icon size={16} /></span><span><strong>{title}</strong><small>{time}</small></span></div>)}</div>}
            </div>
            <button className="topbar-avatar" type="button" aria-label="Open Samira Mehta profile" onClick={() => showToast('Signed in as Samira Mehta.')}>SM</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> {todayLabel}</div>
              <h1>{pageTitle}</h1>
              <p>{activeModule === 'overview' ? 'Here’s what’s happening in your community today.' : activeDetails?.description}</p>
            </div>
            <div className="heading-actions">
              {activeModule === 'overview' && <button className="date-button" type="button" onClick={() => showToast('Showing activity for the last 30 days.')}><CalendarDays size={16} /> Last 30 days <ChevronDown size={14} /></button>}
              <button className="primary-button" type="button" onClick={openAction}><Plus size={17} /> {actionLabel}</button>
            </div>
          </div>

          {activeModule === 'overview' ? (
            <Overview onAction={openAction} />
          ) : (
            <ModulePage
              activeModule={activeModule}
              details={activeDetails}
              rows={visibleRows}
              search={search}
              onAction={openAction}
              onClear={() => setSearch('')}
              onToast={showToast}
            />
          )}
        </div>
      </main>

      {modalOpen && <ActionModal title={moduleDetails[modalModule]?.action ?? 'Invite resident'} module={modalModule} onClose={() => setModalOpen(false)} onSubmit={submitAction} />}
      {toast && <div className="toast-message" role="status"><span><Check size={15} /></span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  )
}

function Overview({ onAction }) {
  return (
    <>
      <section className="stat-grid" aria-label="Society summary">
        <StatCard icon={Building2} label="Total units" value="248" change="6 new this quarter" tone="green" trend="up" />
        <StatCard icon={Users} label="Active residents" value="612" change="94% occupancy" tone="blue" trend="up" />
        <StatCard icon={Receipt} label="Collected this month" value="₹8.42L" change="+12.8% vs last month" tone="amber" trend="up" />
        <StatCard icon={MessageSquare} label="Open requests" value="08" change="3 need attention" tone="rose" trend="down" />
      </section>

      <section className="dashboard-grid">
        <div className="panel collection-panel">
          <div className="panel-heading"><div><p className="section-kicker">FINANCIAL OVERVIEW</p><h2>Collection overview</h2></div><button className="more-button" type="button" aria-label="More collection options" onClick={() => onAction('accounting')}><MoreHorizontal size={20} /></button></div>
          <div className="collection-total"><strong>₹8,42,650</strong><span className="trend-pill"><ArrowUpRight size={14} /> 12.8%</span><small>collected in March</small></div>
          <div className="chart-area" role="img" aria-label="Collection trend over the last two weeks, generally trending upward">
            <div className="chart-y-labels"><span>₹10L</span><span>₹7.5L</span><span>₹5L</span><span>₹2.5L</span></div>
            <div className="bar-chart">{chartBars.map((height, index) => <div className={`chart-bar${index === chartBars.length - 2 ? ' chart-bar-current' : ''}`} key={`${height}-${index}`} style={{ '--bar-height': `${height}%` }}><span /></div>)}</div>
            <div className="chart-x-labels"><span>Mar 14</span><span>Mar 18</span><span>Mar 22</span><span>Mar 27</span></div>
          </div>
          <div className="chart-legend"><span><i className="legend-current" /> This month</span><span><i className="legend-previous" /> Previous month</span></div>
        </div>

        <div className="panel dues-panel">
          <div className="panel-heading"><div><p className="section-kicker">BILLING STATUS</p><h2>Monthly maintenance</h2></div><button className="more-button" type="button" aria-label="More billing options" onClick={() => onAction('maintenance')}><MoreHorizontal size={20} /></button></div>
          <div className="dues-summary"><div><strong>₹11.16L</strong><small>Expected collection</small></div><div className="donut-chart" aria-label="76 percent collected"><div><strong>76%</strong><small>collected</small></div></div></div>
          <div className="progress-track"><span /></div>
          <div className="dues-breakdown"><span><i className="dot-green" /> Collected <strong>₹8.42L</strong></span><span><i className="dot-amber" /> Outstanding <strong>₹2.74L</strong></span></div>
          <button className="text-link" type="button" onClick={() => onAction('maintenance')}>View collection report <ArrowUpRight size={15} /></button>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel activity-panel">
          <div className="panel-heading"><div><p className="section-kicker">LIVE UPDATES</p><h2>Recent activity</h2></div><button className="subtle-button" type="button" onClick={() => onAction('reports')}>View all <ArrowUpRight size={14} /></button></div>
          <div className="activity-list">{recentActivity.map((item) => <ActivityRow key={item.title} item={item} />)}</div>
        </div>
        <div className="panel attention-panel">
          <div className="panel-heading"><div><p className="section-kicker">NEEDS YOUR ATTENTION</p><h2>Quick follow-ups</h2></div><span className="attention-count">3</span></div>
          <button className="follow-up" type="button" onClick={() => onAction('maintenance')}><span className="follow-icon follow-amber"><Receipt size={17} /></span><span><strong>3 overdue maintenance bills</strong><small>₹13,500 outstanding across 3 units</small></span><ArrowUpRight size={16} /></button>
          <button className="follow-up" type="button" onClick={() => onAction('complaints')}><span className="follow-icon follow-rose"><Clock3 size={17} /></span><span><strong>2 requests nearing deadline</strong><small>One has been open for 3 days</small></span><ArrowUpRight size={16} /></button>
          <button className="follow-up" type="button" onClick={() => onAction('documents')}><span className="follow-icon follow-blue"><FileText size={17} /></span><span><strong>Fire safety certificate expires</strong><small>Renew by 30 April 2025</small></span><ArrowUpRight size={16} /></button>
        </div>
      </section>

      <section className="panel occupancy-panel">
        <div className="panel-heading"><div><p className="section-kicker">YOUR COMMUNITY</p><h2>Society at a glance</h2></div><span className="occupancy-caption">Updated just now</span></div>
        <div className="occupancy-grid">
          <div className="occupancy-stat"><span className="occupancy-icon icon-green"><Building2 size={18} /></span><span><strong>248</strong><small>Total flats</small></span><span className="occupancy-note">Across 4 wings</span></div>
          <div className="occupancy-stat"><span className="occupancy-icon icon-blue"><Users size={18} /></span><span><strong>231</strong><small>Occupied</small></span><span className="occupancy-note">17 vacant units</span></div>
          <div className="occupancy-stat"><span className="occupancy-icon icon-amber"><ShieldCheck size={18} /></span><span><strong>42</strong><small>Visitors today</small></span><span className="occupancy-note">6 currently inside</span></div>
          <div className="occupancy-stat"><span className="occupancy-icon icon-rose"><CalendarDays size={18} /></span><span><strong>16</strong><small>Bookings this week</small></span><span className="occupancy-note">4 pending approval</span></div>
        </div>
      </section>
      <footer className="page-footer"><span>© 2025 SocietyOS</span><span>Maple Grove Residences <i /> All systems operational</span></footer>
    </>
  )
}

function StatCard({ icon: Icon, label, value, change, tone, trend }) {
  return <article className="stat-card"><span className={`stat-icon tone-${tone}`}><Icon size={18} strokeWidth={1.9} /></span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className={`stat-change ${trend === 'down' ? 'change-neutral' : ''}`}>{trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{change}</span></article>
}

function ActivityRow({ item }) {
  const Icon = item.type === 'positive' ? Check : item.type === 'warning' ? MessageSquare : ShieldCheck
  return <div className="activity-row"><span className={`activity-icon activity-${item.type}`}><Icon size={16} /></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="activity-meta"><strong>{item.amount}</strong><small>{item.time}</small></span></div>
}

function ModulePage({ activeModule, details, rows, search, onAction, onClear, onToast }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('az')
  const [requestedPage, setRequestedPage] = useState(1)
  const subjectLabel = details.columns[0]
  const filteredRows = rows.filter((row) => statusFilter === 'all' || row.status.toLowerCase() === statusFilter)
  const sortedRows = [...filteredRows].sort((first, second) => {
    const firstValue = sortOrder === 'status' ? first.status : first.subject
    const secondValue = sortOrder === 'status' ? second.status : second.subject
    return firstValue.localeCompare(secondValue) * (sortOrder === 'za' ? -1 : 1)
  })
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const currentPage = Math.min(requestedPage, pageCount)
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const statuses = [...new Set(rows.map((row) => row.status))]
  return (
    <>
      <section className="module-summary">
        <div className="module-summary-item"><span className="summary-dot summary-green" /><span><strong>{filteredRows.length.toString().padStart(2, '0')}</strong><small>{activeModule === 'residents' ? 'Showing in directory' : 'Items in this view'}</small></span></div>
        <div className="module-summary-item"><span className="summary-dot summary-amber" /><span><strong>{activeModule === 'maintenance' ? '₹2.74L' : activeModule === 'complaints' ? '03' : '04'}</strong><small>{activeModule === 'maintenance' ? 'Outstanding balance' : activeModule === 'complaints' ? 'Awaiting resolution' : 'Need attention'}</small></span></div>
        <button className="summary-export" type="button" onClick={() => onToast('Your export is being prepared.')}><FileText size={16} /> Export</button>
      </section>
      <section className="panel data-panel">
        <div className="table-toolbar"><div><h2>{subjectLabel}</h2><p>{search ? `${filteredRows.length} results for “${search}”` : 'A clear view of the latest records'}</p></div><div className="table-actions"><label className="filter-button"><span>{statusFilter === 'all' ? 'All status' : statuses.find((status) => status.toLowerCase() === statusFilter)}</span><ChevronDown size={14} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setRequestedPage(1) }}><option value="all">All status</option>{statuses.map((status) => <option value={status.toLowerCase()} key={status}>{status}</option>)}</select></label><label className="filter-button sort-filter"><span>{sortOrder === 'az' ? 'A to Z' : sortOrder === 'za' ? 'Z to A' : 'By status'}</span><ChevronDown size={14} /><select aria-label="Sort records" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="az">A to Z</option><option value="za">Z to A</option><option value="status">By status</option></select></label><button className="more-button bordered-more" type="button" aria-label="More table options" onClick={() => onToast('More list options coming soon.')}><MoreHorizontal size={19} /></button></div></div>
        <div className="table-scroll"><table><thead><tr>{details.columns.map((column) => <th key={column}>{column}</th>)}<th aria-label="Actions" /></tr></thead><tbody>{pageRows.map((row) => <tr key={`${row.subject}-${row.date}`}><td><div className="table-primary">{activeModule === 'residents' && <span className="resident-avatar">{row.subject.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>}<span><strong>{row.subject}</strong><small>{row.detail}</small></span></div></td><td>{row.detail}</td><td>{row.date}</td>{details.columns.length > 4 && <td className="amount-cell">{row.amount ?? row.assigned ?? '—'}</td>}<td><span className={`status-badge status-${row.status.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`}><i />{row.status}</span></td><td><button className="row-action" type="button" aria-label={`More actions for ${row.subject}`} onClick={() => onToast(`Opened ${row.subject}.`)}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>
        {filteredRows.length === 0 && <div className="empty-state"><span><Search size={20} /></span><strong>No matching records</strong><p>Try a different search or clear your filter.</p>{search && <button type="button" onClick={onClear}>Clear search</button>}</div>}
        <div className="table-footer"><span>Showing <strong>{sortedRows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedRows.length)}</strong> of <strong>{sortedRows.length}</strong> records</span><div className="pagination"><button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setRequestedPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button className={page === currentPage ? 'page-active' : ''} type="button" key={page} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => setRequestedPage(page)}>{page}</button>)}<button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setRequestedPage(currentPage + 1)}>›</button></div></div>
      </section>
      <div className="module-bottom-grid"><div className="module-note"><span className="note-icon"><Clock3 size={17} /></span><span><strong>Everything up to date</strong><small>Last synced a few moments ago</small></span><Check size={16} /></div><button className="module-add-card" type="button" onClick={onAction}><span><Plus size={17} /></span><strong>{details.action}</strong><small>Keep your society information current</small></button></div>
    </>
  )
}

function ActionModal({ title, module, onClose, onSubmit }) {
  const isInvite = module === 'residents' || module === 'overview'
  const isBilling = module === 'maintenance'
  const firstLabel = isInvite ? 'Resident name' : isBilling ? 'Bill name' : module === 'visitors' ? 'Visitor name' : 'Name'
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="action-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><span className="modal-icon"><UserPlus size={19} /></span><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div><h2 id="modal-title">{title}</h2><p>{isInvite ? 'Send an invitation to join your society directory.' : isBilling ? 'Set up a charge for one or more units.' : 'Add the details below to continue.'}</p><form onSubmit={onSubmit}><label>{firstLabel}<input autoFocus required placeholder={isInvite ? 'e.g. Priya Shah' : isBilling ? 'e.g. April maintenance' : 'Enter a name'} /></label><label>{isInvite ? 'Email address' : isBilling ? 'Amount' : 'Details'}<input required type={isInvite ? 'email' : 'text'} placeholder={isInvite ? 'name@example.com' : isBilling ? '₹ 0.00' : 'Add a short description'} /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Check size={16} /> Save {title.toLowerCase()}</button></div></form></section></div>
}

export default App
