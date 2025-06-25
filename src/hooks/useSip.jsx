/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Registerer, UserAgent } from "sip.js";
import {
    clearSIP,
    setRegistered
} from "../store/slices/sipSlice";
import useSipAgentRef from "./useSipAgentRef";
import useSipSession from "./useSipSession";

const useSip = () => {
  const userName = useSelector((state) => state.auth?.user?.data?.city);
  const password = useSelector((state) => state.auth?.user?.data?.state);
  const sipDomain = useSelector((state) => state.auth?.user?.data?.timeZone);
  const dispatch = useDispatch();
  const { userAgentRef } = useSipAgentRef(); 
  const registererRef = useRef(null);
  const keepAliveInterval = useRef(null);
  const {handleIncomingSession} = useSipSession();

  useEffect(() => {
    const userAgent = new UserAgent({
      uri: UserAgent.makeURI(`sip:${userName}@${sipDomain}`),
      transportOptions: {
        server: `wss://${sipDomain}:8089/ws`,
      },
      authorizationUsername: userName,
      authorizationPassword: password,
    });

    userAgentRef.current = userAgent;

    userAgent.delegate = {
      onInvite: (incomingSession) => {
        handleIncomingSession(incomingSession);
        console.warn("incomingSession=================>",incomingSession)
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
};

export default useSip;
