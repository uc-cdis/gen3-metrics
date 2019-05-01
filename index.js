var aws = require("aws-sdk");
var nodemailer = require("nodemailer");
var err = require("err");


var ses = new aws.SES();
var s3 = new aws.S3({httpOptions: {timeout: 5000}});


function getS3File(bucket, key) {
    return new Promise(function (resolve, reject) {
        s3.getObject(
            {
                Bucket: bucket,
                Key: key
            },
            function (err, data) {
                if (err) return reject(err);
                else return resolve(data);
            }
        );
    });
}

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    // Get the object from the event and show its content type
    //prefix has been filtered in s3 event setup
    var bucket = event.Records[0].s3.bucket.name;
    var key = event.Records[0].s3.object.key;

    getS3File(bucket, key)
        .then(function (fileData) {
            var mailOptions = {
                from: "diw@uchicago.edu",
                subject: "Monthly Report from GEN3",
                html: `<p>You got a report from GEN3 </p>`,
                to: "diw@uchicago.edu",
                attachments: [
                    {
                        filename: "gen3kfreport.csv",
                        content: fileData.Body
                    }
                ]

            };

            // create Nodemailer SES transporter
            var transporter = nodemailer.createTransport({
                SES: ses
            });

            // send email
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log("Error sending email");
                    callback(err);
                } else {
                    console.log("Email sent successfully");
                    callback();
                }
            });
        })
        .catch(function (error) {
            console.log(error);
            console.log('Error getting attachment from S3');
            callback(err);
        });
};
