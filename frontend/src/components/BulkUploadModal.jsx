import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Users,
  ArrowRight
} from 'lucide-react';
import client from '../api/client';
import { errMsg } from '../context/ToastContext';

const COLUMNS = [
  'name', 
  'rollNumber', 
  'email', 
  'year', 
  'section', 
  'mentorEmail', 
  'attendance', 
  'assessmentMarks', 
  'assignmentCompletion', 
  'engagementScore', 
  'previousPerformance'
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const HEADER_MAP = Object.fromEntries(COLUMNS.map((c) => [norm(c), c]));
HEADER_MAP.roll = 'rollNumber';
HEADER_MAP.rollno = 'rollNumber';
HEADER_MAP.rollnumber = 'rollNumber';
HEADER_MAP.regno = 'rollNumber';
HEADER_MAP.registerno = 'rollNumber';
HEADER_MAP.registernumber = 'rollNumber';
HEADER_MAP.mentor = 'mentorEmail';
HEADER_MAP.mentoremail = 'mentorEmail';
HEADER_MAP.marks = 'assessmentMarks';
HEADER_MAP.assessment = 'assessmentMarks';
HEADER_MAP.internalmarks = 'assessmentMarks';
HEADER_MAP.assignments = 'assignmentCompletion';
HEADER_MAP.assignment = 'assignmentCompletion';
HEADER_MAP.engagement = 'engagementScore';
HEADER_MAP.previous = 'previousPerformance';
HEADER_MAP.studentname = 'name';

function mapRawRowsToStudents(rawRows) {
  if (!rawRows || rawRows.length < 2) return [];

  let headerIndex = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row && row.some((c) => String(c).trim() !== '')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const headerRow = rawRows[headerIndex];
  const keys = headerRow.map((h) => HEADER_MAP[norm(h)] || null);

  const students = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r.some((c) => String(c).trim() !== '')) continue;

    const obj = {};
    keys.forEach((k, colIdx) => {
      if (k && r[colIdx] !== undefined) {
        const val = String(r[colIdx]).trim();
        if (val !== '') obj[k] = val;
      }
    });

    if (obj.name || obj.rollNumber) {
      students.push(obj);
    }
  }

  return students;
}

export function downloadCsvTemplate() {
  const sample = [
    COLUMNS.join(','),
    'Ravi Kumar,310624205111,ravi@college.edu,2,A,mentor@edupreplus.edu,82,74,90,70,78',
    'Priya Nair,310624205112,priya@college.edu,3,B,mentor2@edupreplus.edu,58,45,55,40,50',
    'Arjun Raj,310624205113,arjun@college.edu,2,A,mentor@edupreplus.edu,91,86,95,88,84',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'edupre-students-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcelTemplate() {
  const data = [
    COLUMNS,
    ['Ravi Kumar', '310624205111', 'ravi@college.edu', 2, 'A', 'mentor@edupreplus.edu', 82, 74, 90, 70, 78],
    ['Priya Nair', '310624205112', 'priya@college.edu', 3, 'B', 'mentor2@edupreplus.edu', 58, 45, 55, 40, 50],
    ['Arjun Raj', '310624205113', 'arjun@college.edu', 2, 'A', 'mentor@edupreplus.edu', 91, 86, 95, 88, 84],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'edupre-students-template.xlsx');
}

export default function BulkUploadModal({ onClose, onDone }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    setResult(null);
    setError('');
    if (!file) return;
    setFileName(file.name);

    try {
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      let parsed = [];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        parsed = mapRawRowsToStudents(rawRows);
      } else {
        const text = await file.text();
        const wb = XLSX.read(text.replace(/^\uFEFF/, ''), { type: 'string' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        parsed = mapRawRowsToStudents(rawRows);
      }

      if (parsed.length === 0) {
        setError('No valid student rows found. Make sure header columns include "name" and "rollNumber".');
      }
      setRows(parsed);
    } catch (err) {
      setError(`Failed to read file: ${err.message || 'Ensure it is a valid .xlsx or .csv'}`);
    }
  };

  const upload = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await client.post('/students/bulk', { students: rows });
      setResult(res.data);
      onDone(res.data);
    } catch (err) {
      setError(errMsg(err, 'Bulk upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Bulk Import Students</h3>
              <p className="text-xs text-slate-400">Excel (.xlsx, .xls) and CSV (.csv) supported</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Instructions & Template Downloads */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <p className="text-xs text-indigo-950 font-medium leading-relaxed">
              Upload an <strong>Excel (.xlsx)</strong> or <strong>CSV</strong> file. Required columns: <code>name</code> and <code>rollNumber</code>. Optional fields: <code>email</code>, <code>year</code>, <code>section</code>, <code>mentorEmail</code>, and academic factor metrics (0-100).
            </p>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                type="button" 
                onClick={downloadExcelTemplate} 
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Excel (.xlsx)</span>
              </button>
              <button 
                type="button" 
                onClick={downloadCsvTemplate} 
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Download CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* File Picker Zone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Choose Spreadsheet File
            </label>
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" 
              onChange={onFile} 
              className="block w-full text-xs text-slate-600 file:mr-3 file:px-3.5 file:py-2 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-semibold hover:file:bg-primary-100 cursor-pointer border border-slate-200 rounded-xl p-1" 
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Staged Rows Preview */}
          {rows.length > 0 && !result && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Ready to Import: <strong>{rows.length}</strong> Student Records
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">{fileName}</span>
              </div>

              {/* Sample list */}
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-200/60 rounded-xl bg-white border border-slate-200/80 text-xs">
                {rows.slice(0, 5).map((r, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-[11px] text-slate-400">{r.rollNumber} {r.email ? `• ${r.email}` : ''}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Year {r.year || '-'} · Sec {r.section || '-'}
                    </span>
                  </div>
                ))}
                {rows.length > 5 && (
                  <div className="px-3 py-1.5 text-center text-[11px] text-slate-400 italic bg-slate-50/50">
                    + {rows.length - 5} more student records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {result && (
            <div className="rounded-2xl border border-slate-200 p-4 text-xs space-y-3 bg-slate-50/60">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{result.createdCount} Students Successfully Added</span>
              </div>

              {result.skippedCount > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-amber-800 font-bold mb-1">
                    {result.skippedCount} Skipped (Duplicates or Incomplete):
                  </p>
                  <ul className="max-h-32 overflow-y-auto space-y-1 text-slate-600">
                    {result.skipped.map((s, i) => (
                      <li key={i} className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-[11px]">
                        <strong>{s.row}:</strong> {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button 
              onClick={onClose} 
              className="btn-secondary text-xs sm:text-sm py-2 px-4"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button 
                onClick={upload} 
                disabled={busy || rows.length === 0} 
                className="btn-primary text-xs sm:text-sm py-2 px-5"
              >
                {busy ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Upload {rows.length ? `(${rows.length})` : ''}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
