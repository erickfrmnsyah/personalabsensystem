from flask import Flask, render_template, request, jsonify, send_file
import os
import calendar
import datetime
from database import (
    init_db, get_profile, update_profile, get_attendance_by_date,
    clock_in, clock_out, upsert_attendance, delete_attendance,
    get_month_records, get_recent_records, reset_attendance_today,
    auto_calculate_overtime, clear_all_attendance
)
from timesheet_generator import generate_timesheet_excel, MONTH_NAMES_ID

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = os.path.join(BASE_DIR, 'template_timesheet.xlsx')
EXPORT_DIR = os.path.join(BASE_DIR, 'exports')
os.makedirs(EXPORT_DIR, exist_ok=True)

# Initialize database upon startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/profile', methods=['GET'])
def api_get_profile():
    return jsonify(get_profile())

@app.route('/api/profile', methods=['POST'])
def api_update_profile():
    data = request.json or {}
    updated = update_profile(data)
    return jsonify({'success': True, 'profile': updated})

@app.route('/api/today', methods=['GET'])
def api_get_today():
    date_str = request.args.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    record = get_attendance_by_date(date_str)
    return jsonify({
        'date': date_str,
        'record': record
    })

@app.route('/api/calculate-hours', methods=['POST'])
def api_calculate_hours():
    data = request.json or {}
    date_str = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    c_in = data.get('clock_in', '08:00')
    c_out = data.get('clock_out', '17:00')
    result = auto_calculate_overtime(date_str, c_in, c_out)
    return jsonify(result)

@app.route('/api/clock-in', methods=['POST'])
def api_clock_in():
    data = request.json or {}
    date_str = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    time_str = data.get('time') or datetime.datetime.now().strftime('%H:%M')
    
    record = clock_in(date_str, time_str)
    return jsonify({
        'success': True,
        'message': f'Berhasil Clock In pada jam {time_str}',
        'record': record
    })

@app.route('/api/clock-out', methods=['POST'])
def api_clock_out():
    data = request.json or {}
    date_str = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    time_str = data.get('time') or datetime.datetime.now().strftime('%H:%M')
    activity = data.get('activity', '').strip()
    overtime_in = data.get('overtime_in')
    overtime_out = data.get('overtime_out')
    notes = data.get('notes', '').strip()
    
    if not activity:
        return jsonify({'success': False, 'message': 'Mohon isi agenda / kegiatan tugas hari ini!'}), 400
        
    record = clock_out(date_str, time_str, activity, overtime_in, overtime_out, notes)
    return jsonify({
        'success': True,
        'message': f'Berhasil Clock Out pada jam {time_str}',
        'record': record
    })

@app.route('/api/set-leave', methods=['POST'])
def api_set_leave():
    data = request.json or {}
    date_str = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    status = data.get('status', 'Izin')
    reason = data.get('reason', '').strip()
    
    record = upsert_attendance({
        'date': date_str,
        'clock_in': None,
        'clock_out': None,
        'overtime_in': None,
        'overtime_out': None,
        'activity': reason or f"Pengajuan {status}",
        'status': status
    })
    return jsonify({
        'success': True,
        'message': f'Status hari ini berhasil dicatat sebagai {status}',
        'record': record
    })

@app.route('/api/reset-today', methods=['POST'])
def api_reset_today():
    data = request.json or {}
    date_str = data.get('date') or datetime.date.today().strftime('%Y-%m-%d')
    reset_attendance_today(date_str)
    return jsonify({
        'success': True,
        'message': f'Berhasil mereset data absensi tanggal {date_str}'
    })

@app.route('/api/clear-all', methods=['POST'])
def api_clear_all():
    clear_all_attendance()
    return jsonify({
        'success': True,
        'message': 'Seluruh data absensi berhasil dikosongkan untuk pengujian.'
    })

@app.route('/api/attendance', methods=['POST'])
def api_upsert_attendance():
    data = request.json or {}
    if not data.get('date'):
        return jsonify({'success': False, 'message': 'Tanggal wajib diisi'}), 400
        
    record = upsert_attendance(data)
    return jsonify({
        'success': True,
        'message': 'Data absensi berhasil disimpan',
        'record': record
    })

@app.route('/api/attendance', methods=['DELETE'])
def api_delete_attendance():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'success': False, 'message': 'Tanggal wajib diisi'}), 400
        
    deleted = delete_attendance(date_str)
    return jsonify({
        'success': deleted,
        'message': 'Data absensi berhasil dihapus' if deleted else 'Data tidak ditemukan'
    })

@app.route('/api/attendance/month', methods=['GET'])
def api_get_month():
    now = datetime.datetime.now()
    year = int(request.args.get('year', now.year))
    month = int(request.args.get('month', now.month))
    
    num_days = calendar.monthrange(year, month)[1]
    db_records = get_month_records(year, month)
    
    days_data = []
    for d in range(1, num_days + 1):
        dt = datetime.date(year, month, d)
        d_str = dt.strftime('%Y-%m-%d')
        weekday = dt.weekday()
        rec = db_records.get(d_str, {})
        
        days_data.append({
            'day': d,
            'date': d_str,
            'weekday': weekday,
            'is_weekend': weekday >= 5,
            'clock_in': rec.get('clock_in', ''),
            'clock_out': rec.get('clock_out', ''),
            'overtime_in': rec.get('overtime_in', ''),
            'overtime_out': rec.get('overtime_out', ''),
            'activity': rec.get('activity', ''),
            'status': rec.get('status', 'Libur' if weekday >= 5 else 'Belum Absen' if dt <= now.date() else '-'),
            'notes': rec.get('notes', '')
        })
        
    return jsonify({
        'year': year,
        'month': month,
        'month_name': MONTH_NAMES_ID[month],
        'total_days': num_days,
        'records': db_records,
        'days': days_data
    })

@app.route('/api/quick-fill', methods=['POST'])
def api_quick_fill():
    data = request.json or {}
    year = int(data.get('year', datetime.date.today().year))
    month = int(data.get('month', datetime.date.today().month))
    c_in = data.get('clock_in', '08:00')
    c_out = data.get('clock_out', '17:00')
    default_act = data.get('activity', 'Daily QA Testing & Regression')
    skip_weekends = data.get('skip_weekends', True)
    overwrite_existing = data.get('overwrite_existing', False)
    
    num_days = calendar.monthrange(year, month)[1]
    existing = get_month_records(year, month)
    
    count = 0
    for d in range(1, num_days + 1):
        dt = datetime.date(year, month, d)
        d_str = dt.strftime('%Y-%m-%d')
        if skip_weekends and dt.weekday() >= 5:
            continue
            
        if not overwrite_existing and d_str in existing and existing[d_str].get('clock_in'):
            continue
            
        calc = auto_calculate_overtime(d_str, c_in, c_out)
        upsert_attendance({
            'date': d_str,
            'clock_in': calc['clock_in'],
            'clock_out': calc['clock_out'],
            'overtime_in': calc['overtime_in'],
            'overtime_out': calc['overtime_out'],
            'activity': default_act,
            'status': 'Hadir',
            'notes': 'Auto-filled'
        })
        count += 1
        
    return jsonify({
        'success': True,
        'message': f'Berhasil mengisi otomatis {count} hari kerja!'
    })

@app.route('/api/export-timesheet', methods=['POST'])
def api_export_timesheet():
    data = request.json or {}
    now = datetime.datetime.now()
    year = int(data.get('year', now.year))
    month = int(data.get('month', now.month))
    
    profile_override = data.get('profile', {})
    db_profile = get_profile()
    active_profile = {**db_profile, **profile_override}
    
    records_override = data.get('records')
    if records_override is not None:
        records_by_date = records_override
    else:
        records_by_date = get_month_records(year, month)
        
    month_name = MONTH_NAMES_ID[month]
    emp_name_clean = "".join(c for c in active_profile.get('employee_name', 'Timesheet') if c.isalnum() or c in (' ', '_', '-')).strip()
    filename = f"Timesheet_{month_name}_{year}_{emp_name_clean}.xlsx"
    out_path = os.path.join(EXPORT_DIR, filename)
    
    try:
        generate_timesheet_excel(TEMPLATE_FILE, out_path, active_profile, records_by_date, year, month)
        return send_file(
            out_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'Gagal generate timesheet: {str(e)}'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("   APLIKASI ABSENSI & TIMESHEET OTOMATIS BPL")
    print("   Buka browser di: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
