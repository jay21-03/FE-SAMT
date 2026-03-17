export default function DataTable({
  columns,
  data,
  loading,
  emptyMessage = "No data",
  keyField = "id",
  pagination,
}) {
  const page = pagination?.page ?? 0
  const totalPages = pagination?.totalPages ?? 0
  const onPageChange = pagination?.onPageChange

  return (
    <div className="panel">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: 16 }}>
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: 16 }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row?.[keyField] ?? row?.id ?? row?.key ?? `row-${index}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {typeof col.render === "function" ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && typeof onPageChange === "function" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16 }}>
          <button
            className="action-button"
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span style={{ padding: "8px 12px", fontSize: 13 }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="action-button"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

