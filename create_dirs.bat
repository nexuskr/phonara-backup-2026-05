@echo off
REM Create directory structure
mkdir src\types\domain
mkdir src\types\api
mkdir src\services\__tests__
mkdir src\hooks

REM Verify the structure
echo.
echo Directory structure created:
echo.
tree src /F

echo.
echo All directories created successfully!
