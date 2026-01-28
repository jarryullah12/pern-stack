
import { jsPDF } from 'jspdf';

/**
 * Utility to simulate file downloads and data exports
 */

const getLogoBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load logo:", error);
    return "";
  }
};

export const downloadMockPDF = async (doc: any) => {
  // Check if we have an actual file to download (handle both naming conventions)
  const actualFileName = doc.fileName || doc.filename;
  
  if (actualFileName) {
    const fileUrl = `http://localhost:5020/downloaded_invoices/${actualFileName}`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = actualFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // If no file exists, generate a high-fidelity PDF using jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Load Logo
  const logoUrl = "https://i.postimg.cc/KvkHSw-wb/Screenshot-20260119-094110.png";
  const logoBase64 = await getLogoBase64(logoUrl);

  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', 140, 15, 50, 15);
  } else {
    // Fallback if logo fails
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(37, 99, 235); // blue-600
    pdf.text('SPEDITION', 140, 25);
    pdf.setTextColor(17, 24, 39); // gray-900
    pdf.text(' ASKARI', 182, 25, { align: 'right' });
  }
  
  // Header Info
  pdf.setFontSize(8);
  pdf.setTextColor(156, 163, 175); // gray-400
  pdf.setFont('helvetica', 'normal');
  pdf.text('Spedition Askari GmbH • Südbahnstraße 31 • 32584 Löhne', 20, 20);
  
  // Recipient (Address Block)
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39); // gray-900
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.contact || 'N/A'}`, 20, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Deutschland', 20, 50);
  
  // Document Info Table
  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128); // gray-500
  pdf.text('Referenz:', 140, 45);
  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.reference || doc.id}`, 190, 45, { align: 'right' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Datum:', 140, 51);
  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.date}`, 190, 51, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Status:', 140, 57);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.status || 'Open'}`, 190, 57, { align: 'right' });
  
  // Document Title
  pdf.setFontSize(24);
  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.type === 'Bill' ? 'EINGANGSRECHNUNG' : 'RECHNUNG'}`, 20, 80);
  
  // Table Header
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(20, 95, 190, 95);
  pdf.line(20, 105, 190, 105);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39);
  pdf.text('Beschreibung', 25, 101);
  pdf.text('Gesamtpreis', 185, 101, { align: 'right' });
  
  // Table Row
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Dienstleistung / Warenlieferung (${doc.reference})`, 25, 115);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${Number(doc.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${doc.currency || 'EUR'}`, 185, 115, { align: 'right' });
  
  pdf.line(20, 122, 190, 122);
  
  // Totals Section
  const totalY = 140;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Gesamtbetrag Netto:', 120, totalY);
  pdf.setTextColor(17, 24, 39);
  pdf.text(`${Number(doc.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${doc.currency || 'EUR'}`, 190, totalY, { align: 'right' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GESAMTBETRAG:', 120, totalY + 10);
  pdf.text(`${Number(doc.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${doc.currency || 'EUR'}`, 190, totalY + 10, { align: 'right' });
  
  // Footer Information
  const footerY = 270;
  pdf.setFontSize(7.5);
  pdf.setTextColor(107, 114, 128);
  pdf.line(20, footerY - 5, 190, footerY - 5);
  
  const colWidth = 42.5;
  // Column 1
  pdf.setFont('helvetica', 'bold');
  pdf.text('FIRMENSITZ', 20, footerY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Spedition Askari GmbH', 20, footerY + 4);
  pdf.text('Südbahnstraße 31', 20, footerY + 7);
  pdf.text('32584 Löhne | Germany', 20, footerY + 10);
  
  // Column 2
  pdf.setFont('helvetica', 'bold');
  pdf.text('KONTAKT', 20 + colWidth, footerY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Tel: +49 5731 1530960', 20 + colWidth, footerY + 4);
  pdf.text('info@spedition-askari.de', 20 + colWidth, footerY + 7);
  pdf.text('www.spedition-askari.de', 20 + colWidth, footerY + 10);
  
  // Column 3
  pdf.setFont('helvetica', 'bold');
  pdf.text('REGISTER', 20 + colWidth * 2, footerY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Amtsgericht Bünde', 20 + colWidth * 2, footerY + 4);
  pdf.text('HRB 20414', 20 + colWidth * 2, footerY + 7);
  pdf.text('UST-ID: DE348127058', 20 + colWidth * 2, footerY + 10);
  
  // Column 4
  pdf.setFont('helvetica', 'bold');
  pdf.text('BANKVERBINDUNG', 20 + colWidth * 3, footerY);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Volksbank Herford-Mindener Land', 20 + colWidth * 3, footerY + 4);
  pdf.text('IBAN: DE45 4786 0125 0620 1700 00', 20 + colWidth * 3, footerY + 7);
  pdf.text('BIC: GENODEM1GTL', 20 + colWidth * 3, footerY + 10);
  
  pdf.save(`${doc.reference || 'document'}.pdf`);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  ).join('\n');
  
  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
