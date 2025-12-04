/**
 * Export Engine - Generate PDF Certificates & CSV Reports
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ActiveRun, Procedure, RunLog } from "@/types/schema";

/**
 * Export multiple runs to CSV
 */
export function exportToCSV(runs: ActiveRun[], procedures: Record<string, Procedure>): void {
  const rows = runs.map((run) => {
    const procedure = procedures[run.procedureId];
    const startedAt = run.startedAt instanceof Date 
      ? run.startedAt 
      : (run.startedAt as any)?.toDate?.() || new Date(run.startedAt);
    const completedAt = run.completedAt 
      ? (run.completedAt instanceof Date 
          ? run.completedAt 
          : (run.completedAt as any)?.toDate?.() || new Date(run.completedAt))
      : null;
    
    const duration = completedAt 
      ? Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60)) // minutes
      : null;

    return {
      "Run ID": run.id,
      "Process Name": run.procedureTitle || procedure?.title || "Unknown",
      "Status": run.status,
      "Started At": startedAt.toLocaleString(),
      "Completed At": completedAt?.toLocaleString() || "In Progress",
      "Duration (minutes)": duration || "N/A",
      "Current Step": `${run.currentStepIndex + 1} / ${procedure?.steps.length || 0}`,
      "Total Steps": procedure?.steps.length || 0,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Runs");
  
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  saveAs(blob, `workos-export-${new Date().toISOString().split("T")[0]}.xlsx`);
}

/**
 * Generate a PDF Certificate of Completion for a run
 */
export async function generateRunCertificate(
  run: ActiveRun,
  procedure: Procedure,
  userName: string = "User",
  organizationName: string = "Organization"
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header with brand color
  doc.setFillColor(30, 58, 138); // Blue-900
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Completion", pageWidth / 2, 25, { align: "center" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Organization Name
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(organizationName, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Meta Information Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(249, 250, 251); // slate-50
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, "FD");
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Run Information", margin + 5, yPos);
  
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Run ID: ${run.id}`, margin + 5, yPos);
  
  yPos += 5;
  const startedAt = run.startedAt instanceof Date 
    ? run.startedAt 
    : (run.startedAt as any)?.toDate?.() || new Date(run.startedAt);
  doc.text(`Started: ${startedAt.toLocaleString()}`, margin + 5, yPos);
  
  yPos += 5;
  if (run.completedAt) {
    const completedAt = run.completedAt instanceof Date 
      ? run.completedAt 
      : (run.completedAt as any)?.toDate?.() || new Date(run.completedAt);
    doc.text(`Completed: ${completedAt.toLocaleString()}`, margin + 5, yPos);
  }
  
  yPos += 5;
  doc.text(`Executed by: ${userName}`, margin + 5, yPos);
  
  yPos += 15;

  // Process Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(procedure.title, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  if (procedure.description) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descriptionLines = doc.splitTextToSize(procedure.description, pageWidth - 2 * margin);
    doc.text(descriptionLines, pageWidth / 2, yPos, { align: "center" });
    yPos += descriptionLines.length * 5 + 5;
  }

  // Steps Table
  yPos += 5;
  const tableData = procedure.steps.map((step, index) => {
    const log = run.logs?.find((l) => l.stepId === step.id);
    const status = log ? (log.outcome === "SUCCESS" ? "✓ Completed" : log.outcome) : "Pending";
    
    let output = "N/A";
    if (log?.output) {
      if (typeof log.output === "string") {
        output = log.output.substring(0, 50) + (log.output.length > 50 ? "..." : "");
      } else if (typeof log.output === "object") {
        if (log.output.fileName) {
          output = `File: ${log.output.fileName}`;
        } else if (log.output.proofUrl) {
          output = "Proof uploaded";
        } else {
          output = JSON.stringify(log.output).substring(0, 50) + "...";
        }
      } else {
        output = String(log.output).substring(0, 50);
      }
    }

    return [
      index + 1,
      step.title,
      step.action,
      status,
      output,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Step Name", "Action", "Status", "Output"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Blue-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
  yPos = finalY + 15;

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  // Digital Signatures Section
  const signatureLogs = run.logs?.filter((log) => {
    const step = procedure.steps.find((s) => s.id === log.stepId);
    return step?.action === "AUTHORIZE" && log.output?.signatureUrl;
  });

  if (signatureLogs && signatureLogs.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Digital Signatures", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    for (const sigLog of signatureLogs) {
      const step = procedure.steps.find((s) => s.id === sigLog.stepId);
      if (!step || !sigLog.output?.signatureUrl) continue;

      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      // Step name
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Step: ${step.title}`, margin, yPos);
      yPos += 6;

      // Signature image
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const imgWidth = 60;
              const imgHeight = (img.height / img.width) * imgWidth;
              
              // Check if image fits on current page
              if (yPos + imgHeight > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
              }
              
              doc.addImage(img, "PNG", margin, yPos, imgWidth, imgHeight);
              yPos += imgHeight + 5;
              
              // Signature metadata
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");
              if (sigLog.output.signedBy) {
                doc.text(`Signed by: ${sigLog.output.signedBy}`, margin, yPos);
                yPos += 4;
              }
              if (sigLog.timestamp) {
                const sigDate = sigLog.timestamp instanceof Date 
                  ? sigLog.timestamp 
                  : (sigLog.timestamp as any)?.toDate?.() || new Date();
                doc.text(`Date: ${sigDate.toLocaleString()}`, margin, yPos);
                yPos += 4;
              }
              
              yPos += 10;
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => {
            // If image fails to load, just skip it
            yPos += 10;
            resolve();
          };
          img.src = sigLog.output.signatureUrl;
        });
      } catch (error) {
        console.error("Error loading signature image:", error);
        yPos += 10;
      }
    }
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated by Atomic Work on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Save PDF
  doc.save(`certificate-${run.id}-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export a single run to CSV
 */
export function exportRunToCSV(run: ActiveRun, procedure: Procedure): void {
  const startedAt = run.startedAt instanceof Date 
    ? run.startedAt 
    : (run.startedAt as any)?.toDate?.() || new Date(run.startedAt);
  const completedAt = run.completedAt 
    ? (run.completedAt instanceof Date 
        ? run.completedAt 
        : (run.completedAt as any)?.toDate?.() || new Date(run.completedAt))
    : null;

  const rows = procedure.steps.map((step, index) => {
    const log = run.logs?.find((l) => l.stepId === step.id);
    return {
      "Step #": index + 1,
      "Step Name": step.title,
      "Action": step.action,
      "Status": log ? log.outcome : "Pending",
      "Output": log?.output ? JSON.stringify(log.output).substring(0, 100) : "N/A",
      "Timestamp": log?.timestamp 
        ? (log.timestamp instanceof Date 
            ? log.timestamp 
            : (log.timestamp as any)?.toDate?.() || new Date()).toLocaleString()
        : "N/A",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Steps");
  
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  saveAs(blob, `run-${run.id}-${new Date().toISOString().split("T")[0]}.xlsx`);
}

