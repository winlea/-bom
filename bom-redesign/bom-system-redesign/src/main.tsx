import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import HomePage from '@/pages/home';
import ProjectsPage from '@/pages/projects';
import ProjectEditPage from '@/pages/project-edit';
import PartsPage from '@/pages/parts';
import DimensionsPage from '@/pages/dimensions';
import DimensionsAddPage from '@/pages/dimensions-add';
import PartDetailPage from '@/pages/part-detail';
import PartEditPage from '@/pages/part-edit';
import TemplatePreviewPage from '@/pages/template-preview';
import DesignerPage from '@/pages/designer';
import ODSGeneratorPage from '@/pages/ods-generator';
import PSWGeneratorPage from '@/pages/psw-generator';
import ProcessCapabilityGeneratorPage from '@/pages/process-capability-generator';
import TableEditorPage from '@/pages/table-editor-page';
import DimensionReportPage from '@/pages/dimension-report';
import QualificationRatePage from '@/pages/qualification-rate';
import AdvancedQualificationRatePage from '@/pages/advanced-qualification-rate';
import MatrixQualificationRatePage from '@/pages/matrix-qualification-rate';
import DrawingChangePage from '@/pages/drawing-change';
import DimensionDrawingPage from '@/pages/dimension-drawing';
import './globals.css';

// 主应用入口
function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bom-theme-mode">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/project-edit" element={<ProjectEditPage />} />
          <Route path="/project-edit/:id" element={<ProjectEditPage />} />
          <Route path="/parts" element={<PartsPage />} />
          <Route path="/parts/:id" element={<PartDetailPage />} />
          <Route path="/parts/new" element={<PartEditPage />} />
          <Route path="/parts/:id/edit" element={<PartEditPage />} />
          <Route path="/dimensions" element={<DimensionsPage />} />
          <Route path="/dimensions/add" element={<DimensionsAddPage />} />
          <Route path="/templates/preview" element={<TemplatePreviewPage />} />
          <Route path="/designer" element={<DesignerPage />} />
          <Route path="/ods" element={<ODSGeneratorPage />} />
          <Route path="/psw" element={<PSWGeneratorPage />} />
          <Route path="/process-capability" element={<ProcessCapabilityGeneratorPage />} />
          <Route path="/table-editor" element={<TableEditorPage />} />
          <Route path="/dimension-report" element={<DimensionReportPage />} />
          <Route path="/qualification-rate" element={<QualificationRatePage />} />
          <Route path="/advanced-qualification-rate" element={<AdvancedQualificationRatePage />} />
          <Route path="/matrix-qualification-rate" element={<MatrixQualificationRatePage />} />
          <Route path="/drawing-change" element={<DrawingChangePage />} />
          <Route path="/dimension-drawing" element={<DimensionDrawingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
