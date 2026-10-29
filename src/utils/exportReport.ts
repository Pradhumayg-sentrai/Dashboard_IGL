import type { LiveBayState, KPIStats } from '../data/plantData';
import { initialSupervisors, sampleIncidents } from '../data/plantData';

export function exportDispatchReportCSV(bays: LiveBayState[], kpis: KPIStats) {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-IN');

  const rows: string[] = [];

  // Header Section
  rows.push('================================================================================');
  rows.push('INDIA GLYCOLS LIMITED (IGL) - PLANT DISPATCH & EXCISE COMPLIANCE REPORT');
  rows.push(`Report Date: ${dateStr} | Generated At: ${timeStr} IST`);
  rows.push('Facility: Gorakhpur Bottling & Loading Dock');
  rows.push('Alembic Database Schema: head e5a1c7d3b902 (SQLite WAL app.db)');
  rows.push('================================================================================\n');

  // Executive KPI Summary
  rows.push('1. EXECUTIVE KPI SUMMARY');
  rows.push('Metric,Value,Target,Attainment');
  rows.push(`Total Cartons Dispatched,${kpis.totalDispatched},${kpis.dispatchTarget},${((kpis.totalDispatched / kpis.dispatchTarget) * 100).toFixed(1)}%`);
  rows.push(`Trucks Cleared & Sealed,${kpis.trucksCleared},${kpis.trucksTarget},${((kpis.trucksCleared / kpis.trucksTarget) * 100).toFixed(1)}%`);
  rows.push(`Average Turnaround Time (TAT),${kpis.avgTatMinutes} mins,${kpis.tatBenchmarkMinutes} mins,${kpis.avgTatMinutes <= kpis.tatBenchmarkMinutes ? 'COMPLIANT' : 'DELAY'}`);
  rows.push(`First-Pass Excise Clearance Rate,${kpis.clearanceRate}%,99.5%,${kpis.clearanceRate >= 99.5 ? 'EXCELLENT' : 'MONITOR'}`);
  rows.push(`State Portal Refusal Count,${kpis.refusalCount} cases,0 cases,Zero Penalty Standing\n`);

  // Active Multi-Bay Fleet Summary
  rows.push('2. MULTI-BAY CONCURRENT LOADING SESSIONS');
  rows.push('Bay Name,Dock Location,Status,Vehicle Plate,Transport Pass (Indent),Loaded Qty,Allocated Qty,Completion %,Pace (cpm),Assigned Supervisor,Supervisor ID,Intercom');
  bays.forEach(b => {
    const pct = ((b.loadedQty / b.allocatedQty) * 100).toFixed(1);
    rows.push(`"${b.bayName}","${b.dockLocation}","${b.status}","${b.truckReg || 'N/A'}","${b.indentNo}","${b.loadedQty}","${b.allocatedQty}","${pct}%","${b.paceCpm}","${b.supervisor.name}","${b.supervisor.employeeId}","${b.supervisor.phoneExt}"`);
  });
  rows.push('\n');

  // Supervisor Shift Accountability
  rows.push('3. SUPERVISOR SHIFT ACCOUNTABILITY (SHIFT B)');
  rows.push('Supervisor Name,Employee ID,Assigned Bay,Shift,Pace (cpm),Avg TAT (mins),Carton Removals Authorized,Alarms on Watch,Compliance Score');
  initialSupervisors.forEach(s => {
    rows.push(`"${s.name}","${s.employeeId}","${s.phoneExt}","${s.shift}","${s.paceCpm}","${s.avgTatMinutes}","${s.removalsCount}","${s.activeAlarmsCount}","${s.rating}%"`);
  });
  rows.push('\n');

  // Recent AI Surveillance Incidents
  rows.push('4. RECENT AI SURVEILLANCE & DAMAGE TELEMETRY');
  rows.push('Incident ID,Type,Severity,Occurred At,Associated Barcode,Status,Details');
  sampleIncidents.forEach(inc => {
    rows.push(`"${inc.id}","${inc.type}","${inc.severity}","${inc.occurred_at}","${inc.barcode_value || 'N/A'}","${inc.status}","${inc.details.replace(/"/g, '""')}"`);
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `IGL_Dispatch_Report_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
