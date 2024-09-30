const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.AWS_BUCKET_NAME;

async function awsAccess() {
  const params = { Bucket: bucketName };
  const command = new ListObjectsV2Command(params);

  try {
    const data = await s3Client.send(command);
  } catch (err) {
    console.log("Error", err);
  }
}

module.exports = { awsAccess };

