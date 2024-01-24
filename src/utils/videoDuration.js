import ffmpeg from 'fluent-ffmpeg';

const getVideoDuration = async (fileObject) => {
  const videoPath = fileObject.path;

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const durationInSeconds = metadata.format.duration;
        resolve(durationInSeconds);
      }
    });
  });
};

export  {getVideoDuration}
