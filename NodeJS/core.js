var Lcd = require('lcd');
var lcd = new Lcd({ rs: 25, e: 24, data: [23, 17, 27, 22], cols: 20, rows: 4 });
var displayString = "";
var temp;
var now = new Date();
var dateString;
var pastTime;
var database;
var fs = require('fs');
var importFileName = "../usbdrv/database.csv";
var databaseLocation = "database.csv";
//Converter Class
var Converter = require("csvtojson").core.Converter;
//new converter instance
var csvConverter = new Converter();
//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed", function (jsonObj) {
    database = jsonObj;
    //console.log(JSON.stringify(database));
});
function importDatabase() {
    fs.exists(importFileName, function (exists) {
        if (exists) {
            //fs.createReadStream(fileName).pipe(csvConverter);
            fs.createReadStream(importFileName).pipe(fs.createWriteStream('database.csv'));
            displayString = "Database imported!   Remove USB + reboot!";
            print();
            setTimeout(function () {
                process.exit(code = 0); //Exits node js app
            }, 1000);
        }
    });
}
function readDatabase() {
    fs.exists(databaseLocation, function (exists) {
        if (exists) {
            fs.createReadStream(databaseLocation).pipe(csvConverter);
        }
    });
}
function print() {
    now = new Date();
    dateString = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + " " + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
    if (displayString != temp || dateString != pastTime) {
        lcd.clear();
        lcd.once('clear', function () {
            lcd.setCursor(0, 0);                                    // col 0, row 0
            lcd.print(displayString);                               // print time
            lcd.once('printed', function () {
                lcd.setCursor(0, 3);                                // col 0, row 1
                lcd.print(dateString);
                lcd.once('printed', function () {
                    setTimeout(function () {
                        print();
                        temp = displayString;
                        pastTime = dateString;
                    }, 500);
                });
            });
        });
    }
    else {
        setTimeout(function () {
            print();
        }, 500);
    }
}
lcd.on('ready', function () {
    importDatabase();
    readDatabase();
    print();
    //#region card input
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var recursiveAsyncReadLine = function () {
        displayString = "Swipe card:";
        rl.question('Swipe card: ', function (answer) {
            if (answer == 'exit') { //we need some base case, for recursion
                return rl.close(); //closing RL and returning from function.
            }
            answer = answer.replace(';', '').replace('?', '');
            if (answer == 'E') {
                console.log("Card misread.");
                displayString = "Card misread. =(    Please try again."; //Spaces for formatting
                setTimeout(function () {
                    recursiveAsyncReadLine(); //Calling this function again to ask new question
                }, 2000);
            }
            else if (answer.length == 29) {
                answer = answer.substring(6, 15);
                console.log('Id number: ' + answer);
                var printed = false;
                for (var index = 0; index < database.length; index++) {
                    var student = database[index];
                    var dateParts = student.date.split("/");
                    var certDate = new Date(parseInt(dateParts[2]) + 1, parseInt(dateParts[0]) - 1, parseInt(dateParts[1]), 0, 0, 0, 0); //Date untill the certification is valid plus one year
                    console.log("Certification expires on: " + certDate);
                    if (answer == student.id && !printed && certDate >= new Date()) {
                        printed = true;
                        var name = student.firstName + " " + student.lastName;
                        if (name.length >= 13) {
                            name.substring(0, 13) + '-';
                        }
                        displayString = "Id number: " + student.id + "Printing...";
                        now = new Date();
                        dateString = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear() + " " + now.getHours() + ":" + now.getMinutes();
                        var PythonShell = require('python-shell');
                        var options = {
                            mode: 'text',
                            //Set python script location
                            scriptPath: './Python',
                            args: [name, student.level, dateString]
                        };
                        PythonShell.run('print.py', options, function (err) {
                            if (err) throw err;
                            setTimeout(function () { //Pause for 3 sec to wait for print job to fire
                                displayString = "Done. Pull down to tear label.";
                                setTimeout(function () {
                                    recursiveAsyncReadLine(); //Calling this function again to ask new question
                                }, 3000);
                            }, 3000);
                        });
                    }
                }
                if (!printed) {
                    setTimeout(function () { //Pause for 3 sec to wait for print job to fire
                        displayString = "Error: Not certified";
                        setTimeout(function () {
                            recursiveAsyncReadLine(); //Calling this function again to ask new question
                        }, 3000);
                    }, 3000);
                }
            }
            else {
                console.log("Error");
                setTimeout(function () {
                    recursiveAsyncReadLine(); //Calling this function again to ask new question
                }, 3000);
            }
        });
    };
    recursiveAsyncReadLine();
});
// If ctrl+c is hit, free resources and exit.
process.on('SIGINT', function () {
    lcd.close();
    process.exit();
});