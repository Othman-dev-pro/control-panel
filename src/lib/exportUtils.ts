/**
 * utility to export business data to CSV format
 */

export const exportToCSV = (filename: string, data: any[]) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(item => {
    return Object.values(item)
      .map(value => {
        // Handle strings with commas
        const str = String(value ?? "");
        return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
