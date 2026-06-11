@echo off
echo =====================================================
echo  Adding team users + Email/NL category
echo  Stop the app first if it's running (Ctrl+C the
echo  terminal that shows the dev server), then run this.
echo  You can restart the app after.
echo =====================================================
echo.
npx tsx prisma/add-users.ts
echo.
pause
