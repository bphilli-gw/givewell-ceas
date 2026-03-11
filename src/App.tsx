import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Overview from './pages/Overview';
import CountryDetail from './pages/CountryDetail';
import Sensitivity from './pages/Sensitivity';
import Compare from './pages/Compare';
import ExploreIR from './pages/ExploreIR';
import SMCOverview from './pages/smc/Overview';
import SMCCountryDetail from './pages/smc/CountryDetail';
import SMCSensitivity from './pages/smc/Sensitivity';
import SMCCompare from './pages/smc/Compare';

export default function App() {
  return (
    <BrowserRouter basename="/givewell-ceas">
      <Routes>
        <Route element={<Layout />}>
          {/* Landing page */}
          <Route index element={<Home />} />

          {/* ITN routes */}
          <Route path="itn" element={<Overview />} />
          <Route path="itn/country/:id" element={<CountryDetail />} />
          <Route path="itn/sensitivity" element={<Sensitivity />} />
          <Route path="itn/compare" element={<Compare />} />
          <Route path="itn/explore/insecticide-resistance" element={<ExploreIR />} />

          {/* SMC routes */}
          <Route path="smc" element={<SMCOverview />} />
          <Route path="smc/country/:id" element={<SMCCountryDetail />} />
          <Route path="smc/sensitivity" element={<SMCSensitivity />} />
          <Route path="smc/compare" element={<SMCCompare />} />

          {/* Legacy redirects */}
          <Route path="sensitivity" element={<Navigate to="/itn/sensitivity" replace />} />
          <Route path="compare" element={<Navigate to="/itn/compare" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
