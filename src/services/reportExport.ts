import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentAnalysisResult } from './documentAnalysis';

export class ReportExportService {
  static async exportToPDF(analysis: DocumentAnalysisResult): Promise<void> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize = 12, isBold = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }

        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.5 + 5;
      };

      // Header
      addText('Legal Document Analysis Report', 20, true);
      addText(`Document: ${analysis.documentInfo.fileName}`, 14, true);
      addText(`Jurisdiction: ${analysis.documentInfo.jurisdiction}`, 12);
      addText(`Analysis Date: ${new Date(analysis.documentInfo.analysisDate).toLocaleDateString()}`, 12);
      yPosition += 10;

      // Risk Assessment
      addText('RISK ASSESSMENT', 16, true);
      addText(`Risk Level: ${analysis.riskAssessment.level}`, 12, true);
      addText(`Risk Score: ${analysis.riskAssessment.score}/10`, 12);
      addText('Risk Factors:', 12, true);
      analysis.riskAssessment.factors.forEach(factor => {
        addText(`• ${factor}`, 11);
      });
      yPosition += 10;

      // Summary
      addText('EXECUTIVE SUMMARY', 16, true);
      addText(analysis.summary, 12);
      yPosition += 10;

      // Key Findings
      if (analysis.keyFindings.length > 0) {
        addText('KEY FINDINGS', 16, true);
        analysis.keyFindings.forEach((finding, index) => {
          addText(`${index + 1}. ${finding.category} (${finding.severity.toUpperCase()})`, 12, true);
          addText(finding.finding, 11);
        });
        yPosition += 10;
      }

      // Problematic Clauses
      if (analysis.problematicClauses.length > 0) {
        addText('PROBLEMATIC CLAUSES', 16, true);
        analysis.problematicClauses.forEach((clause, index) => {
          addText(`${index + 1}. Issue Found`, 12, true);
          addText(`Clause: "${clause.clause}"`, 11);
          addText(`Problem: ${clause.issue}`, 11);
          addText(`Suggestion: ${clause.suggestion}`, 11);
          yPosition += 5;
        });
      }

      // Recommendations
      if (analysis.recommendations.length > 0) {
        addText('RECOMMENDATIONS', 16, true);
        analysis.recommendations.forEach((rec, index) => {
          addText(`${index + 1}. ${rec}`, 11);
        });
        yPosition += 10;
      }

      // Legal Citations
      if (analysis.legalCitations.length > 0) {
        addText('LEGAL CITATIONS', 16, true);
        analysis.legalCitations.forEach(citation => {
          addText(`• ${citation}`, 11);
        });
        yPosition += 10;
      }

      // Next Steps
      if (analysis.nextSteps.length > 0) {
        addText('NEXT STEPS', 16, true);
        analysis.nextSteps.forEach((step, index) => {
          addText(`${index + 1}. ${step}`, 11);
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'This analysis is for informational purposes only and does not constitute legal advice.',
        margin,
        pageHeight - 10
      );

      // Save the PDF
      const fileName = `${analysis.documentInfo.fileName.replace(/\.[^/.]+$/, '')}_analysis.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export report to PDF');
    }
  }

  static async exportToJSON(analysis: DocumentAnalysisResult): Promise<void> {
    try {
      const dataStr = JSON.stringify(analysis, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysis.documentInfo.fileName.replace(/\.[^/.]+$/, '')}_analysis.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export report to JSON');
    }
  }

  static async exportToHTML(analysis: DocumentAnalysisResult): Promise<void> {
    try {
      const html = this.generateHTMLReport(analysis);
      const dataBlob = new Blob([html], { type: 'text/html' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysis.documentInfo.fileName.replace(/\.[^/.]+$/, '')}_analysis.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      throw new Error('Failed to export report to HTML');
    }
  }

  private static generateHTMLReport(analysis: DocumentAnalysisResult): string {
    const riskColor = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#f97316',
      'CRITICAL': '#ef4444'
    }[analysis.riskAssessment.level];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Document Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 6px; color: white; font-weight: bold; background-color: ${riskColor}; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .finding { background: #f9fafb; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; }
        .clause { background: #fef2f2; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
        ul, ol { padding-left: 20px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Legal Document Analysis Report</h1>
        <p><strong>Document:</strong> ${analysis.documentInfo.fileName}</p>
        <p><strong>Jurisdiction:</strong> ${analysis.documentInfo.jurisdiction}</p>
        <p><strong>Analysis Date:</strong> ${new Date(analysis.documentInfo.analysisDate).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Risk Assessment</h2>
        <p><span class="risk-badge">${analysis.riskAssessment.level}</span></p>
        <p><strong>Risk Score:</strong> ${analysis.riskAssessment.score}/10</p>
        <p><strong>Risk Factors:</strong></p>
        <ul>
            ${analysis.riskAssessment.factors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p>${analysis.summary}</p>
    </div>

    ${analysis.keyFindings.length > 0 ? `
    <div class="section">
        <h2>Key Findings</h2>
        ${analysis.keyFindings.map(finding => `
            <div class="finding">
                <h3>${finding.category} (${finding.severity.toUpperCase()})</h3>
                <p>${finding.finding}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${analysis.problematicClauses.length > 0 ? `
    <div class="section">
        <h2>Problematic Clauses</h2>
        ${analysis.problematicClauses.map(clause => `
            <div class="clause">
                <p><strong>Clause:</strong> "${clause.clause}"</p>
                <p><strong>Problem:</strong> ${clause.issue}</p>
                <p><strong>Suggestion:</strong> ${clause.suggestion}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${analysis.recommendations.length > 0 ? `
    <div class="section">
        <h2>Recommendations</h2>
        <ol>
            ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ol>
    </div>
    ` : ''}

    ${analysis.legalCitations.length > 0 ? `
    <div class="section">
        <h2>Legal Citations</h2>
        <ul>
            ${analysis.legalCitations.map(citation => `<li>${citation}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${analysis.nextSteps.length > 0 ? `
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            ${analysis.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
    </div>
    ` : ''}

    <div class="footer">
        <p>This analysis is for informational purposes only and does not constitute legal advice. 
        Please consult with a qualified attorney for specific legal matters.</p>
        <p>Generated by LegalAI Pro on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
    `;
  }
}