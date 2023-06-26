# Parameter that specifies the path of your Kentico web project folder (i.e. the CMS subfolder)
param (
    [Parameter(Mandatory=$true)]
    [string]$Path
)

# Stops any external Kentico services registered for the instance
$services = @(Get-WmiObject win32_service `
    | ?{ $_.Name -Like "KenticoCMS*" -And $_.State -Eq "Running" -And $_.PathName -like '*'+ $Path +'"' } `
    | % {
        Stop-Service $_.Name
        return $_.Name
    })

# Creates an 'App_Offline.htm' file to stop the website
if (!(Test-Path "$Path\App_Offline.htm"))
{
    "<html><head></head><body>Continuous integration restore in progress...</body></html>" > "$Path\App_Offline.htm"
    $bringApplicationOnline = $true
}

# Runs the continuous integration restore utility
& "$Path\bin\ContinuousIntegration.exe" -r

# Removes the 'App_Offline.htm' file to bring the site back online
if ($bringApplicationOnline)
{
    Remove-Item "$Path\App_Offline.htm"
}

# Restarts the instance's external services
$services | % { Start-Service $_ }

Clear-Variable Path, services, bringApplicationOnline
