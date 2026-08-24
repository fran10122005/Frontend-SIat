import EmptyState from "../shared/EmptyState";

export default function ResponsiveTable({
  columns,
  data = [],
  rowKey = "id",
  renderActions,
  onRowClick,
  emptyTitle = "Sin registros",
  emptyDescription = "No hay información disponible para mostrar.",
}) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const cardColumns = columns.filter((c) => !c.hideInCard);
  const primaryColumn = cardColumns.find((c) => c.primary) || cardColumns[0];
  const detailColumns = cardColumns.filter((c) => c !== primaryColumn);

  return (
    <>
      {/* Desktop: tabla nativa compacta */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {renderActions && (
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row, i) => (
              <tr
                key={row[rowKey] ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${onRowClick ? "cursor-pointer" : ""} hover:bg-slate-50/60 dark:hover:bg-slate-800/40`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-slate-600 dark:text-slate-300 ${col.className || ""}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: lista ultradensa (1-2 líneas por registro) */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {data.map((row, i) => {
          const secondaryText = detailColumns
            .map(
              (d) =>
                `${d.header}: ${
                  d.render ? d.render(row) : (row[d.key] ?? "-")
                }`,
            )
            .join("  ·  ");
          return (
            <div
              key={row[rowKey] ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              } hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-800/50`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {primaryColumn.render
                    ? primaryColumn.render(row)
                    : row[primaryColumn.key]}
                </p>
                {secondaryText && (
                  <p
                    title={secondaryText.replace(/\s+/g, " ")}
                    className="text-xs text-gray-400 line-clamp-1 mt-0.5"
                  >
                    {secondaryText}
                  </p>
                )}
              </div>
              {renderActions && (
                <div className="shrink-0 flex items-center gap-1">
                  {renderActions(row)}
                </div>
              )}
              {onRowClick && !renderActions && (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
