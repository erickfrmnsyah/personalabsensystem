// Global State
let currentProfile = {};
let currentDeviceDate = '';
let currentDeviceTime = '';
let todayRecord = null;
let currentMonthData = null;

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadProfile();
    initMonthYearSelectors();
    loadTodayAttendance();
    lucide.createIcons();
});

// -------------------------------------------------------------
// Realtime Clock & Device Time
// -------------------------------------------------------------
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    
    // YYYY-MM-DD
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    currentDeviceDate = `${y}-${m}-${d}`;

    // HH:mm and HH:mm:ss
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentDeviceTime = `${hours}:${minutes}`;
    const timeWithSec = `${hours}:${minutes}:${seconds}`;

    // Update Elements
    const navClock = document.getElementById('nav-live-clock');
    const navDate = document.getElementById('nav-live-date');
    const heroClock = document.getElementById('hero-clock');
    const heroDate = document.getElementById('hero-date');
    const heroDayType = document.getElementById('hero-day-type');

    const dayIdx = now.getDay();
    const dayName = DAYS_ID[dayIdx];
    const monthName = MONTHS_ID[now.getMonth()];
    const formattedDate = `${dayName}, ${d} ${monthName} ${y}`;

    if (navClock) navClock.textContent = timeWithSec;
    if (navDate) navDate.textContent = formattedDate;
    if (heroClock) heroClock.textContent = timeWithSec;
    if (heroDate) heroDate.textContent = formattedDate;

    // Determine current time mode: Overtime window vs Regular window
    const h = now.getHours();
    if (heroDayType) {
        if (dayIdx === 0 || dayIdx === 6) {
            heroDayType.textContent = 'Hari Libur / Weekend: Seluruh jam masuk otomatis dicatat sebagai LEMBUR';
        } else if (h < 7) {
            heroDayType.textContent = 'Lembur Dini Hari (< 07:00): Otomatis masuk ke kolom LEMBUR (Datang/Pulang reguler dikosongkan)';
        } else if (h >= 17) {
            heroDayType.textContent = 'Lembur Malam (≥ 17:00): Otomatis masuk ke kolom LEMBUR';
        } else {
            heroDayType.textContent = 'Jam Kerja Reguler (07:00 - 17:00): Cutoff pulang jam 17:00, selebihnya dihitung lembur';
        }
    }
}

// -------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-700', 'bg-blue-50', 'border-blue-200');
        btn.classList.add('text-slate-600');
    });

    const activeContent = document.getElementById(`tab-content-${tabId}`);
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);

    if (activeContent) activeContent.classList.remove('hidden');
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600');
        activeBtn.classList.add('text-blue-700', 'bg-blue-50', 'border', 'border-blue-200');
    }

    if (tabId === 'timesheet') {
        loadTimesheetData();
    } else if (tabId === 'history') {
        loadHistoryData();
    }

    lucide.createIcons();
}

// -------------------------------------------------------------
// Profile Handling
// -------------------------------------------------------------
async function loadProfile() {
    try {
        const res = await fetch('/api/profile');
        currentProfile = await res.json();
        
        const navName = document.getElementById('nav-user-name');
        const navRole = document.getElementById('nav-user-role');
        const avatar = document.getElementById('user-avatar-initials');
        
        if (navName && currentProfile.employee_name) {
            navName.textContent = currentProfile.employee_name;
            const names = currentProfile.employee_name.trim().split(' ');
            if (names.length >= 2) {
                avatar.textContent = (names[0][0] + names[1][0]).toUpperCase();
            } else if (names.length === 1 && names[0]) {
                avatar.textContent = names[0].substring(0, 2).toUpperCase();
            }
        }
        if (navRole && currentProfile.position) {
            navRole.textContent = currentProfile.position;
        }

        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '-';
        };
        setTxt('side-name', currentProfile.employee_name);
        setTxt('side-nip', currentProfile.nip);
        setTxt('side-pos', currentProfile.position);
        setTxt('side-project', currentProfile.project_name);
        setTxt('side-pcode', currentProfile.project_code);
        setTxt('side-pm', currentProfile.pm_name);

        populateTimesheetHeaderForm(currentProfile);
        populateProfileForm(currentProfile);
    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

function populateTimesheetHeaderForm(p) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('ts-header-name', p.employee_name);
    setVal('ts-header-nip', p.nip);
    setVal('ts-header-department', p.department);
    setVal('ts-header-position', p.position);
    setVal('ts-header-project-name', p.project_name);
    setVal('ts-header-project-code', p.project_code);
    setVal('ts-header-pm', p.pm_name);

    const badge = document.getElementById('preview-project-badge');
    if (badge && p.project_name) badge.textContent = p.project_name;
}

function populateProfileForm(p) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('prof-name', p.employee_name);
    setVal('prof-nip', p.nip);
    setVal('prof-position', p.position);
    setVal('prof-department', p.department);
    setVal('prof-project-name', p.project_name);
    setVal('prof-project-code', p.project_code);
    setVal('prof-pm', p.pm_name);

    setVal('prof-signer-leader-name', p.signer_leader_name);
    setVal('prof-signer-leader-title', p.signer_leader_title);
    setVal('prof-signer-officer-name', p.signer_officer_name);
    setVal('prof-signer-officer-title', p.signer_officer_title);
    setVal('prof-signer-emp-name', p.signer_employee_name);
    setVal('prof-signer-emp-nip', p.signer_employee_nip);

    setVal('prof-std-in', p.standard_clock_in || '08:00');
    setVal('prof-std-out', p.standard_clock_out || '17:00');
}

async function saveProfile() {
    const data = {
        employee_name: document.getElementById('prof-name').value,
        nip: document.getElementById('prof-nip').value,
        position: document.getElementById('prof-position').value,
        department: document.getElementById('prof-department').value,
        project_name: document.getElementById('prof-project-name').value,
        project_code: document.getElementById('prof-project-code').value,
        pm_name: document.getElementById('prof-pm').value,
        signer_leader_name: document.getElementById('prof-signer-leader-name').value,
        signer_leader_title: document.getElementById('prof-signer-leader-title').value,
        signer_officer_name: document.getElementById('prof-signer-officer-name').value,
        signer_officer_title: document.getElementById('prof-signer-officer-title').value,
        signer_employee_name: document.getElementById('prof-signer-emp-name').value,
        signer_employee_nip: document.getElementById('prof-signer-emp-nip').value,
        standard_clock_in: document.getElementById('prof-std-in').value,
        standard_clock_out: document.getElementById('prof-std-out').value
    };

    try {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
            currentProfile = json.profile;
            loadProfile();
            Swal.fire({
                icon: 'success',
                title: 'Tersimpan!',
                text: 'Profil berhasil diperbarui.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (err) {
        Swal.fire('Error', 'Gagal menyimpan profil: ' + err.message, 'error');
    }
}

async function saveHeaderAsDefaultProfile() {
    const data = {
        ...currentProfile,
        employee_name: document.getElementById('ts-header-name').value,
        nip: document.getElementById('ts-header-nip').value,
        department: document.getElementById('ts-header-department').value,
        position: document.getElementById('ts-header-position').value,
        project_name: document.getElementById('ts-header-project-name').value,
        project_code: document.getElementById('ts-header-project-code').value,
        pm_name: document.getElementById('ts-header-pm').value
    };

    try {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success) {
            currentProfile = json.profile;
            loadProfile();
            Swal.fire({
                icon: 'success',
                title: 'Disimpan!',
                text: 'Data header berhasil disimpan sebagai profil default.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (err) {
        Swal.fire('Error', 'Gagal menyimpan: ' + err.message, 'error');
    }
}

// -------------------------------------------------------------
// Absensi Hari Ini (Clock In, Clock Out, Izin, Sakit, Cuti)
// -------------------------------------------------------------
async function loadTodayAttendance() {
    try {
        const res = await fetch(`/api/today?date=${currentDeviceDate}`);
        const data = await res.json();
        todayRecord = data.record;
        renderTodayState(todayRecord);
    } catch (err) {
        console.error('Error fetching today attendance:', err);
    }
}

function isOvertimeWindow(timeStr) {
    if (!timeStr) return false;
    const h = parseInt(timeStr.split(':')[0]);
    // Outside 07:00 - 17:00 (i.e. < 07:00 or >= 17:00)
    return h < 7 || h >= 17;
}

function renderTodayState(record) {
    const heroStatusPill = document.getElementById('hero-status-pill');
    const cardClockin = document.getElementById('card-clockin');
    const cardClockout = document.getElementById('card-clockout');
    const cardCompleted = document.getElementById('card-completed-actions');
    const cardLeaveActive = document.getElementById('card-leave-active');
    const boxLeaveButtons = document.getElementById('box-leave-buttons');
    
    const badgeClockin = document.getElementById('badge-clockin-status');
    const badgeClockout = document.getElementById('badge-clockout-status');
    const btnClockin = document.getElementById('btn-clockin');
    const inputCin = document.getElementById('input-clockin-time');
    const inputCout = document.getElementById('input-clockout-time');

    if (!inputCin.value) {
        inputCin.value = currentDeviceTime || '08:00';
    }
    if (!inputCout.value) {
        inputCout.value = currentDeviceTime || '17:00';
    }

    const curCin = inputCin.value;
    const inOvertime = isOvertimeWindow(curCin);

    // CHECK IF TODAY IS ON LEAVE (Izin / Sakit / Cuti)
    if (record && ['Izin', 'Sakit', 'Cuti', 'Alpa'].includes(record.status)) {
        heroStatusPill.className = 'text-sm font-extrabold text-amber-300 mt-0.5';
        heroStatusPill.textContent = `Tidak Masuk: ${record.status}`;

        cardLeaveActive.classList.remove('hidden');
        boxLeaveButtons.classList.add('hidden');
        cardClockin.classList.add('hidden');
        cardClockout.classList.add('hidden');
        cardCompleted.classList.add('hidden');

        const titleEl = document.getElementById('leave-active-title');
        const reasonEl = document.getElementById('leave-active-reason');
        const badgeEl = document.getElementById('leave-active-badge');

        let char = 'I';
        if (record.status === 'Sakit') char = 'S';
        else if (record.status === 'Cuti') char = 'C';
        else if (record.status === 'Alpa') char = 'A';

        badgeEl.textContent = char;
        titleEl.textContent = `${record.status} (${char})`;
        reasonEl.textContent = `Keterangan: ${record.activity || 'Tidak ada keterangan tambahan'}`;

        lucide.createIcons();
        return;
    }

    cardLeaveActive.classList.add('hidden');
    boxLeaveButtons.classList.remove('hidden');
    cardClockin.classList.remove('hidden');
    cardClockout.classList.remove('hidden');

    const hasClockIn = record && (record.clock_in || record.overtime_in);
    const hasClockOut = record && (record.clock_out || record.overtime_out);
    const activeStartTime = record ? (record.clock_in || record.overtime_in) : null;
    const activeEndTime = record ? (record.clock_out || record.overtime_out) : null;

    if (!hasClockIn && !hasClockOut) {
        // STATE 1: Belum Clock In
        heroStatusPill.className = 'text-sm font-extrabold text-amber-300 mt-0.5';
        heroStatusPill.textContent = inOvertime ? 'Mode Lembur (Belum Clock In)' : 'Belum Absen Masuk';

        badgeClockin.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800';
        badgeClockin.textContent = inOvertime ? 'Siap Clock In Lembur' : 'Belum Clock In';
        btnClockin.disabled = false;
        
        if (inOvertime) {
            btnClockin.className = 'w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 text-base';
            btnClockin.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i><span>KLIK UNTUK CLOCK IN LEMBUR</span>';
        } else {
            btnClockin.className = 'w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 text-base';
            btnClockin.innerHTML = '<i data-lucide="log-in" class="w-5 h-5"></i><span>KLIK UNTUK CLOCK IN REGULER</span>';
        }

        badgeClockout.className = 'px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500';
        badgeClockout.textContent = 'Menunggu Clock In Pagi / Lembur';
        cardClockout.classList.add('opacity-75');

        cardCompleted.classList.add('hidden');
    } else if (hasClockIn && !hasClockOut) {
        // STATE 2: Sudah Clock In, Menunggu Clock Out
        const isStartOt = isOvertimeWindow(activeStartTime);
        heroStatusPill.className = 'text-sm font-extrabold text-emerald-300 mt-0.5';
        heroStatusPill.textContent = isStartOt ? `Sedang Lembur (Mulai: ${activeStartTime})` : `Sedang Bekerja (Masuk: ${activeStartTime})`;

        badgeClockin.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800';
        badgeClockin.textContent = `Sudah Clock In: ${activeStartTime} WIB`;
        inputCin.value = activeStartTime;
        btnClockin.disabled = true;
        btnClockin.className = 'w-full py-3 px-6 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed';
        btnClockin.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i><span>SUDAH CLOCK IN</span>';

        cardClockout.classList.remove('opacity-75');
        badgeClockout.className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse';
        badgeClockout.textContent = 'Silakan Clock Out & Isi Agenda';

        inputCout.value = currentDeviceTime;
        cardCompleted.classList.add('hidden');
    } else {
        // STATE 3: Sudah Selesai (Clock In & Out Lengkap)
        heroStatusPill.className = 'text-sm font-extrabold text-blue-300 mt-0.5';
        heroStatusPill.textContent = `Selesai (${activeStartTime} - ${activeEndTime})`;

        inputCin.value = activeStartTime || '08:00';
        inputCout.value = activeEndTime || '17:00';
        if (record.activity) {
            document.getElementById('clockout-activity').value = record.activity;
        }

        badgeClockin.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800';
        badgeClockin.textContent = `Masuk: ${activeStartTime}`;
        btnClockin.disabled = true;
        btnClockin.className = 'w-full py-3 px-6 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed';
        btnClockin.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i><span>SUDAH CLOCK IN</span>';

        badgeClockout.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800';
        badgeClockout.textContent = `Selesai: ${activeEndTime}`;

        cardCompleted.classList.remove('hidden');
        const summaryText = document.getElementById('completed-summary-text');
        
        let detailStr = '';
        if (record.clock_in && record.clock_out) {
            detailStr += `Reguler: ${record.clock_in} s/d ${record.clock_out}`;
        }
        if (record.overtime_in && record.overtime_out) {
            detailStr += (detailStr ? ' | ' : '') + `Lembur: ${record.overtime_in} s/d ${record.overtime_out}`;
        }
        if (summaryText) {
            summaryText.textContent = `${detailStr} | Agenda: ${record.activity || '-'}`;
        }
    }

    updateOvertimePreview();
    lucide.createIcons();
}

function updateOvertimePreview() {
    const inputCin = document.getElementById('input-clockin-time');
    const inputCout = document.getElementById('input-clockout-time');
    const previewDetails = document.getElementById('ot-preview-details');
    if (!inputCin || !inputCout || !previewDetails) return;

    const cin = inputCin.value || '08:00';
    const cout = inputCout.value || '17:00';
    const dateObj = new Date(currentDeviceDate);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    const toMin = (t) => {
        const parts = t.split(':').map(Number);
        return parts[0] * 60 + parts[1];
    };

    const cinMin = toMin(cin);
    const coutMin = toMin(cout);
    const min0700 = 7 * 60;   // 07:00
    const min1700 = 17 * 60;  // 17:00

    if (isWeekend) {
        previewDetails.innerHTML = `
            <div class="text-amber-800 font-bold">Hari Libur / Akhir Pekan</div>
            <div>Jam Reguler (Datang & Pulang): <span class="text-slate-400 italic">Dikosongkan</span></div>
            <div>Kolom LEMBUR: <strong class="text-amber-900">${cin} s/d ${cout}</strong> (Seluruh jam kerja masuk ke LEMBUR)</div>
        `;
    } else {
        // Weekday
        // Check if Clock In was outside regular window (< 07:00 or >= 17:00)
        if (cinMin < min0700 || cinMin >= min1700) {
            previewDetails.innerHTML = `
                <div class="text-indigo-900 font-bold">Lembur Khusus (< 07:00 atau ≥ 17:00)</div>
                <div>Jam Reguler (Datang & Pulang): <span class="text-slate-400 italic">Dikosongkan (Sesuai aturan BPL)</span></div>
                <div class="text-blue-900 font-bold">Kolom LEMBUR: ${cin} s/d ${cout} (Otomatis masuk lembur)</div>
            `;
        } else {
            // Regular Clock In (07:00 - 17:00)
            if (coutMin > min1700) {
                previewDetails.innerHTML = `
                    <div>Jam Kerja Normal: <strong class="text-slate-800">${cin} s/d 17:00 (Cutoff)</strong></div>
                    <div class="text-blue-900 font-bold">Kolom LEMBUR: 17:00 s/d ${cout} (Otomatis masuk lembur)</div>
                `;
            } else {
                previewDetails.innerHTML = `
                    <div>Jam Kerja Normal: <strong class="text-slate-800">${cin} s/d ${cout}</strong></div>
                    <div class="text-slate-500">Kolom Lembur: <span class="italic">Tidak ada lembur (Clock Out ≤ 17:00)</span></div>
                `;
            }
        }
    }
}

async function handleClockIn() {
    const timeVal = document.getElementById('input-clockin-time').value || currentDeviceTime || '08:00';
    
    try {
        const res = await fetch('/api/clock-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: currentDeviceDate,
                time: timeVal
            })
        });
        const json = await res.json();
        if (json.success) {
            const isOt = isOvertimeWindow(timeVal);
            const msg = isOt 
                ? `Clock In Lembur tercatat pada jam ${timeVal} WIB. Nanti saat selesai, silakan Clock Out dan isi agendanya.` 
                : `Clock In Reguler tercatat pada jam ${timeVal} WIB. Selamat bekerja! Nanti sore silakan Clock Out dan isi agendanya.`;
            
            Swal.fire({
                icon: 'success',
                title: isOt ? 'Clock In Lembur Berhasil!' : 'Clock In Berhasil!',
                text: msg,
                confirmButtonColor: '#059669'
            });
            todayRecord = json.record;
            renderTodayState(todayRecord);
        } else {
            Swal.fire('Gagal', json.message || 'Terjadi kesalahan', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Gagal Clock In: ' + err.message, 'error');
    }
}

async function handleClockOut() {
    const activity = document.getElementById('clockout-activity').value.trim();
    if (!activity) {
        Swal.fire({
            icon: 'warning',
            title: 'Agenda Tugas Wajib Diisi!',
            text: 'Silakan tuliskan kegiatan atau pengujian UAT yang Anda kerjakan pada kolom agenda.'
        });
        document.getElementById('clockout-activity').focus();
        return;
    }

    const timeVal = document.getElementById('input-clockout-time').value || currentDeviceTime || '17:00';

    try {
        const res = await fetch('/api/clock-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: currentDeviceDate,
                time: timeVal,
                activity: activity
            })
        });
        const json = await res.json();
        if (json.success) {
            Swal.fire({
                icon: 'success',
                title: 'Clock Out Berhasil!',
                html: `
                    <p class="text-sm">Absensi dan agenda telah tersimpan!</p>
                    <p class="text-xs text-slate-500 mt-2">Data jam dan lembur otomatis terhitung dan masuk ke Timesheet BPL.</p>
                `,
                confirmButtonColor: '#2563eb'
            });
            todayRecord = json.record;
            renderTodayState(todayRecord);
        } else {
            Swal.fire('Gagal', json.message || 'Terjadi kesalahan', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Gagal Clock Out: ' + err.message, 'error');
    }
}

// -------------------------------------------------------------
// Handle Izin / Sakit / Cuti Prompt
// -------------------------------------------------------------
async function handleLeavePrompt(leaveType) {
    let placeholder = 'Tuliskan alasan / keterangan izin...';
    let defaultReason = 'Keperluan Pribadi';

    if (leaveType === 'Sakit') {
        placeholder = 'Contoh: Sakit Flu & Demam, Istirahat dokter...';
        defaultReason = 'Sakit';
    } else if (leaveType === 'Cuti') {
        placeholder = 'Contoh: Cuti Tahunan, Acara Keluarga...';
        defaultReason = 'Cuti Tahunan';
    } else if (leaveType === 'Izin') {
        placeholder = 'Contoh: Izin Urusan Keluarga, Izin Keperluan Mendesak...';
        defaultReason = 'Izin Keperluan Mendesak';
    }

    const { value: reason } = await Swal.fire({
        title: `Ajukan ${leaveType} Hari Ini?`,
        text: `Jam kerja akan dikosongkan dan kolom ${leaveType} akan otomatis terceklis (V) pada Timesheet BPL.`,
        input: 'text',
        inputLabel: 'Keterangan / Alasan:',
        inputValue: defaultReason,
        inputPlaceholder: placeholder,
        showCancelButton: true,
        confirmButtonText: `Ya, Catat ${leaveType}`,
        cancelButtonText: 'Batal',
        confirmButtonColor: leaveType === 'Sakit' ? '#d97706' : (leaveType === 'Cuti' ? '#7c3aed' : '#2563eb'),
        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return 'Mohon tuliskan alasan / keterangannya!';
            }
        }
    });

    if (reason) {
        try {
            const res = await fetch('/api/set-leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: currentDeviceDate,
                    status: leaveType,
                    reason: reason.trim()
                })
            });
            const json = await res.json();
            if (json.success) {
                Swal.fire({
                    icon: 'success',
                    title: `Status ${leaveType} Tercatat!`,
                    text: `Catatan telah disimpan di Timesheet.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                todayRecord = json.record;
                renderTodayState(todayRecord);
            } else {
                Swal.fire('Gagal', json.message || 'Terjadi kesalahan', 'error');
            }
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
}

async function handleResetToday() {
    Swal.fire({
        title: 'Absen Ulang Hari Ini?',
        text: 'Data absensi hari ini akan direset sehingga Anda bisa mengulang Clock In dan Clock Out kembali.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Reset Hari Ini',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch('/api/reset-today', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: currentDeviceDate })
                });
                const json = await res.json();
                if (json.success) {
                    todayRecord = null;
                    document.getElementById('clockout-activity').value = '';
                    renderTodayState(null);
                    Swal.fire({
                        icon: 'success',
                        title: 'Direset!',
                        text: 'Silakan lakukan Clock In sekarang.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    });
}

function insertActivityTag(tag) {
    const txtArea = document.getElementById('clockout-activity');
    if (!txtArea) return;
    if (txtArea.value.trim() === '') {
        txtArea.value = tag;
    } else {
        txtArea.value += ', ' + tag;
    }
    txtArea.focus();
}

// -------------------------------------------------------------
// Timesheet Bulanan Tab Logic
// -------------------------------------------------------------
function initMonthYearSelectors() {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const selMonth = document.getElementById('select-timesheet-month');
    const selYear = document.getElementById('select-timesheet-year');

    if (selMonth) selMonth.value = String(curMonth);
    if (selYear) selYear.value = String(curYear);
}

async function loadTimesheetData() {
    const selMonth = document.getElementById('select-timesheet-month');
    const selYear = document.getElementById('select-timesheet-year');
    if (!selMonth || !selYear) return;

    const month = parseInt(selMonth.value);
    const year = parseInt(selYear.value);

    const periodeInput = document.getElementById('ts-header-periode');
    if (periodeInput) {
        periodeInput.value = `${MONTHS_ID[month - 1]} ${year}`;
    }

    const titleEl = document.getElementById('preview-table-title');
    if (titleEl) {
        titleEl.textContent = `Pratinjau Timesheet - ${MONTHS_ID[month - 1]} ${year}`;
    }

    try {
        const res = await fetch(`/api/attendance/month?year=${year}&month=${month}`);
        currentMonthData = await res.json();
        renderTimesheetTable(currentMonthData);
    } catch (err) {
        console.error('Failed to load month attendance:', err);
    }
}

function renderTimesheetTable(data) {
    const tbody = document.getElementById('timesheet-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let hadirCount = 0;
    let lemburCount = 0;
    let izinCount = 0;

    data.days.forEach(day => {
        const tr = document.createElement('tr');
        
        if (day.is_weekend) {
            tr.className = 'bg-slate-50/80 hover:bg-slate-100 text-slate-500 transition';
        } else {
            tr.className = 'hover:bg-blue-50/40 transition';
        }

        const dateParts = day.date.split('-');
        const formattedDisplayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        const dayName = DAYS_ID[new Date(day.date).getDay()];

        if (day.status === 'Hadir' && (day.clock_in || day.activity || day.overtime_in)) {
            hadirCount++;
        }
        if (day.overtime_in || day.overtime_out) {
            lemburCount++;
        }
        if (['Izin', 'Sakit', 'Alpa', 'Cuti'].includes(day.status)) {
            izinCount++;
        }

        const isI = day.status === 'Izin' ? '<span class="font-bold text-blue-600">V</span>' : '';
        const isS = day.status === 'Sakit' ? '<span class="font-bold text-amber-600">V</span>' : '';
        const isA = day.status === 'Alpa' ? '<span class="font-bold text-red-600">V</span>' : '';
        const isC = day.status === 'Cuti' ? '<span class="font-bold text-emerald-600">V</span>' : '';

        tr.innerHTML = `
            <td class="p-2 border-r border-slate-200 text-center font-mono text-[11px] font-semibold">${formattedDisplayDate}</td>
            <td class="p-2 border-r border-slate-200 text-center font-medium ${day.is_weekend ? 'text-rose-500 font-semibold' : ''}">${dayName}</td>
            <td class="p-2 border-r border-slate-200 text-center font-mono ${day.clock_in ? 'font-bold text-slate-800' : 'text-slate-300'}">${day.clock_in || '-'}</td>
            <td class="p-2 border-r border-slate-200 text-center font-mono ${day.clock_out ? 'font-bold text-slate-800' : 'text-slate-300'}">${day.clock_out || '-'}</td>
            <td class="p-2 border-r border-slate-200 text-center font-mono ${day.overtime_in ? 'font-bold text-amber-700' : 'text-slate-300'}">${day.overtime_in || '-'}</td>
            <td class="p-2 border-r border-slate-200 text-center font-mono ${day.overtime_out ? 'font-bold text-amber-700' : 'text-slate-300'}">${day.overtime_out || '-'}</td>
            <td class="p-2 border-r border-slate-200 text-slate-800 font-medium truncate max-w-[280px]" title="${day.activity || ''}">
                ${day.activity ? day.activity : (day.is_weekend ? '<span class="text-slate-400 italic">Libur Akhir Pekan</span>' : '<span class="text-slate-300 italic">-</span>')}
            </td>
            <td class="p-2 border-r border-slate-200 text-center">${isI}</td>
            <td class="p-2 border-r border-slate-200 text-center">${isS}</td>
            <td class="p-2 border-r border-slate-200 text-center">${isA}</td>
            <td class="p-2 border-r border-slate-200 text-center">${isC}</td>
            <td class="p-2 text-center">
                <button onclick="openManualModal('${day.date}')" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition" title="Koreksi Tanggal Ini">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    document.getElementById('stat-hadir-count').textContent = `Hadir: ${hadirCount} hari`;
    document.getElementById('stat-lembur-count').textContent = `Lembur: ${lemburCount} hari`;
    document.getElementById('stat-izin-count').textContent = `I/S/A/C: ${izinCount}`;

    document.getElementById('table-total-summary').textContent = 
        `Total Kehadiran: ${hadirCount} Hari Kerja | Total Lembur: ${lemburCount} Hari | Izin/Sakit: ${izinCount} Hari`;

    lucide.createIcons();
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById('accordion-icon');
    if (!el) return;
    el.classList.toggle('hidden');
    if (icon) {
        icon.classList.toggle('rotate-180');
    }
}

// -------------------------------------------------------------
// 1-Click Export Timesheet to Excel
// -------------------------------------------------------------
async function triggerExportExcel() {
    const selMonth = document.getElementById('select-timesheet-month');
    const selYear = document.getElementById('select-timesheet-year');
    const month = parseInt(selMonth.value);
    const year = parseInt(selYear.value);

    const headerOverride = {
        employee_name: document.getElementById('ts-header-name').value,
        nip: document.getElementById('ts-header-nip').value,
        department: document.getElementById('ts-header-department').value,
        periode: document.getElementById('ts-header-periode').value,
        position: document.getElementById('ts-header-position').value,
        project_name: document.getElementById('ts-header-project-name').value,
        project_code: document.getElementById('ts-header-project-code').value,
        pm_name: document.getElementById('ts-header-pm').value
    };

    Swal.fire({
        title: 'Menyiapkan Timesheet...',
        text: 'Mengunduh format resmi PT. Bahtera Pesat Lintasbuana',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const res = await fetch('/api/export-timesheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: year,
                month: month,
                profile: headerOverride
            })
        });

        if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.message || 'Gagal export timesheet');
        }

        let filename = `Timesheet_${MONTHS_ID[month - 1]}_${year}_${headerOverride.employee_name || 'Erick'}.xlsx`;
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        Swal.fire({
            icon: 'success',
            title: 'Berhasil Didownload!',
            text: `File ${filename} sudah siap dan tersimpan di folder download Anda.`,
            confirmButtonText: 'Selesai'
        });
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
}

// -------------------------------------------------------------
// Riwayat Absensi Tab
// -------------------------------------------------------------
async function loadHistoryData() {
    try {
        const selMonth = document.getElementById('select-timesheet-month');
        const selYear = document.getElementById('select-timesheet-year');
        const month = selMonth ? parseInt(selMonth.value) : new Date().getMonth() + 1;
        const year = selYear ? parseInt(selYear.value) : new Date().getFullYear();

        const res = await fetch(`/api/attendance/month?year=${year}&month=${month}`);
        const data = await res.json();
        
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const entries = data.days.filter(d => d.clock_in || d.activity || d.overtime_in || ['Izin', 'Sakit', 'Alpa', 'Cuti'].includes(d.status));

        if (entries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-6 text-center text-slate-400">
                        Belum ada catatan absensi untuk periode ${MONTHS_ID[month - 1]} ${year}.
                    </td>
                </tr>
            `;
            return;
        }

        entries.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition';

            const ot = (item.overtime_in || item.overtime_out) ? `${item.overtime_in || '-'} - ${item.overtime_out || '-'}` : '-';

            let badgeClass = 'bg-slate-100 text-slate-700';
            if (item.status === 'Hadir') badgeClass = 'bg-emerald-100 text-emerald-800';
            else if (item.status === 'Izin') badgeClass = 'bg-blue-100 text-blue-800';
            else if (item.status === 'Sakit') badgeClass = 'bg-amber-100 text-amber-800';
            else if (item.status === 'Alpa') badgeClass = 'bg-red-100 text-red-800';
            else if (item.status === 'Cuti') badgeClass = 'bg-purple-100 text-purple-800';

            tr.innerHTML = `
                <td class="p-3 font-semibold text-slate-800">${item.date}</td>
                <td class="p-3 font-mono text-slate-700">${item.clock_in || '-'}</td>
                <td class="p-3 font-mono text-slate-700">${item.clock_out || '-'}</td>
                <td class="p-3 font-mono text-slate-700">${ot}</td>
                <td class="p-3 font-medium text-slate-800 max-w-[280px] truncate" title="${item.activity || ''}">${item.activity || '-'}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${item.status}</span></td>
                <td class="p-3 text-center space-x-1">
                    <button onclick="openManualModal('${item.date}')" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDeleteAttendance('${item.date}')" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        lucide.createIcons();
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

// -------------------------------------------------------------
// Manual Modal
// -------------------------------------------------------------
let selectedManualDate = '';

async function openManualModal(dateStr = '') {
    const modal = document.getElementById('modal-manual');
    const title = document.getElementById('modal-manual-title');
    const deleteBtn = document.getElementById('modal-btn-delete');
    
    selectedManualDate = dateStr || currentDeviceDate;
    document.getElementById('modal-date').value = selectedManualDate;
    
    document.getElementById('modal-status').value = 'Hadir';
    document.getElementById('modal-clock-in').value = currentProfile.standard_clock_in || '08:00';
    document.getElementById('modal-clock-out').value = currentProfile.standard_clock_out || '17:00';
    document.getElementById('modal-ot-in').value = '';
    document.getElementById('modal-ot-out').value = '';
    document.getElementById('modal-activity').value = '';
    
    handleModalStatusChange('Hadir');

    try {
        const res = await fetch(`/api/today?date=${selectedManualDate}`);
        const data = await res.json();
        if (data.record) {
            title.textContent = `Edit Absensi (${selectedManualDate})`;
            deleteBtn.classList.remove('hidden');
            
            document.getElementById('modal-status').value = data.record.status || 'Hadir';
            document.getElementById('modal-clock-in').value = data.record.clock_in || '';
            document.getElementById('modal-clock-out').value = data.record.clock_out || '';
            document.getElementById('modal-ot-in').value = data.record.overtime_in || '';
            document.getElementById('modal-ot-out').value = data.record.overtime_out || '';
            document.getElementById('modal-activity').value = data.record.activity || '';
            handleModalStatusChange(data.record.status || 'Hadir');
        } else {
            title.textContent = `Input Absensi Manual (${selectedManualDate})`;
            deleteBtn.classList.add('hidden');
        }
    } catch (e) {
        title.textContent = `Input Absensi Manual (${selectedManualDate})`;
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeManualModal() {
    document.getElementById('modal-manual').classList.add('hidden');
}

function handleModalStatusChange(status) {
    const timeFields = document.getElementById('modal-time-fields');
    const otFields = document.getElementById('modal-overtime-fields');
    
    if (status === 'Hadir') {
        timeFields.classList.remove('hidden');
        otFields.classList.remove('hidden');
    } else {
        timeFields.classList.add('hidden');
        otFields.classList.add('hidden');
    }
}

async function handleSaveManual(e) {
    e.preventDefault();
    const dateVal = document.getElementById('modal-date').value;
    const statusVal = document.getElementById('modal-status').value;
    const cin = document.getElementById('modal-clock-in').value;
    const cout = document.getElementById('modal-clock-out').value;
    const otIn = document.getElementById('modal-ot-in').value;
    const otOut = document.getElementById('modal-ot-out').value;
    const act = document.getElementById('modal-activity').value.trim();

    const payload = {
        date: dateVal,
        status: statusVal,
        clock_in: statusVal === 'Hadir' ? cin : null,
        clock_out: statusVal === 'Hadir' ? cout : null,
        overtime_in: statusVal === 'Hadir' ? otIn : null,
        overtime_out: statusVal === 'Hadir' ? otOut : null,
        activity: act
    };

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            closeManualModal();
            Swal.fire({
                icon: 'success',
                title: 'Tersimpan!',
                text: 'Data absensi berhasil disimpan.',
                timer: 1500,
                showConfirmButton: false
            });
            
            if (dateVal === currentDeviceDate) {
                loadTodayAttendance();
            }
            loadTimesheetData();
            loadHistoryData();
        } else {
            Swal.fire('Gagal', json.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
}

async function handleDeleteAttendance() {
    const dateVal = document.getElementById('modal-date').value;
    confirmDeleteAttendance(dateVal);
}

function confirmDeleteAttendance(dateStr) {
    Swal.fire({
        title: 'Hapus Catatan?',
        text: `Apakah Anda yakin ingin menghapus catatan absensi tanggal ${dateStr}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/attendance?date=${dateStr}`, { method: 'DELETE' });
                const json = await res.json();
                if (json.success) {
                    closeManualModal();
                    Swal.fire('Terhapus!', 'Catatan telah dihapus.', 'success');
                    if (dateStr === currentDeviceDate) {
                        loadTodayAttendance();
                    }
                    loadTimesheetData();
                    loadHistoryData();
                } else {
                    Swal.fire('Gagal', json.message, 'error');
                }
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    });
}

// -------------------------------------------------------------
// Auto-Fill Modal
// -------------------------------------------------------------
function openQuickFillModal() {
    document.getElementById('modal-quick-fill').classList.remove('hidden');
}

function closeQuickFillModal() {
    document.getElementById('modal-quick-fill').classList.add('hidden');
}

async function handleQuickFillSubmit(e) {
    e.preventDefault();
    const selMonth = document.getElementById('select-timesheet-month');
    const selYear = document.getElementById('select-timesheet-year');
    const month = parseInt(selMonth.value);
    const year = parseInt(selYear.value);

    const payload = {
        year: year,
        month: month,
        clock_in: document.getElementById('qf-clock-in').value,
        clock_out: document.getElementById('qf-clock-out').value,
        activity: document.getElementById('qf-activity').value,
        skip_weekends: document.getElementById('qf-skip-weekends').checked,
        overwrite_existing: document.getElementById('qf-overwrite').checked
    };

    try {
        const res = await fetch('/api/quick-fill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            closeQuickFillModal();
            Swal.fire({
                icon: 'success',
                title: 'Selesai!',
                text: json.message,
                confirmButtonText: 'OK'
            });
            loadTimesheetData();
            loadHistoryData();
        } else {
            Swal.fire('Gagal', json.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    }
}
