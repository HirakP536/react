export const setHoldState = async (session, hold) => {
  if (!session || !session.sessionDescriptionHandler) {
    throw new Error("Session or SDP handler not available");
  }

  const options = {
    requestDelegate: {
      onReject: (res) => {
        console.warn("Re-INVITE rejected", res.message.reasonPhrase);
      },
    },
    sessionDescriptionHandlerOptions: {
      hold,
    },
  };

  try {
    await session.invite(options); // re-INVITE to update hold state
    console.log(`🎯 Session ${hold ? "held" : "unheld"} successfully`);
  } catch (err) {
    console.error(`❌ Failed to ${hold ? "hold" : "unhold"} session`, err);
    throw err;
  }
};
