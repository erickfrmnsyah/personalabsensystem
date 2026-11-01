@echo off
title Absensi & Timesheet BPL
cd /d "%~dp0"

echo ========================================================
echo        MEMULAI APLIKASI ABSENSI & TIMESHEET BPL
echo ========================================================
echo.
echo Memeriksa dependensi Python...
pip install -r requirements.txt --quiet

echo.
echo Membuka aplikasi di browser...
start http://localhost:5000

echo Menjalankan server lokal di http://localhost:5000 ...
echo (Tekan Ctrl+C di jendela ini jika ingin mematikan server)
echo.
python app.py
pause
