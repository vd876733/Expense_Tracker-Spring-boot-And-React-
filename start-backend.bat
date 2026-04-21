@echo off
setlocal

rem Set JAVA_HOME for this session only
set "JAVA_HOME=C:\Program Files\Java\jdk-25.0.2"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0"
call mvnw spring-boot:run

endlocal
