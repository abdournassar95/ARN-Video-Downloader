; ==============================================================================
; Inno Setup Script for ARN Video Downloader
; Developer: Abdou Ragab Nassar (عبده رجب نصار)
; Company: ARN Technology
; ==============================================================================

#define MyAppName "ARN Video Downloader"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "ARN Technology (عبده رجب نصار)"
#define MyAppURL "https://wa.me/201556710314"
#define MyAppExeName "ARN Video Downloader.exe"
#define MyAppIcon "resources\icon.ico"
#define BuildDir "dist\win-unpacked"
#define OutputDir "dist\setup"

[Setup]
AppId={{E5817E1A-D74A-4CB3-9366-D0C0877DF19A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=ARN_Video_Downloader_v{#MyAppVersion}_Setup
OutputDir={#OutputDir}
SetupIconFile={#MyAppIcon}
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
LZMANumBlockThreads=6
InternalCompressLevel=max
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#BuildDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "cert\ARN_Technology_Root.cer"; DestDir: "{app}\cert"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; توثيق شهادة أمان ARN Technology في مخزن Root لمنع أي تحذيرات أمان
Filename: "certutil.exe"; Parameters: "-addstore -f ""Root"" ""{app}\cert\ARN_Technology_Root.cer"""; StatusMsg: "جاري توثيق شهادة أمان ARN Technology..."; Flags: runhidden waituntilterminated
; توثيق الناشر في قائمة الناشرين الموثوقين
Filename: "certutil.exe"; Parameters: "-addstore -f ""TrustedPublisher"" ""{app}\cert\ARN_Technology_Root.cer"""; StatusMsg: "جاري توثيق ناشر التطبيق في قائمة الناشرين الموثوقين..."; Flags: runhidden waituntilterminated
; تشغيل التطبيق بعد انتهاء التثبيت
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent
