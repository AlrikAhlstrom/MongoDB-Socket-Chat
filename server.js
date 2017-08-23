const mongoClient = require('mongodb').MongoClient;
const ioClient = require('socket.io').listen(4000).sockets;

//Connect to mongo

mongoClient.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
    if(err) {
        throw err;
    }

    console.log('MongoDB connected...')

    // connect to socket.io
    ioClient.on('connection', function(socket) {
        let chat = db.collection('chats');

        // create function to send status

        sendStatus = function(s) {
            socket.emit('status', s);
        };

        // get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
            if(err) {
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data) {
            let name = data.name;
            let message = data.message;

            if(name == '' || message == '') {
                sendStatus('Please enter a name and a message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function() {
                    ioClient.emit('output', [data]);

                    // send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })
                } )
            }
        });

        // handle clear
        socket.on('clear', function(data){
            // remove all chats from the collection
            chat.remove({}, function(){
                //emit cleared
                socket.emit('cleared');
            })
        })
    
    })


});