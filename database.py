import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'attendance.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            clock_in TEXT,
            clock_out TEXT,
            overtime_in TEXT,
            overtime_out TEXT,
            activity TEXT,
            status TEXT DEFAULT 'Hadir',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Profile table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            employee_name TEXT,
            nip TEXT,
            position TEXT,
            department TEXT,
            project_name TEXT,
            project_code TEXT,
            pm_name TEXT,
            signer_leader_name TEXT,
            signer_leader_title TEXT,
            signer_officer_name TEXT,
            signer_officer_title TEXT,
            signer_employee_name TEXT,
            signer_employee_nip TEXT,
            standard_clock_in TEXT DEFAULT '08:00',
            standard_clock_out TEXT DEFAULT '17:00'
        )
    ''')
    
    cursor.execute('SELECT * FROM profile WHERE id = 1')
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO profile (
                id, employee_name, nip, position, department,
                project_name, project_code, pm_name,
                signer_leader_name, signer_leader_title,
                signer_officer_name, signer_officer_title,
                signer_employee_name, signer_employee_nip,
                standard_clock_in, standard_clock_out
            ) VALUES (
                1,
                'Erick Ade Hending Firmansyah',
                '240199238',
                'QA Tester level 1',
                'Digital Retail Banking',
                'Livin App 2026',
                'DRB2601010',
                "Annisa' Huwaida Ramadhani",
                "Annisa' Huwaida Ramadhani",
                '(Team Leader)',
                'Renita Prestyawati  ',
                '(Officer)',
                'Erick Ade H F',
                'NIP : 2260115473',
                '08:00',
                '17:00'
            )
        ''')

    # Table creation and profile seeding completed
    conn.commit()
    conn.close()

def get_profile():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM profile WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}

def update_profile(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE profile SET
            employee_name = ?,
            nip = ?,
            position = ?,
            department = ?,
            project_name = ?,
            project_code = ?,
            pm_name = ?,
            signer_leader_name = ?,
            signer_leader_title = ?,
            signer_officer_name = ?,
            signer_officer_title = ?,
            signer_employee_name = ?,
            signer_employee_nip = ?,
            standard_clock_in = ?,
            standard_clock_out = ?
        WHERE id = 1
    ''', (
        data.get('employee_name', ''),
        data.get('nip', ''),
        data.get('position', ''),
        data.get('department', ''),
        data.get('project_name', ''),
        data.get('project_code', ''),
        data.get('pm_name', ''),
        data.get('signer_leader_name', ''),
        data.get('signer_leader_title', ''),
        data.get('signer_officer_name', ''),
        data.get('signer_officer_title', ''),
        data.get('signer_employee_name', ''),
        data.get('signer_employee_nip', ''),
        data.get('standard_clock_in', '08:00'),
        data.get('standard_clock_out', '17:00')
    ))
    conn.commit()
    conn.close()
    return get_profile()

def get_attendance_by_date(date_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM attendance WHERE date = ?', (date_str,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def auto_calculate_overtime(date_str, c_in, c_out):
    """
    BPL Working Hours & Overtime Rules:
    1. Weekend (Sabtu/Minggu):
       - Normal working hours: None
       - Overtime: c_in to c_out
    2. Weekday (Senin - Jumat):
       - Regular working hours window: > 07:00 and <= 17:00 (Standard: 08:00 - 17:00 cutoff)
       - If clock_in is OUTSIDE regular window (< 07:00 or >= 17:00):
         (e.g. late night 19:00 - 23:00, or early morning 02:00 - 05:00)
         - Regular hours: None
         - Overtime: c_in to c_out
       - If clock_in is within regular window (>= 07:00 and < 17:00):
         - If clock_out > '17:00':
           - Regular hours: c_in to '17:00' (Cutoff)
           - Overtime: '17:00' to c_out
         - If clock_out <= '17:00':
           - Regular hours: c_in to c_out
           - Overtime: None
    """
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    is_weekend = dt.weekday() >= 5
    
    def to_min(t_str):
        if not t_str: return 0
        h, m = map(int, t_str.split(':'))
        return h * 60 + m

    in_m = to_min(c_in)
    out_m = to_min(c_out)
    m_0700 = 7 * 60      # 07:00
    m_1700 = 17 * 60     # 17:00

    if is_weekend:
        return {
            'clock_in': None,
            'clock_out': None,
            'overtime_in': c_in,
            'overtime_out': c_out,
            'is_overtime_only': True,
            'description': 'Weekend: Seluruh jam masuk ke kolom LEMBUR'
        }

    # Weekday
    # Check if clock in was outside regular hours (< 07:00 or >= 17:00)
    if in_m < m_0700 or in_m >= m_1700:
        return {
            'clock_in': None,
            'clock_out': None,
            'overtime_in': c_in,
            'overtime_out': c_out,
            'is_overtime_only': True,
            'description': 'Lembur Shift (< 07:00 atau ≥ 17:00): Jam reguler dikosongkan, masuk ke kolom LEMBUR'
        }
    
    # Regular Clock In (07:00 - 17:00)
    if out_m > m_1700:
        return {
            'clock_in': c_in,
            'clock_out': '17:00',
            'overtime_in': '17:00',
            'overtime_out': c_out,
            'is_overtime_only': False,
            'description': f'Reguler ({c_in} - 17:00) + LEMBUR (17:00 - {c_out})'
        }
    else:
        return {
            'clock_in': c_in,
            'clock_out': c_out,
            'overtime_in': None,
            'overtime_out': None,
            'is_overtime_only': False,
            'description': f'Reguler Normal ({c_in} - {c_out}) tanpa lembur'
        }

def clock_in(date_str, time_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_ts = datetime.now().isoformat()
    
    # Check if this clock-in is in overtime window
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    is_weekend = dt.weekday() >= 5
    h = int(time_str.split(':')[0])
    is_overtime_window = is_weekend or (h < 7 or h >= 17)

    cursor.execute('''
        INSERT INTO attendance (date, clock_in, overtime_in, status, updated_at)
        VALUES (?, ?, ?, 'Hadir', ?)
        ON CONFLICT(date) DO UPDATE SET
            clock_in = excluded.clock_in,
            overtime_in = excluded.overtime_in,
            status = 'Hadir',
            updated_at = excluded.updated_at
    ''', (date_str, time_str, time_str if is_overtime_window else None, now_ts))
    conn.commit()
    conn.close()
    return get_attendance_by_date(date_str)

def clock_out(date_str, time_str, activity, overtime_in=None, overtime_out=None, notes=None):
    rec = get_attendance_by_date(date_str)
    # Determine the start time from either clock_in or overtime_in
    raw_cin = '08:00'
    if rec:
        raw_cin = rec.get('clock_in') or rec.get('overtime_in') or '08:00'
    raw_cout = time_str
    
    if not overtime_in and not overtime_out:
        calc = auto_calculate_overtime(date_str, raw_cin, raw_cout)
        save_cin = calc['clock_in']
        save_cout = calc['clock_out']
        save_otin = calc['overtime_in']
        save_otout = calc['overtime_out']
    else:
        save_cin = raw_cin
        save_cout = raw_cout
        save_otin = overtime_in
        save_otout = overtime_out

    conn = get_db_connection()
    cursor = conn.cursor()
    now_ts = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO attendance (date, clock_in, clock_out, activity, overtime_in, overtime_out, notes, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Hadir', ?)
        ON CONFLICT(date) DO UPDATE SET
            clock_in = ?,
            clock_out = ?,
            activity = excluded.activity,
            overtime_in = ?,
            overtime_out = ?,
            notes = excluded.notes,
            status = 'Hadir',
            updated_at = excluded.updated_at
    ''', (date_str, save_cin, save_cout, activity, save_otin, save_otout, notes, now_ts,
          save_cin, save_cout, save_otin, save_otout))
    conn.commit()
    conn.close()
    return get_attendance_by_date(date_str)

def clear_all_attendance():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM attendance')
    conn.commit()
    conn.close()
    return True

def reset_attendance_today(date_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM attendance WHERE date = ?', (date_str,))
    conn.commit()
    conn.close()
    return True

def upsert_attendance(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_ts = datetime.now().isoformat()
    date_str = data.get('date')
    if not date_str:
        conn.close()
        raise ValueError("Field 'date' is required")
        
    cursor.execute('''
        INSERT INTO attendance (date, clock_in, clock_out, overtime_in, overtime_out, activity, status, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
            clock_in = excluded.clock_in,
            clock_out = excluded.clock_out,
            overtime_in = excluded.overtime_in,
            overtime_out = excluded.overtime_out,
            activity = excluded.activity,
            status = excluded.status,
            notes = excluded.notes,
            updated_at = excluded.updated_at
    ''', (
        date_str,
        data.get('clock_in'),
        data.get('clock_out'),
        data.get('overtime_in'),
        data.get('overtime_out'),
        data.get('activity', ''),
        data.get('status', 'Hadir'),
        data.get('notes', ''),
        now_ts
    ))
    conn.commit()
    conn.close()
    return get_attendance_by_date(date_str)

def delete_attendance(date_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM attendance WHERE date = ?', (date_str,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_month_records(year, month):
    prefix = f"{year:04d}-{month:02d}-%"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM attendance WHERE date LIKE ? ORDER BY date ASC', (prefix,))
    rows = cursor.fetchall()
    conn.close()
    return {row['date']: dict(row) for row in rows}

def get_recent_records(limit=60):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM attendance ORDER BY date DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
