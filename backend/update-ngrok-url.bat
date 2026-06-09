@echo off
:: Lấy URL ngrok và cập nhật vào .env (cần curl, có sẵn trên Windows 10+)

for /f "tokens=*" %%a in ('curl -s http://localhost:4040/api/tunnels ^| findstr /o "public_url.*https"') do set RAW=%%a

:: Trích xuất URL từ JSON đơn giản
for /f "tokens=2 delims=:" %%b in ("%RAW%") do set URL=https:%%b
for /f "tokens=1 delims=^"" %%c in ("%URL:~0,-1%") do set NGROK_URL=%%c

if "%NGROK_URL%"=="" (
    echo Khong tim thay ngrok. Hay chay "ngrok http 5000" truoc.
    exit /b 1
)

:: Xóa dòng cũ và thêm dòng mới vào .env
findstr /v "BACKEND_URL" .env > .env.tmp
echo BACKEND_URL=%NGROK_URL% >> .env.tmp
move /y .env.tmp .env > nul

echo Da cap nhat BACKEND_URL=%NGROK_URL%
echo Hay restart backend: npm run dev
