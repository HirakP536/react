// utils/attachAudioStream.js
export const attachAudioStream = (audioRef, pc) => {
  if (!audioRef?.current || !pc) return;

  const remoteStream = new MediaStream();

  pc.getReceivers().forEach((receiver) => {
    if (receiver.track && receiver.track.kind === "audio") {
      remoteStream.addTrack(receiver.track);
    }
  });

  pc.ontrack = (event) => {
    if (event.track.kind === "audio") {
      remoteStream.addTrack(event.track);
    }
    audioRef.current.srcObject = remoteStream;
    audioRef.current
      .play()
      .catch((err) => console.warn("Audio play error", err));
  };

  audioRef.current.srcObject = remoteStream;
};
