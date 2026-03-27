@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo       BetterMao IM - 启动脚本
set "NODE_VERSION_REQUIRED=16.0.0"

:: 检查Node.js版本
echo [1/5] 检查Node.js版本...
node -v > node_version.txt 2>&1
set /p NODE_VERSION=<node_version.txt
del node_version.txt

:: 提取版本号数字部分
for /f "tokens=2 delims=v" %%i in ("%NODE_VERSION%") do set NODE_VERSION=%%i

:: 比较版本
set "NODE_VERSION_MAJOR=%NODE_VERSION:~0,2%"
if "!NODE_VERSION_MAJOR!" LSS "16" (
    echo 错误: Node.js版本过低，需要16.0.0或更高版本
    echo 当前版本: %NODE_VERSION%
    pause
    exit /b 1
)

echo Node.js版本检查通过: %NODE_VERSION%

:: 加载环境变量
if exist .env (
    echo [2/5] 加载环境变量...
    for /f "tokens=1* delims==" %%i in (.env) do (
        if not "%%i"=="" set "%%i=%%j"
    )
) else (
    echo [2/5] 未找到.env文件，使用默认配置...
)

:: 设置默认值
if "%PORT%"=="" set PORT=3000
if "%NODE_ENV%"=="" set NODE_ENV=development

echo [3/5] 启动配置:
set "LOG_FILE=logs\startup.log"
mkdir logs 2>nul
echo 端口: %PORT% > "%LOG_FILE%"
echo 环境: %NODE_ENV% >> "%LOG_FILE%"
echo 启动时间: %DATE% %TIME% >> "%LOG_FILE%"

echo [4/5] 启动后端服务...
echo 启动后端服务，端口: %PORT%，环境: %NODE_ENV%
echo 详细日志请查看: %LOG_FILE%

:: 启动后端服务
start "BetterMao Backend" cmd /k "node app.js > "%LOG_FILE%" 2>&1"

:: 等待后端启动
echo 等待后端服务初始化 (3秒)...
timeout /t 3 >nul

:: 启动前端服务
echo [5/5] 启动前端服务...
start "BetterMao Frontend" cmd /k "cd ui && npm run dev"

:: 等待前端启动
echo 等待前端服务初始化 (5秒)...
timeout /t 5 >nul

:: 打开浏览器
echo 打开浏览器访问应用...
start http://localhost:5173

echo ==========================================
echo       系统启动完成！
echo ==========================================
echo 服务已启动:
echo - 后端服务: http://localhost:%PORT%
echo - 前端服务: http://localhost:5173
echo 
echo 提示:
echo 1. 请保持启动的终端窗口打开
echo 2. 详细日志请查看: %LOG_FILE%
echo 3. 按任意键关闭此窗口...
pause
endlocal