Add a file env.json and add the variables you wish to add with a KEY:VALUE pattern
e.g.
{
    "MYVAR": "myvalue",
    "MYSECONDVAR": "mySecondValue"
}

Add a file.cmd-env.json with a KEY:COMMAND pattern to execute any command and store the result into a variable
e.g. 
{
    "HOSTNAME": "hostname" //command to retrieve hostname
}