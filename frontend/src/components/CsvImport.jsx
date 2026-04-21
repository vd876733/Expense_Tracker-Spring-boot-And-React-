import React, { useState } from 'react';
import { importTransactionsFromCsv, downloadCsvTemplate } from '../services/api';

/**
 * CSV Import Component
 * Handles CSV file upload and bulk transaction import
 */
const CsvImport = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // DEBUG: Log token before sending
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt') || localStorage.getItem('jwtToken');
      console.log('[CsvImport] Token being sent:', token ? token.substring(0, 30) + '...' : 'NO TOKEN FOUND');
      console.log('[CsvImport] Token is null/undefined?', token === null || token === undefined);
      console.log('[CsvImport] Token is string "null"?', token === 'null');
      console.log('[CsvImport] Full token value:', token);
      console.log('[CsvImport] Uploading file:', file.name, 'Size:', file.size, 'bytes');

      const importResult = await importTransactionsFromCsv(file);
      setResult(importResult);

      if (importResult.successfulRecords > 0 && onImportSuccess) {
        onImportSuccess(importResult);
      }

      if (importResult.successfulRecords > 0) {
        setFile(null);
        document.querySelector('input[type="file"]').value = '';
      }
    } catch (err) {
      setError('Failed to import transactions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadCsvTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transaction-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template: ' + err.message);
    }
  };

  return (
    <div className="card bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📁 Bulk Import (CSV)</h2>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {/* Instructions Section */}
      {showInstructions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">CSV Format Requirements</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-800 mb-1">Column Order:</p>
              <p className="font-mono bg-white p-2 rounded text-xs">Date, Description, Category, Amount</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">Date Format (pick one):</p>
              <ul className="list-disc list-inside space-y-1">
                <li className="font-mono text-xs">yyyy-MM-dd (2024-01-15)</li>
                <li className="font-mono text-xs">yyyy/MM/dd (2024/01/15)</li>
                <li className="font-mono text-xs">MM-dd-yyyy (01-15-2024)</li>
                <li className="font-mono text-xs">MM/dd/yyyy (01/15/2024)</li>
                <li className="font-mono text-xs">dd-MM-yyyy (15-01-2024)</li>
                <li className="font-mono text-xs">dd/MM/yyyy (15/01/2024)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">Valid Categories:</p>
              <p className="text-xs">Food, Transport, Entertainment, Utilities, Shopping, Healthcare, Other</p>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-1">Example CSV:</p>
              <div className="font-mono text-xs bg-white p-2 rounded overflow-x-auto">
                <p>Date,Description,Category,Amount</p>
                <p>2024-01-15,Grocery Shopping,Food,45.50</p>
                <p>2024-01-16,Taxi to Office,Transport,15.00</p>
                <p>2024-01-17,Movie Tickets,Entertainment,25.00</p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold"
            >
              ⬇️ Download CSV Template
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Import Form */}
      <form onSubmit={handleUpload} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select CSV File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-sm text-gray-700">
                  {file ? (
                    <span className="font-semibold text-blue-600">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500">CSV files only (Max 10MB)</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
        >
          {loading ? 'Importing...' : 'Import Transactions'}
        </button>
      </form>

      {/* Import Results */}
      {result && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Import Summary</h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{result.totalRecords}</p>
            </div>
            <div className="p-3 bg-white rounded border border-green-200">
              <p className="text-xs text-green-600 mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-600">{result.successfulRecords}</p>
            </div>
            <div className="p-3 bg-white rounded border border-red-200">
              <p className="text-xs text-red-600 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600">{result.failedRecords}</p>
            </div>
          </div>

          {/* Errors List */}
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Errors:</h4>
              <div className="bg-white p-3 rounded border border-red-200 max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm text-red-700">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.successfulRecords > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-semibold">
              ✓ Successfully imported {result.successfulRecords} transaction{result.successfulRecords !== 1 ? 's' : ''}!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CsvImport;
