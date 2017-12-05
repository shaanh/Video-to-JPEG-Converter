var express = require('express'),
    app = express(),
    fs = require('fs'),
    exec = require('child_process').exec,
    path = require('path');
var uuid = require('node-uuid');
ffmpeg = require('ffmpeg');


var server = app.listen(5000, function(){
        console.log('This server is running on the port ' + this.address().port);
    }
);

var io = require('socket.io').listen(server);

var Files = [];

app.use(express.static(__dirname));


io.sockets.on('connection', function (socket) {

    socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
        var Name = data['Name'];
        //.replace(/ /g , " ");
        Files[Name] = {  //Create a new Entry in The Files Variable
            FileSize: data['Size'],
            Data: "",              //buffer
            Downloaded: 0
        };

        var Place = 0;
        try {
            var stat = fs.statSync('Temp/' + Name);
            if (stat.isFile()) {
                Files[Name]['Downloaded'] = stat.size;
                Place = stat.size / 524288;
            }
        }
        catch (er) {
        }
        //noinspection JSAnnotator
        fs.open("Temp/" + Name, "a", 0755, function (err, fd) {
            if (err) {
                console.log(err);
            }
            else {
                Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', {'Place': Place, Percent: 0});
            }
        });
    });

    socket.on('Upload', function (data) {
        //noinspection JSDuplicatedDeclaration
        var Name = data['Name'];
        //.replace(/ /g , " ");
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if (Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, Written) {
                var filename = uuid();
                var reads = fs.createReadStream("Temp/" + Name);
                Name += filename;
                var writes = fs.createWriteStream("Video/" + Name);
                reads.pipe(writes);


                reads.on('end', function () {
                    //Operation done
                    fs.unlink("Temp/" + Name, function () {
                        exec("ffmpeg -i \"" + __dirname + "/Video/" + Name + "\" -ss 00:00:10.00 -r 1 -an -vframes 1 -f mjpeg \"" + __dirname + "/Video/" + Name + "1.jpg\"",
                            socket.emit('Done', {'Image1': 'Video/' + Name + '1.jpg'}));
                        exec("ffmpeg -i \"" + __dirname + "/Video/" + Name + "\" -ss 00:00:20.00 -r 1 -an -vframes 1 -f mjpeg \"" + __dirname + "/Video/" + Name + "2.jpg\"",
                            socket.emit('Done', {'Image2': 'Video/' + Name + '2.jpg'}));
                        exec("ffmpeg -i \"" + __dirname + "/Video/" + Name + "\" -ss 00:00:30.00 -r 1 -an -vframes 1 -f mjpeg \"" + __dirname + "/Video/" + Name + "3.jpg\"",
                            socket.emit('Done', {'Image3': 'Video/' + Name + '3.jpg'}));
                        exec("ffmpeg -i \"" + __dirname + "/Video/" + Name + "\" -ss 00:00:40.00 -r 1 -an -vframes 1 -f mjpeg \"" + __dirname + "/Video/" + Name + "4.jpg\"",
                            socket.emit('Done', {'Image4': 'Video/' + Name + '4.jpg'}));
                        exec("ffmpeg -i \"" + __dirname + "/Video/" + Name + "\" -ss 00:00:50.00 -r 1 -an -vframes 1 -f mjpeg \"" + __dirname + "/Video/" + Name + "5.jpg\"",
                            socket.emit('Done', {'Image5': 'Video/' + Name + '5.jpg'}));
                    })
                });
            });
        }
        else
        if (Files[Name]['Data'].length > 10485760) { //If the Data Buffer reaches 10MB
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function (err, writen) {
                Files[Name]['Data'] = ""; //Reset The Buffer
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('MoreData', {'Place': Place, 'Percent': Percent});
            });
        }
        else {
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('MoreData', {'Place': Place, 'Percent': Percent});
        }
    });
});


/*
 var process =  new ffmpeg(__dirname + '/Video/' + Name);
 process.then(function (video) {
 // Callback mode
 video.fnExtractFrameToJPG(__dirname + '/Temp/' + Name, {
 frame_rate : 1,
 number : 5,
 file_name : 'my_frame_%t_%s'

 }, function (error, files) {
 if (!error)
 console.log('Frames: ' + files);
 socket.emit('Done', {'Image1': 'Video/' + Name + '.jpg'});
 console.log(error);
 });

 }, function (err) {
 console.log('Error: ' + err);
 });
 */