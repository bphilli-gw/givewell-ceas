import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Overview from './pages/Overview';
import CountryDetail from './pages/CountryDetail';
import Sensitivity from './pages/Sensitivity';
import Compare from './pages/Compare';
import ExploreIndex from './pages/ExploreIndex';
import ExploreIR from './pages/ExploreIR';
import ExploreDurability from './pages/ExploreDurability';
import ExploreCoverage from './pages/ExploreCoverage';
import ExploreMortality from './pages/ExploreMortality';
import ExploreLF from './pages/ExploreLF';
import SMCOverview from './pages/smc/Overview';
import SMCCountryDetail from './pages/smc/CountryDetail';
import SMCSensitivity from './pages/smc/Sensitivity';
import SMCCompare from './pages/smc/Compare';
import VASOverview from './pages/vas/Overview';
import VASCountryDetail from './pages/vas/CountryDetail';
import VASSensitivity from './pages/vas/Sensitivity';
import VASCompare from './pages/vas/Compare';
import NIOverview from './pages/ni/Overview';
import NICountryDetail from './pages/ni/CountryDetail';
import NISensitivity from './pages/ni/Sensitivity';
import NICompare from './pages/ni/Compare';

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
          <Route path="itn/explore" element={<ExploreIndex />} />
          <Route path="itn/explore/durability" element={<ExploreDurability />} />
          <Route path="itn/explore/insecticide-resistance" element={<ExploreIR />} />
          <Route path="itn/explore/coverage" element={<ExploreCoverage />} />
          <Route path="itn/explore/malaria-mortality" element={<ExploreMortality />} />
          <Route path="itn/explore/leverage-funging" element={<ExploreLF />} />

          {/* SMC routes */}
          <Route path="smc" element={<SMCOverview />} />
          <Route path="smc/country/:id" element={<SMCCountryDetail />} />
          <Route path="smc/sensitivity" element={<SMCSensitivity />} />
          <Route path="smc/compare" element={<SMCCompare />} />

          {/* VAS routes */}
          <Route path="vas" element={<VASOverview />} />
          <Route path="vas/country/:id" element={<VASCountryDetail />} />
          <Route path="vas/sensitivity" element={<VASSensitivity />} />
          <Route path="vas/compare" element={<VASCompare />} />

          {/* NI routes */}
          <Route path="ni" element={<NIOverview />} />
          <Route path="ni/country/:id" element={<NICountryDetail />} />
          <Route path="ni/sensitivity" element={<NISensitivity />} />
          <Route path="ni/compare" element={<NICompare />} />

          {/* Legacy redirects */}
          <Route path="sensitivity" element={<Navigate to="/itn/sensitivity" replace />} />
          <Route path="compare" element={<Navigate to="/itn/compare" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
