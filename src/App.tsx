import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import CountryDetail from './pages/CountryDetail';
import Sensitivity from './pages/Sensitivity';
import Compare from './pages/Compare';

export default function App() {
  return (
    <BrowserRouter basename="/givewell-ceas">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="country/:id" element={<CountryDetail />} />
          <Route path="sensitivity" element={<Sensitivity />} />
          <Route path="compare" element={<Compare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
