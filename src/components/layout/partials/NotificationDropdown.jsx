/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getReadMessages } from "../../../api/chatApi";
import bellIcon from "../../../assets/layout/bell.svg";
import { getSocket } from "../../../hooks/useChatWebSocket";
import { fetchChatList } from "../../../store/slices/chatListSlice";
import { convertCSTToLocalTime, formatUSPhone } from "../../../utils/common";

const NotificationDropdown = ({
  voicemailData,
  totalUnread,
  showVoicemailDropdown,
  setShowVoicemailDropdown,
  voicemailDropdownRef,
}) => {
  const [activeTab, setActiveTab] = useState("voicemail");
  const [previousVoicemailCount, setPreviousVoicemailCount] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userDid = useSelector(
    (state) => state.auth.user?.data?.extension[0]?.username
  );

  // Check for new voicemails
  useEffect(() => {
    const currentCount = voicemailData?.unplayedCount || 0;
    if (
      currentCount > previousVoicemailCount &&
      voicemailData?.unplayedVoicemails
    ) {
      const latestVoicemail = Object.values(
        voicemailData.unplayedVoicemails
      )[0];
      if (latestVoicemail) {
        const callerIdMatch =
          latestVoicemail.CallerID.match(/"([^"]+)"\s*<(\d+)>/);
        const callerName = callerIdMatch ? callerIdMatch[1] : "Unknown";
        const callerNumber = callerIdMatch ? callerIdMatch[2] : "Unknown";

        toast.info(
          <div>
            <h5 className="text-sm !text-white">
              New Voicemail from: {callerName}
            </h5>
            <p className="text-sm !text-white">{formatUSPhone(callerNumber)}</p>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
            style: {
              background: "#67308F",
              color: "#ffffff",
              borderRadius: "8px",
            },
            progressStyle: {
              background: "rgba(255,255,255,0.7)",
            },
            icon: "📞",
          }
        );
      }
    }
    setPreviousVoicemailCount(currentCount);
  }, [voicemailData?.unplayedCount, voicemailData?.unplayedVoicemails]);

  // Socket connection and message handling
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle only chat notifications here
        if (data && typeof data === "object" && !data.messagestatus) {
          if (data.sender !== userDid) {
            const truncatedMessage =
              data.message?.length > 30
                ? `${data.message.substring(0, 30)}...`
                : data.message;
            toast.info(
              <div>
                <h5 className="text-sm !text-white">
                  New Message from: {formatUSPhone(data?.sender)}
                </h5>
                <p className="text-sm !text-white">
                  Message: {truncatedMessage}
                </p>
              </div>,
              {
                position: "top-right",
                autoClose: 3000,
                style: {
                  background: "#67308F",
                  color: "#ffffff",
                  borderRadius: "8px",
                },
                progressStyle: {
                  background: "rgba(255,255,255,0.7)",
                },
                icon: "🔔",
              }
            );
            dispatch(fetchChatList({}));
          }
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };

    socket.addEventListener("message", handleSocketMessage);
    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [dispatch, navigate, userDid]);

  return (
    <>
      <div className="relative flex items-center" ref={voicemailDropdownRef}>
        <Link
          to="#"
          onClick={() => setShowVoicemailDropdown((prev) => !prev)}
          className="relative flex items-center"
        >
          <img src={bellIcon} className="max-w-6" alt="" />
          <span
            className={`absolute top-0 right-0 w-2 h-2 ${
              voicemailData?.unplayedCount > 0 ||
              totalUnread?.totalUnreadCount > 0
                ? "bg-red-500"
                : "bg-gray-400"
            } rounded-full`}
          ></span>
        </Link>

        {showVoicemailDropdown && (
          <div className="absolute top-10 w-[300px] right-0 m-auto flex flex-col items-center gap-2 bg-white rounded-md shadow-lg z-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex w-full">
                <button
                  className={`py-2 px-4 text-sm flex-1 border-b-2 transition-colors ${
                    activeTab === "voicemail"
                      ? "bg-secondary !text-white border-secondary"
                      : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("voicemail")}
                >
                  VoiceMail
                </button>
                <button
                  className={`py-2 px-4 text-sm flex-1 border-b-2 transition-colors ${
                    activeTab === "messages"
                      ? "bg-secondary !text-white border-secondary"
                      : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("messages")}
                >
                  Messages
                </button>
              </div>
            </div>

            <div className="w-full">
              {activeTab === "voicemail" ? (
                <VoicemailList
                  voicemailData={voicemailData}
                  setShowVoicemailDropdown={setShowVoicemailDropdown}
                />
              ) : (
                <MessagesList
                  totalUnread={totalUnread}
                  setShowVoicemailDropdown={setShowVoicemailDropdown}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const VoicemailList = ({ voicemailData, setShowVoicemailDropdown }) => {
  const navigate = useNavigate();

  const handleVoicemailClick = (msgId) => {
    setShowVoicemailDropdown(false);
    navigate(`/voicemail`, {
      state: { playMessageId: msgId },
    });
  };

  return (
    <ul className="max-h-[300px] m-0 p-0 overflow-y-auto w-full overflowScroll">
      {voicemailData?.unplayedCount > 0 ? (
        <>
          {Object.values(voicemailData?.unplayedVoicemails || {})
            .slice(0, 4)
            .map((item) => {
              const cleanCallerID = item.CallerID
                ? item.CallerID.replace(/["<>]/g, "").trim()
                : "";
              return (
                <li
                  key={item.Msgid}
                  className="border-b-[1px] border-gray-200 px-4 py-2 flex flex-col gap-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleVoicemailClick(item.Msgid)}
                >
                  <h5 className="text-gray-500 text-sm">{cleanCallerID}</h5>
                  <p className="text-gray-700 text-sm">
                    {convertCSTToLocalTime(item.DateTime)}
                  </p>
                </li>
              );
            })}
          {Object.keys(voicemailData?.unplayedVoicemails || {}).length > 4 && (
            <li className="border-t-[1px] border-gray-200">
              <Link
                to="/voicemail"
                className="block w-full text-center py-3 !text-secondary hover:bg-gray-50 font-medium text-sm"
                onClick={() => setShowVoicemailDropdown(false)}
              >
                Show More (
                {Object.keys(voicemailData?.unplayedVoicemails || {}).length -
                  4}{" "}
                more)
              </Link>
            </li>
          )}
        </>
      ) : (
        <EmptyMessage message="No voicemails available" />
      )}
    </ul>
  );
};

const MessagesList = ({ totalUnread, setShowVoicemailDropdown }) => (
  <div className="text-sm text-gray-500 text-center">
    <ul className="max-h-[300px] m-0 p-0 overflow-y-auto w-full text-left overflowScroll">
      {totalUnread?.totalUnreadCount > 0 ? (
        <>
          {totalUnread?.unreadChats?.slice(0, 4)?.map((item, index) => (
            <MessageItem key={index} item={item} />
          ))}
          {totalUnread?.unreadChats?.length > 4 && (
            <li className="border-t-[1px] border-gray-200">
              <Link
                to="/chat"
                className="block w-full text-center py-3 !text-secondary hover:bg-gray-50 font-medium text-sm"
                onClick={() => setShowVoicemailDropdown(false)}
              >
                Show More ({totalUnread.unreadChats.length - 4} more messages)
              </Link>
            </li>
          )}
        </>
      ) : (
        <EmptyMessage message="No messages available" />
      )}
    </ul>
  </div>
);

const MessageItem = ({ item }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let displayName = "";
  if (item?.participants?.length > 0) {
    const participant = item.participants[0];
    const { firstName, lastName, formatcontact } = participant;
    if (firstName?.trim() || lastName?.trim()) {
      displayName = `${firstName || ""} ${lastName || ""}`.trim();
    } else {
      displayName = formatUSPhone(formatcontact);
    }
  } else {
    displayName = item.room_name.split("_")[0];
  }

  const formattedTime = new Date(
    item.created_at || Date.now()
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleNavigation = async (e) => {
    e.preventDefault();

    // Mark message as read before navigating
    if (item.id || item.room) {
      try {
        await getReadMessages(item.id || item.room);
        // Refresh chat list to update unread counts
        dispatch(fetchChatList({}));
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }

    // Navigate to chat
    navigate(`/chat?phoneNumber=${item?.participants?.[0]?.formatcontact}`, {
      state: {
        contact: item,
      },
    });
  };

  return (
    <li
      className="border-b-[1px] border-gray-200 px-4 py-2 flex justify-between gap-1 cursor-pointer hover:bg-gray-100"
      onClick={handleNavigation}
    >
      <div className="flex flex-col gap-2">
        <h5 className="text-gray-500 text-sm">{displayName}</h5>
        <p className="text-sm whitespace-nowrap overflow-hidden max-w-[180px] overflow-ellipsis">
          {item?.last_message_content}
        </p>
      </div>
      <p className="text-gray-700 text-sm">{formattedTime}</p>
    </li>
  );
};

const EmptyMessage = ({ message }) => (
  <li className="px-4 py-2 text-sm text-gray-500">{message}</li>
);

export default NotificationDropdown;
