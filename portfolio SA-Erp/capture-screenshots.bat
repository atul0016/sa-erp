@echo off
echo ===================================
echo  SA ERP Screenshot Capture Script
echo ===================================
echo.
echo This script opens the live demo in your browser.
echo After it opens, take screenshots of these pages and save them to the screenshots/ folder:
echo.
echo  1. Dashboard (after login)
echo  2. Sales ^> Invoices
echo  3. Sales ^> POS Terminal
echo  4. Manufacturing ^> Shop Floor Kiosk
echo  5. Manufacturing ^> OEE Dashboard
echo  6. GST ^> E-Invoice
echo  7. HRM ^> Payroll
echo  8. Finance ^> Bank Reconciliation
echo  9. Reports ^> Financial Reports
echo 10. Settings
echo.
echo Naming convention:
echo   screenshots/01-dashboard.png
echo   screenshots/02-sales-invoice.png
echo   screenshots/03-pos-terminal.png
echo   ... etc.
echo.

if not exist "screenshots" mkdir screenshots

echo Opening live demo...
start https://indian-erp.vercel.app

echo.
echo Screenshots folder created at: %~dp0screenshots\
echo Save your screenshots there.
pause
