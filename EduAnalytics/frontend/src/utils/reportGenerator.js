import jsPDF from 'jspdf';

export class ReportGenerator {
  constructor() {
    this.doc = null;
    this.yPos = 20;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 15;
  }

  // Initialize PDF
  initPDF(title) {
    this.doc = new jsPDF();
    this.addHeader(title);
    return this;
  }

  // Add header section
  addHeader(title) {
    this.doc.setFillColor(41, 128, 185); // Blue background
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.pageWidth / 2, 20, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    const timestamp = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    this.doc.text(timestamp, this.pageWidth / 2, 30, { align: 'center' });
    
    this.yPos = 45;
    this.doc.setTextColor(0, 0, 0);
  }

  // Check if new page needed
  checkNewPage(requiredSpace = 20) {
    if (this.yPos + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPos = this.margin;
    }
  }

  // Add section title
  addSectionTitle(title) {
    this.checkNewPage(15);
    
    this.doc.setFillColor(52, 152, 219);
    this.doc.rect(this.margin, this.yPos, 180, 8, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(13);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(title, this.margin + 3, this.yPos + 6);
    
    this.yPos += 12;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(undefined, 'normal');
  }

  // Add key-value pair
  addKVPair(label, value, value2 = null) {
    this.checkNewPage(8);
    
    this.doc.setFontSize(11);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(label + ':', this.margin, this.yPos);
    
    this.doc.setFont(undefined, 'normal');
    this.doc.text(String(value), this.margin + 50, this.yPos);
    
    if (value2) {
      this.doc.text(String(value2), this.margin + 130, this.yPos);
    }
    
    this.yPos += 7;
  }

  // Add table
  addTable(headers, rows) {
    this.checkNewPage(30);
    
    const colWidth = (180 / headers.length);
    const rowHeight = 7;
    
    // Header
    this.doc.setFillColor(52, 152, 219);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont(undefined, 'bold');
    this.doc.setFontSize(10);
    
    headers.forEach((header, i) => {
      this.doc.text(header, this.margin + (i * colWidth) + 2, this.yPos + 5);
    });
    
    this.doc.rect(this.margin, this.yPos, 180, rowHeight, 'S');
    this.yPos += rowHeight;
    
    // Rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(undefined, 'normal');
    this.doc.setFontSize(9);
    
    rows.forEach((row, idx) => {
      this.checkNewPage(8);
      
      // Alternate row colors
      if (idx % 2 === 0) {
        this.doc.setFillColor(240, 240, 240);
        this.doc.rect(this.margin, this.yPos, 180, rowHeight, 'F');
      }
      
      row.forEach((cell, i) => {
        this.doc.text(String(cell), this.margin + (i * colWidth) + 2, this.yPos + 5);
      });
      
      this.doc.rect(this.margin, this.yPos, 180, rowHeight, 'S');
      this.yPos += rowHeight;
    });
    
    this.yPos += 5;
  }

  // Add list
  addList(items, indent = 5) {
    this.checkNewPage(items.length * 6);
    
    this.doc.setFontSize(10);
    items.forEach(item => {
      this.doc.text('* ' + item, this.margin + indent, this.yPos);
      this.yPos += 6;
    });
  }

  // Save PDF
  save(filename) {
    this.doc.save(filename);
  }
}

// Export helper functions
export const generateStudentReport = (studentData, subjects) => {
  const report = new ReportGenerator();
  report.initPDF(`${studentData.name} - Academic Report`);

  // Student Info
  report.addSectionTitle('Student Information');
  report.addKVPair('Name', studentData.name);
  report.addKVPair('Register No', studentData.register_no || studentData.registerNo);
  report.addKVPair('Batch', studentData.batch_year || studentData.batch);
  report.addKVPair('Semester', studentData.semester || '1');

  // Performance Summary
  report.addSectionTitle('Performance Summary');
  report.addKVPair('Overall Average', `${studentData.overall_average?.toFixed(2)}%`);
  report.addKVPair('Rank', `#${studentData.rank}`);
  report.addKVPair('Subjects Passed', studentData.subjects_passed);
  report.addKVPair('Subjects Failed', studentData.subjects_failed);

  // CA Breakdown
  report.addSectionTitle('CA Performance Breakdown');
  report.addKVPair('CA1 Average', `${studentData.ca_averages?.CA1?.toFixed(2)}%`);
  report.addKVPair('CA2 Average', `${studentData.ca_averages?.CA2?.toFixed(2)}%`);
  report.addKVPair('CA3 Average', `${studentData.ca_averages?.CA3?.toFixed(2)}%`);
  report.addKVPair('Semester Average', `${studentData.semester_average?.toFixed(2)}%`);

  // Subject-wise marks
  if (subjects && subjects.length > 0) {
    report.addSectionTitle('Subject-wise Performance');
    
    const headers = ['Subject', 'CA1', 'CA2', 'CA3', 'Sem', 'Average', 'Status'];
    const rows = subjects.map(s => {
      const avg = s.semester_marks 
        ? ((s.ca1 + s.ca2 + (s.ca3 || 0) + s.semester_marks) / 4).toFixed(1)
        : ((s.ca1 + s.ca2 + (s.ca3 || 0)) / 3).toFixed(1);
      
      return [
        s.subject_name || s.name,
        s.ca1 || '-',
        s.ca2 || '-',
        s.ca3 || '-',
        s.semester_marks || '-',
        avg,
        s.passed ? 'PASS' : 'FAIL'
      ];
    });
    
    report.addTable(headers, rows);
  }

  // Performance Analysis
  report.addSectionTitle('Performance Analysis');
  const analysis = [];
  
  if (studentData.overall_average >= 80) {
    analysis.push('Excellent performance - Consistently scoring above 80%');
  } else if (studentData.overall_average >= 70) {
    analysis.push('Good performance - Maintaining above 70% average');
  } else if (studentData.overall_average >= 60) {
    analysis.push('Average performance - Scores above 60%');
  } else {
    analysis.push('Needs improvement - Current average is below 60%');
  }
  
  if (studentData.subjects_passed === studentData.total_subjects || 
      (subjects && subjects.every(s => s.passed))) {
    analysis.push('All subjects passed - Strong academic performance');
  }
  
  if (studentData.rank <= 3) {
    analysis.push('Top performer in the batch');
  }

  report.addList(analysis);

  report.save(`${studentData.name}_Report.pdf`);
};

export const generateComparisonReport = (student1, student2, subjects1, subjects2) => {
  const report = new ReportGenerator();
  report.initPDF('Student Comparison Report');

  // Comparison Header
  report.addSectionTitle('Students Under Comparison');
  report.addKVPair('Student 1', student1.name, 'Student 2');
  report.addKVPair(student1.register_no, '', student2.register_no);

  // Performance Comparison
  report.addSectionTitle('Performance Metrics Comparison');
  
  const headers = ['Metric', student1.name, student2.name, 'Difference'];
  const diff = (student1.overall_average - student2.overall_average).toFixed(2);
  const rows = [
    ['Overall Average', `${student1.overall_average?.toFixed(2)}%`, `${student2.overall_average?.toFixed(2)}%`, diff],
    ['CA1 Average', `${student1.ca_averages?.CA1?.toFixed(2)}%`, `${student2.ca_averages?.CA1?.toFixed(2)}%`, 
      (student1.ca_averages?.CA1 - student2.ca_averages?.CA1)?.toFixed(2)],
    ['CA2 Average', `${student1.ca_averages?.CA2?.toFixed(2)}%`, `${student2.ca_averages?.CA2?.toFixed(2)}%`, 
      (student1.ca_averages?.CA2 - student2.ca_averages?.CA2)?.toFixed(2)],
    ['CA3 Average', `${student1.ca_averages?.CA3?.toFixed(2)}%`, `${student2.ca_averages?.CA3?.toFixed(2)}%`, 
      (student1.ca_averages?.CA3 - student2.ca_averages?.CA3)?.toFixed(2)],
    ['Semester Average', `${student1.semester_average?.toFixed(2)}%`, `${student2.semester_average?.toFixed(2)}%`, 
      (student1.semester_average - student2.semester_average)?.toFixed(2)],
    ['Rank', `#${student1.rank}`, `#${student2.rank}`, '']
  ];
  
  report.addTable(headers, rows);

  // Subject-wise Comparison
  if (subjects1 && subjects2 && subjects1.length > 0) {
    report.addSectionTitle('Subject-wise Performance Comparison');
    
    const subHeaders = ['Subject', `${student1.name}`, `${student2.name}`, 'Difference'];
    const subRows = subjects1.map((s1, idx) => {
      const s2 = subjects2[idx];
      const avg1 = s1.semester_marks 
        ? ((s1.ca1 + s1.ca2 + (s1.ca3 || 0) + s1.semester_marks) / 4).toFixed(1)
        : ((s1.ca1 + s1.ca2 + (s1.ca3 || 0)) / 3).toFixed(1);
      
      const avg2 = s2.semester_marks 
        ? ((s2.ca1 + s2.ca2 + (s2.ca3 || 0) + s2.semester_marks) / 4).toFixed(1)
        : ((s2.ca1 + s2.ca2 + (s2.ca3 || 0)) / 3).toFixed(1);
      
      return [
        s1.subject_name || s1.name,
        avg1,
        avg2,
        (avg1 - avg2).toFixed(1)
      ];
    });
    
    report.addTable(subHeaders, subRows);
  }

  // Analysis
  report.addSectionTitle('Comparative Analysis');
  const analysis = [];
  
  if (student1.overall_average > student2.overall_average) {
    analysis.push(`${student1.name} has higher overall average by ${diff}%`);
    analysis.push(`${student1.name} ranked #${student1.rank} compared to #${student2.rank}`);
  } else if (student2.overall_average > student1.overall_average) {
    analysis.push(`${student2.name} has higher overall average by ${Math.abs(diff)}%`);
    analysis.push(`${student2.name} ranked #${student2.rank} compared to #${student1.rank}`);
  } else {
    analysis.push('Both students have equal overall average');
  }
  
  const passedCommon = Math.min(student1.subjects_passed, student2.subjects_passed);
  analysis.push(`Both students have passed minimum ${passedCommon} subjects`);

  report.addList(analysis);

  report.save('Student_Comparison_Report.pdf');
};
