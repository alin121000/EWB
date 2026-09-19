import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import QuickAddSheet from './components/QuickAddSheet.jsx';
import SyncBar from './components/SyncBar.jsx';
import Toast from './components/Toast.jsx';
import NameGate from './components/NameGate.jsx';

import Today from './pages/Today.jsx';
import Workstreams from './pages/Workstreams.jsx';
import WorkstreamDetail from './pages/WorkstreamDetail.jsx';
import Tasks from './pages/Tasks.jsx';
import DailyLog from './pages/DailyLog.jsx';
import DailyLogDay from './pages/DailyLogDay.jsx';
import CloseDay from './pages/CloseDay.jsx';
import More from './pages/More.jsx';
import FieldFeedback from './pages/FieldFeedback.jsx';
import Insights from './pages/Insights.jsx';
import Meetings from './pages/Meetings.jsx';
import Photos from './pages/Photos.jsx';
import DelegationReview from './pages/DelegationReview.jsx';
import ExportPage from './pages/Export.jsx';
import SearchPage from './pages/Search.jsx';

export default function App() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <NameGate>
      <BrowserRouter>
        <div className="app-shell">
          <SyncBar />
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/workstreams" element={<Workstreams />} />
            <Route path="/workstreams/:id" element={<WorkstreamDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/log" element={<DailyLog />} />
            <Route path="/log/:dayId" element={<DailyLogDay />} />
            <Route path="/log/:dayId/close" element={<CloseDay />} />
            <Route path="/more" element={<More />} />
            <Route path="/feedback" element={<FieldFeedback />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/photos" element={<Photos />} />
            <Route path="/review" element={<DelegationReview />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
          <button className="fab" onClick={() => setQuickAddOpen(true)} aria-label="Quick add">
            +
          </button>
          <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
          <Toast />
          <BottomNav />
        </div>
      </BrowserRouter>
    </NameGate>
  );
}
