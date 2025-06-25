/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Registerer, UserAgent } from "sip.js";
import { clearSIP, setRegistered } from "../store/slices/sipSlice";
import useSipAgentRef from "./useSipAgentRef";
import useSipSession from "./useSipSession";
import { addSession } from "../store/slices/callFeatureSlice";
import { SipSessionRegistry } from "../helpers/sipSessionRegistry";

const useSip = () => {
  const userName = useSelector((state) => state.auth?.companyExtension);
  const password = useSelector((state) => state.auth?.user?.data?.state);
  const sipDomain = useSelector((state) => state.auth?.user?.data?.timeZone);
  const dispatch = useDispatch();
  const { userAgentRef } = useSipAgentRef();
  const registererRef = useRef(null);
  const keepAliveInterval = useRef(null);
  const { handleIncomingSession } = useSipSession();
  const isDNDActive = useSelector((state) => state.callFeature.isDNDActive);

  useEffect(() => {
    const userAgent = new UserAgent({
      uri: UserAgent.makeURI(`sip:${userName}@${sipDomain}`),
      transportOptions: {
        server: `wss://${sipDomain}:8089/ws`,
      },
      authorizationUsername: userName,
      authorizationPassword: password,
       logLevel: "error",
    });

    userAgentRef.current = userAgent;
    userAgent.delegate = {
      onInvite: async (incomingSession) => {
        if (isDNDActive) {
          try {
            await incomingSession?.reject({
              statusCode: 486,
              reasonPhrase: "Busy Here",
            });
          } catch (error) {
            console.error("Failed to reject call during DND:", error);
          }
          return;
        }
        SipSessionRegistry.set(incomingSession.id, incomingSession);
        await handleIncomingSession(incomingSession);
        dispatch(
          addSession({
            id: incomingSession.id,
            data: {
              direction: "incoming",
              phone: incomingSession.remoteIdentity.uri.user,
              session: incomingSession,
              startedAt: new Date().toISOString(),
            },
          })
        );
      },
    };

    userAgent
      .start()
      .then(() => {
        const registerer = new Registerer(userAgent);
        registererRef.current = registerer;
        return registerer.register();
      })
      .then(() => {
        dispatch(setRegistered(true));

        keepAliveInterval.current = setInterval(() => {
          if (userAgentRef.current?.transport?.isConnected()) {
            userAgentRef.current.transport.send("");
          }
        }, 25000);
      })
      .catch((err) => console.error("❌ SIP setup failed:", err));

    return () => {
      clearInterval(keepAliveInterval.current);
      registererRef.current?.unregister();
      userAgentRef.current?.stop();
      dispatch(clearSIP());
      dispatch(setRegistered(false));
    };
  }, [userName, password, sipDomain]);

  return useSipAgentRef;
};

export default useSip;
