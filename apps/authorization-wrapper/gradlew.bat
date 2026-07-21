@ECHO OFF
WHERE gradle >NUL 2>NUL
IF %ERRORLEVEL% EQU 0 (
  gradle %*
  EXIT /B %ERRORLEVEL%
)
ECHO Gradle is not installed and the wrapper JAR is not checked into this generated archive.
ECHO Install Gradle 8.14+ once, then run: gradle wrapper --gradle-version 8.14.3
EXIT /B 1
