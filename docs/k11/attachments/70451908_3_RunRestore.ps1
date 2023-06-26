# Parameter that specifies the path of your Kentico web project folder (i.e. the CMS subfolder)
param (
    [Parameter(Mandatory=$true)]
    [string] $Path
)

$beforeList = "Before.txt"
$afterList = "After.txt"
$repositoryPath = "App_data\CIRepository"
$migrationFolder = "@migrations"
$connectionStringName = "CMSConnectionString"

<#
.DESCRIPTION
   Gets connection string from config file
#>
function Get-ConnectionString
{
	param(
		[string] $Path
	)

	$webConfig = [xml](Get-Content $Path\web.config)
	$connectionString = $webConfig.configuration.connectionStrings.add | where {$_.name -eq $connectionStringName}

	return $connectionString.connectionString
}


<#
.DESCRIPTION
   Runs a  migration with the given name
#>
function Run-Migration
{
	param(
		[system.data.SqlClient.SQLConnection] $Connection,
		[System.Data.SqlClient.SqlTransaction] $Transaction,
		[string] $MigrationName
	)

	$migrationPath = "$Path\$repositoryPath\$migrationFolder\$MigrationName.sql"
	if(!(Test-Path $migrationPath))
	{
		Write-Host "The file $migrationPath does not exist."
		return
	}

	$sourceScript = Get-Content $migrationPath

	$sqlCommand = ""
	$sqlList = @()

    foreach($line in $sourceScript)
    {
        if($line -imatch "^\s*GO\s*$")
		{
			$sqlList += $sqlCommand
            $sqlCommand = ""
        }
		else
		{
            $sqlCommand += $line + "`r`n"
        }
    }

	$sqlList += $sqlCommand

	foreach($sql in $sqlList)
    {
		if([bool]$sql.Trim())
		{
			$command = New-Object System.Data.SqlClient.SqlCommand($sql, $Connection)
			$command.transaction = $Transaction

			try
			{
				$returnValue = $command.ExecuteNonQuery()
			}
			catch
			{
				Write-Host $_.Exception.Message
				return $FALSE
			}
		}
	}

	return $TRUE
}


<#
.DESCRIPTION
   Checks if migration with given name was already applied. If not, the method returns false and the migration is marked as applied.
#>
function Check-Migration
{
	param(
		[system.data.SqlClient.SQLConnection] $Connection,
		[System.Data.SqlClient.SqlTransaction] $Transaction,
		[string] $MigrationName
	)

	$sql = "DECLARE @migrate INT
			EXEC @migrate = Proc_CI_CheckMigration '$MigrationName'
			SELECT @migrate"

	$command = New-Object system.data.sqlclient.sqlcommand($sql, $Connection)
	$command.Transaction = $Transaction

	return $command.ExecuteScalar()
}


<#
.DESCRIPTION
   Runs all migrations in given migration list
#>
function Run-MigrationList
{
	param(
		[string] $ConnectionString,
		[string] $MigrationList
	)

	$migrations = Get-Content "$Path\$repositoryPath\$MigrationList"

	$connection = New-Object system.data.SqlClient.SQLConnection($ConnectionString)
	$connection.Open()
	foreach ($migrationName in $migrations)
	{
		$transaction = $connection.BeginTransaction("MigrationTransaction")

		if(Check-Migration -Connection $connection -Transaction $transaction -MigrationName $migrationName)
		{
			Write-Host "Applying migration '$migrationName'."
			if(!(Run-Migration -Connection $Connection -Transaction $transaction -MigrationName $migrationName))
			{
				$transaction.Rollback()
				$connection.Close()
				return $FALSE
			}
		}

		$transaction.Commit()
	}

	$connection.Close()

	return $TRUE
}


<#
.DESCRIPTION
   Restores the CI repository to the DB and executes migrations before and after the restore.
#>
function Run-Restore
{
	param(
		[string] $Path
	)

	$connectionString = Get-ConnectionString -Path $Path
	if(![bool]$connectionString)
	{
		Write-Host "Connection string not found."
		return
	}

	# Create an 'App_Offline.htm' file to stop the website
	"<html><head></head><body>Continuous integration restore in progress...</body></html>" > "$Path\App_Offline.htm"

	# Execute scripts before the CI restore
	if(!(Run-MigrationList $connectionString $beforeList))
	{
		Write-Host "Executing migrations before CI restore failed."
		return
	}

	# Runs the continuous integration restore utility
	& "$Path\bin\ContinuousIntegration.exe" -r -s

	# Execute scripts after the CI restore
	if(!(Run-MigrationList $connectionString $afterList))
	{
		Write-Host "Executing migrations after CI restore failed."
		return
	}

	# Removes the 'App_Offline.htm' file to bring the site back online
	Remove-Item "$Path\App_Offline.htm"
	
	Write-Host "Done"
}

Run-Restore -Path $Path
