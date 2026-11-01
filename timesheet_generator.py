import openpyxl
from openpyxl.worksheet.cell_range import CellRange
import datetime
import calendar
import os

MONTH_NAMES_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

def format_excel_time(time_str):
    """Converts '08:00' or '8:00' to '8.00' (BPL format)"""
    if not time_str:
        return None
    time_str = str(time_str).strip()
    if not time_str:
        return None
    time_str = time_str.replace(':', '.')
    parts = time_str.split('.')
    if len(parts) == 2:
        hour = int(parts[0]) if parts[0].isdigit() else parts[0]
        return f"{hour}.{parts[1]}"
    return time_str

def generate_timesheet_excel(template_path, output_path, profile, records_by_date, year, month):
    """
    Clones the template and populates it with attendance records for the given year and month.
    Handles variable days per month (28, 29, 30, 31) while preserving formatting and merged cells.
    """
    wb = openpyxl.load_workbook(template_path)
    ws = wb.active
    
    # 1. Update Header
    employee_name = profile.get('employee_name', '').strip()
    nip = profile.get('nip', '').strip()
    position = profile.get('position', '').strip()
    department = profile.get('department', '').strip()
    project_name = profile.get('project_name', '').strip()
    project_code = profile.get('project_code', '').strip()
    pm_name = profile.get('pm_name', '').strip()
    
    month_name = MONTH_NAMES_ID[month]
    periode_text = profile.get('periode', f"{month_name} {year}").strip()
    
    if employee_name:
        ws['B9'] = f": {employee_name}"
    if position:
        ws['G9'] = f": {position}"
    if nip:
        ws['B10'] = f": {nip}"
    if project_name:
        ws['G10'] = f": {project_name}"
    if department:
        ws['B11'] = f": {department}"
    if project_code:
        ws['G11'] = f": {project_code}"
    if periode_text:
        ws['B12'] = f": {periode_text}"
    if pm_name:
        ws['G12'] = f": {pm_name}"

    # 2. Number of days in the month
    num_days = calendar.monthrange(year, month)[1]
    
    # Template has 31 days (row 17 = Day 1, row 47 = Day 31)
    if num_days < 31:
        shift = 31 - num_days
        start_del = 17 + num_days
        
        # Shift merged cells located at or below start_del before delete_rows
        ranges = list(ws.merged_cells.ranges)
        for cr in ranges:
            if cr.min_row >= start_del:
                ws.merged_cells.remove(cr)
                cr.shift(row_shift=-shift)
                ws.merged_cells.add(cr)
                
        ws.delete_rows(start_del, shift)

    # 3. Fill Attendance rows
    for day in range(1, num_days + 1):
        row_idx = 16 + day
        date_obj = datetime.date(year, month, day)
        date_str = date_obj.strftime("%Y-%m-%d")
        
        # Date cell (keep formatting: d -mmmm-yy)
        ws.cell(row=row_idx, column=1).value = datetime.datetime(year, month, day)
        # Indonesian Day formula
        ws.cell(row=row_idx, column=2).value = f'=TEXT(A{row_idx},"[$-421]dddd")'
        
        # Reset data columns for this row
        for c in range(3, 12):
            ws.cell(row=row_idx, column=c).value = None
            
        rec = records_by_date.get(date_str)
        if rec:
            status = rec.get('status', 'Hadir')
            if status == 'Hadir':
                if rec.get('clock_in'):
                    ws.cell(row=row_idx, column=3).value = format_excel_time(rec['clock_in'])
                if rec.get('clock_out'):
                    ws.cell(row=row_idx, column=4).value = format_excel_time(rec['clock_out'])
                if rec.get('overtime_in'):
                    ws.cell(row=row_idx, column=5).value = format_excel_time(rec['overtime_in'])
                if rec.get('overtime_out'):
                    ws.cell(row=row_idx, column=6).value = format_excel_time(rec['overtime_out'])
                if rec.get('activity'):
                    ws.cell(row=row_idx, column=7).value = str(rec['activity']).strip()
            elif status == 'Izin':
                ws.cell(row=row_idx, column=8).value = 'V'
                if rec.get('activity'):
                    ws.cell(row=row_idx, column=7).value = str(rec['activity']).strip()
            elif status == 'Sakit':
                ws.cell(row=row_idx, column=9).value = 'V'
                if rec.get('activity'):
                    ws.cell(row=row_idx, column=7).value = str(rec['activity']).strip()
            elif status == 'Alpa':
                ws.cell(row=row_idx, column=10).value = 'V'
                if rec.get('activity'):
                    ws.cell(row=row_idx, column=7).value = str(rec['activity']).strip()
            elif status == 'Cuti':
                ws.cell(row=row_idx, column=11).value = 'V'
                if rec.get('activity'):
                    ws.cell(row=row_idx, column=7).value = str(rec['activity']).strip()

    # 4. Signatures
    # Total row is at row (17 + num_days)
    total_row = 17 + num_days
    signer_name_row = total_row + 10
    signer_title_row = total_row + 11
    
    signer_leader_name = profile.get('signer_leader_name', "Annisa' Huwaida Ramadhani").strip()
    signer_leader_title = profile.get('signer_leader_title', "(Team Leader)").strip()
    signer_officer_name = profile.get('signer_officer_name', "Renita Prestyawati  ").strip()
    signer_officer_title = profile.get('signer_officer_title', "(Officer)").strip()
    signer_employee_name = profile.get('signer_employee_name', "Erick Ade H F").strip()
    signer_employee_nip = profile.get('signer_employee_nip', "NIP : 2260115473").strip()
    
    if signer_leader_name:
        ws.cell(row=signer_name_row, column=1).value = signer_leader_name
    if signer_leader_title:
        ws.cell(row=signer_title_row, column=1).value = signer_leader_title
        
    if signer_officer_name:
        ws.cell(row=signer_name_row, column=4).value = signer_officer_name
    if signer_officer_title:
        ws.cell(row=signer_title_row, column=4).value = signer_officer_title
        
    if signer_employee_name:
        ws.cell(row=signer_name_row, column=8).value = signer_employee_name
    if signer_employee_nip:
        ws.cell(row=signer_title_row, column=8).value = signer_employee_nip

    wb.save(output_path)
    return output_path
