import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './styles/global.css';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Diary } from './pages/Diary';
import { EntryPage } from './pages/EntryPage';
import { MyEntry } from './pages/MyEntry';
import { About } from './pages/About';
import { FieldDiary } from './pages/FieldDiary';
import { NotFound } from './pages/NotFound';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="entradas" element={<Diary />} />
          <Route path="entradas/:id" element={<EntryPage />} />
          <Route path="diario" element={<FieldDiary />} />
          <Route path="mi-entrada" element={<MyEntry />} />
          <Route path="sobre-el-proyecto" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
