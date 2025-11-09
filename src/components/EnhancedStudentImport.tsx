import React from 'react';
import SpreadsheetUpload from './SpreadsheetUpload';

interface EnhancedStudentImportProps {
  onImportComplete: () => void;
  onViewList: () => void;
}

export default function EnhancedStudentImport({ onImportComplete, onViewList }: EnhancedStudentImportProps) {
  const handleImportComplete = () => {
    onImportComplete();
    onViewList();
  };

  return <SpreadsheetUpload onImportComplete={handleImportComplete} />;
}