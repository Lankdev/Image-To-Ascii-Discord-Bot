const discord = require('discord.js');
const bot = new discord.Client();
const { token, prefix, logchannelid } = require('./config.json');
const asciify = require('asciify-image');
const textToImage = require('text-to-image');
const imageDataURI = require('image-data-uri');
const express = require('express')
const fs = require('fs');
const app = express();
const httpport = 3000;
const download = require('image-downloader');
const sizeOf = require('image-size');
const Jimp = require('jimp');
let msg;

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
    bot.channels.cache.get(logchannelid).send(`There was an error processing an image. Error: ${err}`)
});

//http server
app.use('/', express.static(__dirname + '/public'));

/**app.get('/',function(req,res) {
    res.sendFile('index.html');
});*/

app.listen(httpport, () => {
  console.log(`HTTP Server running on http://localhost:${httpport}`)
});


// Discord bot server
var options = {
  fit: 'original',
  color: false,
  c_ratio: 2
}


bot.on('message', async message=>{
    if(message.content.startsWith(`${prefix}ascii`)){
        try {
            if (!message.attachments.size > 0) return message.channel.send('You must attach an image to your command.')
            var attatchment = (message.attachments).array();
            if (!message.attachments.every(attachIsImage) && !message.attachments.every(attachIsImage2) && !message.attachments.every(attachIsImage3) && !message.attachments.every(attachIsImage4)) return message.channel.send('The attachment must be a png, jpg, or jpeg image.')
            var imageurl = attatchment[0].url;
            var ranNum = Math.floor((Math.random() * 1000000000) + 1);
            var msg = await message.channel.send('Generating...')

            download.image({
                url: imageurl,
                dest: `./Images/${ranNum}.png`,
                extractFilename: false
            })
            .catch((err) => console.error(err))
            .then(() =>{
                const dimensions = sizeOf(`Images/${ranNum}.png`);

                var texttoimageoptions = {
                    fontFamily: 'monospace',
                    textColor: '#FFFFFF',
                    bgColor: '#000000',
                    fontSize: '18',
                    maxWidth: dimensions.width * 22,
                }
                asciify(imageurl, options, function (err, asciified) {
                    if (err) return message.channel.send(`There was an error when asciifying your image: ${err}`)
                    textToImage.generate(asciified, texttoimageoptions).then(function (dataUri) {
                        let filePath = `./Output/asciiimage-${ranNum}`;
                        fs.writeFile(`./public/database/${ranNum}.html`, `<!DOCTYPE html>\n<html>\n<head>\n<link href="style.css" rel="stylesheet" type="text/css"/>\n</head>\n<body>\n<p>${asciified.replace(/\n/g, "<br>")}</p>\n</body>\n</html>`, async function (err) {
                            if (err) return message.channel.send(`There was an error when creating your paste page: ${err}`)
                            imageDataURI.outputFile(dataUri, filePath)
                                .then(res => {
                                    Jimp.read(`./Output/asciiimage-${ranNum}.png`, (err, lenna) => {
                                        if (err) return message.channel.send(`There was an error when resizing the image: ${err}`)
                                        lenna
                                        .resize(dimensions.width, dimensions.height)
                                        .write(`./Output/finished-${ranNum}.png`);
                                    });
                                    msg.edit(`Your image has been asciified! A preview will be sent when it is finished generating! You can copy it here: http://199.250.177.238:3000/database/${ranNum}.html`);
                                });
                                var n = 0;
                            doWhenExist();
                            function doWhenExist(){
                                if(checkIfExists(`./Output/finished-${ranNum}.png`)){
                                    message.channel.send({files: [`./Output/finished-${ranNum}.png`]});
                                    
                                    setTimeout(function(){
                                        fs.unlink(`./Output/finished-${ranNum}.png`, function (err) {
                                            if(err) return console.log(`Error when deleting "./Output/finished-${ranNum}.png"`);
                                        });
                                        fs.unlink(`./Output/asciiimage-${ranNum}.png`, function (err) {
                                            if(err) return console.log(`Error when deleting "./Output/asciiimage-${ranNum}.png"`);
                                        });
                                        fs.unlink(`./Images/${ranNum}.png`, function (err) {
                                            if(err) return console.log(`Error when deleting "./Images/${ranNum}.png"`);
                                        });
                                    }, 10000);
                                } else {
                                    repeatUntilExists();
                                };
                                n++
                                console.log(`Cycle ${n}`)
                            };
                            function repeatUntilExists(){
                                setTimeout(function(){ doWhenExist() }, 400);
                            };
                        });
                    });
                });
            });
        }catch(err) {
          message.channel.send(`There was an error: ${err}`);
        };
    };
});


//Functions
function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1;
};
function attachIsImage2(msgAttach) {
    var url = msgAttach.url;
    return url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1;
};
function attachIsImage3(msgAttach) {
    var url = msgAttach.url;
    return url.indexOf("jpeg", url.length - "jpeg".length /*or 3*/) !== -1;
};
function attachIsImage4(msgAttach) {
    var url = msgAttach.url;
    return url.indexOf("gif", url.length - "gif".length /*or 3*/) !== -1;
};
function checkIfExists(file){
    try {
        if (fs.existsSync(file)) {
            return true;
        } else {
            return false;
        };
      } catch(err) {
        console.error(err)
      };
};

bot.login(token);