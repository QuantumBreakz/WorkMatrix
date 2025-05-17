$files = Get-ChildItem -Path "Front-End" -Recurse -Include "*.tsx","*.ts"
foreach ($file in $files) {
    (Get-Content $file.FullName) | 
    ForEach-Object {
        $_ -replace '@/hooks/useAuth', '@/hooks'
    } | 
    Set-Content $file.FullName
} 