import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';

export function TableInput({ columns, data = [], onChange, minRows = 1, addLabel = 'Add Row' }) {
  // Add initial rows if data is empty
  React.useEffect(() => {
    if (data.length < minRows) {
      const initialRows = Array(minRows - data.length).fill().map(() => {
        const row = {};
        columns.forEach(col => { row[col.key] = col.type === 'number' ? '' : ''; });
        return row;
      });
      onChange([...data, ...initialRows]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRow = () => {
    const newRow = {};
    columns.forEach(col => { newRow[col.key] = col.type === 'number' ? '' : ''; });
    onChange([...data, newRow]);
  };

  const handleRemoveRow = (index) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const handleChange = (index, key, value, type) => {
    const newData = [...data];
    let parsedValue = value;
    if (type === 'number' && value !== '') {
      parsedValue = Number(value);
    }
    newData[index] = { ...newData[index], [key]: parsedValue };

    // Auto-calculate total if rate and quantity exist and this is one of them
    if (key === 'quantity' || key === 'rate') {
      const row = newData[index];
      if (row.quantity && row.rate) {
        newData[index].total = Number((row.quantity * row.rate).toFixed(2));
      } else {
        newData[index].total = 0;
      }
    }

    onChange(newData);
  };

  return (
    <div className="mb-4">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${col.width || ''}`}>
                  {col.label} {col.required && <span className="text-red-500">*</span>}
                </th>
              ))}
              <th className="px-4 py-3 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    {col.type === 'readonly' ? (
                      <div className="text-sm text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                        {row[col.key] || '-'}
                      </div>
                    ) : col.type === 'select' ? (
                      <select
                        value={row[col.key] || ''}
                        onChange={(e) => handleChange(rowIndex, col.key, e.target.value, col.type)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
                        required={col.required}
                      >
                        <option value="" disabled>Select...</option>
                        {col.options?.map((opt, i) => (
                          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                            {typeof opt === 'string' ? opt : opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        step={col.type === 'number' ? '0.01' : undefined}
                        value={row[col.key] || ''}
                        onChange={(e) => handleChange(rowIndex, col.key, e.target.value, col.type)}
                        placeholder={col.placeholder || ''}
                        required={col.required}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy"
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rowIndex)}
                    disabled={data.length <= minRows}
                    className={`p-2 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 ${data.length <= minRows ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <Button type="button" variant="secondary" size="sm" onClick={handleAddRow}>
          <Plus className="w-4 h-4 mr-1" /> {addLabel}
        </Button>
      </div>
    </div>
  );
}
