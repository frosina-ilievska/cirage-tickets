@echo off
echo.
echo ======================================
echo  Cirage Paris Tickets — Setup
echo ======================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 goto error

echo.
echo [2/4] Generating Prisma client...
call npx prisma generate
if errorlevel 1 goto error

echo.
echo [3/4] Creating database...
call npx prisma db push
if errorlevel 1 goto error

echo.
echo [4/4] Seeding demo data...
call npx tsx prisma/seed.ts
if errorlevel 1 goto error

echo.
echo ======================================
echo  Setup complete!
echo ======================================
echo.
echo  Demo accounts:
echo    Admin:    admin@cirageparis.com  / Admin123!
echo    Designer: marie@cirageparis.com  / Designer123!
echo    Designer: sophie@cirageparis.com / Designer123!
echo    Member:   team@cirageparis.com   / Member123!
echo.
echo  Starting the app...
echo  Open http://localhost:3000 in your browser
echo.
call npm run dev
goto end

:error
echo.
echo !! Something went wrong. Check the error above.
pause

:end
