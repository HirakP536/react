/* eslint-disable react-hooks/exhaustive-deps */
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getChatMessages, getReadMessages } from "../../api/chatApi";
import attachFile from "../../assets/phone/attach-file.svg";
import messageImg from "../../assets/phone/Messages-amico.svg";
import delivered from "../../assets/phone/read.png";
import arrowRight from "../../assets/phone/right-arrow.png";
import sendMessageIcon from "../../assets/phone/sendmessage.svg";
import sent from "../../assets/phone/sent.png";
import smileIcon from "../../assets/phone/smile.svg";
import userdark from "../../assets/phone/user-dark.svg";
import userwhite from "../../assets/phone/user-white.svg";
import { CustomDropdown } from "../../components/common/InputComponent";
import ProfileImage from "../../components/common/ProfileImage ";
import { errorToast } from "../../components/common/ToastContainer";
import useChatWebSocket, { getSocket } from "../../hooks/useChatWebSocket";
import useDebounce from "../../hooks/useDebounce";
import useOutsideClick from "../../hooks/useOutsideClick";
import Skeleton, { MessageSkeleton } from "../../skeleton/Skeleton";
import { fetchChatList } from "../../store/slices/chatListSlice";
import { formatUSPhone } from "../../utils/common";
import MessageWindow from "./partials/MessageWindow";

export default function WhatsAppStyleChat() {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [roomId, setRoomId] = useState("");
  const [newSocketData, setNewSocketData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firstLoad, setFirstLoad] = useState(true);
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [openNewChat, setOpenNewChat] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(false); // Always default to false
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMessageSearch = useDebounce(messageSearch, 300);
  const emojiPickerRef = useRef(null);
  const sidebarRef = useRef(null);
  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const dispatch = useDispatch();

  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));
  // Close sidebar on outside click in mobile view
  useOutsideClick(sidebarRef, () => {
    if (isMobileView && showSidebar) {
      setShowSidebar(false);
    }
  });

  const [selectedContact, setSelectedContact] = useState(null);
  const phoneNumber = useSelector(
    (state) => state.auth?.user?.data?.extension[0]?.phones
  );
  const uuid = useSelector((state) => state.auth?.user?.data?.uuid);
  const senderNameBy = useSelector((state) => state.auth?.user?.data);
  const debouncedInput = useDebounce(input);

  const handleIncomingMessage = (data) => {
    setMessages((prev) => [...prev, data]);
  };

  const { sendMessage: sendViaSocket } = useChatWebSocket(
    uuid,
    handleIncomingMessage,
    setNewSocketData
  );

  const handleOpenNewChat = () => {
    setOpenNewChat(true);
    setSelectedContact(null);
    setRoomId("");
  };

  const sendMessage = async () => {
    if (input.trim() === "" && attachments.length === 0) return;

    let image = "";
    let imageName = "";

    if (attachments?.length > 0) {
      const file = attachments[0];
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      if (blob.size > 10 * 1024 * 1024) {
        errorToast("Image is more than 10MB");
        return;
      }
      image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      imageName = file.file_name;
    }

    const socketPayload = {
      userid: uuid,
      image: image,
      imageName: imageName,
      message: debouncedInput.trim(),
      sender: sender,
      receiver: [receiver],
      room: openNewChat ? "" : roomId || "",
      msgtype: import.meta.env.VITE_SOCKET_EXTERNAL,
    };
    const localMessage = {
      ...socketPayload,
      created_at: new Date().toISOString(),
      sendername: `${senderNameBy?.firstName} ${senderNameBy?.lastName}`,
    };
    setMessages((prev) => [...prev, localMessage]);
    sendViaSocket(socketPayload);
    setInput("");
    setAttachments([]);

    // If sending from openNewChat, close it and keep chat window closed until contact is selected
    if (openNewChat) {
      setOpenNewChat(false);
      setSelectedContact(null);
      setRoomId("");
      setSender("");
      setReceiver("");
      getChatListhandler(true);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files?.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      errorToast("Image is more than 10MB");
      return;
    }
    const fileObject = {
      file_url: URL.createObjectURL(file),
      file_name: file.name,
    };
    setAttachments([fileObject]);
  };

  const getChatListhandler = async (noLoading = false) => {
    if (!noLoading) setLoading(true);
    try {
      const response = await dispatch(fetchChatList({}));
      const chatList = response?.payload?.allChats;
      setContacts(chatList);
    } catch (error) {
      console.error("❌ Error fetching chat list:", error);
      errorToast(error?.response?.data?.message || "Failed to fetch chat list");
    } finally {
      if (!noLoading) setLoading(false);
      setFirstLoad(false);
    }
  };

  const fetchChatMessages = async (roomId) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessagesLoading(true); // Set loading state when fetching messages
    try {
      if (newSocketData || unreadCount > 0) {
        await getReadMessages(roomId);
        await getChatListhandler(true);
      }
      const response = await getChatMessages(roomId, {
        signal: controller.signal,
      });
      const chatMessages = response.data?.messages;
      setMessages(chatMessages);

      // Scroll to bottom after messages load
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      if (
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        error?.message === "canceled" ||
        error?.name === "AbortError"
      ) {
        // Axios abort/cancel, do nothing
      } else {
        console.error("Error fetching chat messages:", error);
        errorToast(
          error?.response?.data?.message || "Failed to fetch messages"
        );
        setMessages([]);
      }
    } finally {
      setTimeout(() => {
        setMessagesLoading(false);
      }, 300);
    }
  };

  // Handle scrolling to bottom when sending messages
  useEffect(() => {
    if (
      messages.length > 0 &&
      !messagesLoading &&
      messagesContainerRef.current
    ) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, messagesLoading]);

  // Call fetchChatMessages when selectedContact or roomId changes
  useEffect(() => {
    if (selectedContact && roomId) {
      fetchChatMessages(roomId);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedContact, roomId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Memoize the handler to prevent unnecessary re-renders
    const handleSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Only update if we need to
        if (data && typeof data === "object") {
          // Avoid unnecessary state updates by checking first
          if (data.room === roomId) {
            setNewSocketData(data);
          } else {
            // If message is for a different room, just refresh chat list without full loading
            getChatListhandler(true);
          }
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };

    socket.addEventListener("message", handleSocketMessage);

    // Clean up event listener
    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [roomId]);
  useEffect(() => {
    // Initial chat list load
    getChatListhandler();

    // Only fetch messages if the socket data is for the current room
    if (newSocketData && newSocketData.room === roomId) {
      fetchChatMessages(roomId);
    }
  }, [newSocketData]);

  const handleContactSelection = (room, displayName) => {
    if (!room?.room_name) return;

    // Reset UI state first for better perceived performance
    setMessagesLoading(true);
    setMessages([]);

    // Handle mobile view state
    if (isMobileView) {
      setShowSidebar(false);
    }
    setOpenNewChat(false);

    const roomParts = room.room_name.split("_");
    const myNumbers = phoneNumber?.map((p) => p.formatedPhone);

    const myNumber = roomParts.find((part) => myNumbers.includes(part));
    const otherNumber = roomParts.find((part) => part !== myNumber);

    if (myNumber && otherNumber) {
      setSender(myNumber);
      setReceiver(otherNumber);
      setSelectedContact({ ...room, displayName });
      setRoomId(room.id);
      setUnreadCount(room.unread_counts || 0);
    } else {
      console.warn(
        "Could not identify sender/receiver from room name:",
        room.room_name
      );
      setMessagesLoading(false);
    }
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const dateKey = msg.created_at
        ? format(new Date(msg.created_at), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  // Filter contacts based on debouncedSearch (number, firstName, lastName)
  const filteredContacts = contacts
    ? contacts.filter((room) => {
        if (!debouncedSearch.trim()) return true;
        let displayName = "";
        let formatcontact = "";
        let firstName = "";
        let lastName = "";

        if (room?.participants?.length > 0) {
          const participant = room.participants[0];
          firstName = participant.firstName || "";
          lastName = participant.lastName || "";
          formatcontact = participant.formatcontact || "";
          if (firstName.trim() || lastName.trim()) {
            displayName = `${firstName} ${lastName}`.trim();
          } else {
            displayName = formatcontact;
          }
        } else {
          displayName = room.room_name.split("_")[0];
        }

        const searchLower = debouncedSearch.toLowerCase();
        return (
          displayName.toLowerCase().includes(searchLower) ||
          formatcontact.toLowerCase().includes(searchLower) ||
          firstName.toLowerCase().includes(searchLower) ||
          lastName.toLowerCase().includes(searchLower)
        );
      })
    : [];

  const grouped = groupMessagesByDate(
    [...messages].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return aTime - bTime;
    })
  );
  const dateKeys = Object.keys(grouped).sort();

  // Helper to highlight search term in message
  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(
      `(${search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text.replace(regex, '<mark class="bg-yellow-200">$1</mark>'),
        }}
      />
    );
  };

  // Filter messages by search term if provided
  const filterAndHighlightMessages = (msgs) => {
    if (!debouncedMessageSearch.trim()) return msgs;
    return msgs
      .filter(
        (msg) =>
          (msg.content &&
            msg.content
              .toLowerCase()
              .includes(debouncedMessageSearch.toLowerCase())) ||
          (msg.message &&
            msg.message
              .toLowerCase()
              .includes(debouncedMessageSearch.toLowerCase()))
      )
      .map((msg) => ({
        ...msg,
        _highlighted: true,
      }));
  };

  // Prepare phone number options for CustomDropdown
  const phoneNumberOptions = Array.isArray(phoneNumber)
    ? phoneNumber.map((p) => ({
        value: p.formatedPhone,
        label: p.label,
      }))
    : [];

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section
      className="relative w-[calc(100%-32px)] m-4 bg-white grid grid-cols-4 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
    >
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`col-span-1 bg-white p-4 border-[1px] border-gray-200 overflow-y-auto rounded-l-2xl transition-transform duration-300 ${
          isMobileView ? "absolute left-0 top-0 bottom-0 z-50 w-[80%]" : ""
        } ${isMobileView && !showSidebar ? "transform -translate-x-full" : ""}`}
        style={{
          boxShadow: isMobileView ? "2px 0px 5px rgba(0, 0, 0, 0.1)" : "none",
        }}
      >
        <div className="flex items-center mb-4 justify-between">
          <input
            type="text"
            placeholder="Search contacts..."
            className="border-[1px] w-[calc(100%-50px)] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="ml-2 bg-secondary !text-white flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
            onClick={handleOpenNewChat}
          >
            +
          </button>
        </div>
        <div className="h-[calc(100vh-180px)] overflow-y-auto overflowScroll">
          {loading && firstLoad ? (
            <Skeleton type="contact" rows={10} />
          ) : (
            filteredContacts.map((room) => {
              let displayName = "";
              let avatarName = "";

              if (room?.participants?.length > 0) {
                const participant = room.participants[0];
                const { firstName, lastName, formatcontact } = participant;
                if (firstName?.trim() || lastName?.trim()) {
                  displayName = `${firstName || ""} ${lastName || ""}`.trim();
                  avatarName = `${firstName || ""} ${lastName || ""}`.trim();
                } else {
                  displayName = formatUSPhone(formatcontact);
                  avatarName = "";
                }
              } else {
                displayName = room.room_name.split("_")[0];
                avatarName = "";
              }

              const formattedTime = new Date(
                room.created_at || Date.now()
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={room.id}
                  className={`flex w-[calc(100%-10px)] ml-1 justify-between items-center py-4 p-2 cursor-pointer ${
                    selectedContact?.id === room.id
                      ? "bg-secondary font-semibold rounded-[8px]"
                      : "boxShaodWrap border-b-[1px] border-gray-200"
                  }`}
                  onClick={() => {
                    handleContactSelection(room, displayName);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {avatarName ? (
                      <ProfileImage
                        name={avatarName}
                        classNameProperty={
                          selectedContact?.id === room.id
                            ? "!text-secondary bg-white"
                            : "!text-white bg-secondary"
                        }
                        size="40"
                      />
                    ) : (
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedContact?.id === room.id
                            ? "!text-secondary bg-white"
                            : "!text-white bg-secondary"
                        }`}
                      >
                        <img
                          src={
                            selectedContact?.id === room.id
                              ? userdark
                              : userwhite
                          }
                          className="max-w-4 ml-[2px]"
                          alt=""
                        />
                      </span>
                    )}
                    <div className="text-left">
                      <h5
                        className={`text-base ${
                          selectedContact?.id === room.id
                            ? "!text-white"
                            : "text-primary"
                        }`}
                      >
                        {displayName}
                      </h5>
                      <p
                        className={`text-xs ${
                          selectedContact?.id === room.id
                            ? "!text-white"
                            : "text-primary"
                        }`}
                      >
                        {room?.last_message_content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        selectedContact?.id === room.id
                          ? "!text-white"
                          : "text-primary"
                      }`}
                    >
                      {formattedTime}
                    </p>
                    {room?.unread_counts > 0 ? (
                      <p
                        className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          selectedContact?.id === room.id
                            ? "!text-secondary bg-white"
                            : "!text-white bg-secondary"
                        }`}
                      >
                        {room?.unread_counts}
                      </p>
                    ) : (
                      ""
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={`${
          isMobileView ? "col-span-4" : "col-span-3"
        } flex flex-col h-[calc(100vh-80px)]`}
      >
        {openNewChat ? (
          <>
            <div
              className="sticky top-0 z-10 bg-white border-b-[1px] border-gray-200 p-4 py-5 flex items-start justify-between gap-3 rounded-r-2xl"
              style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="relative sm:flex block items-center justify-start gap-2.5 w-full">
                <div className="sm:flex block gap-1 items-center">
                  <h5 className="mb-2.5">From:</h5>
                  <CustomDropdown
                    name="sender"
                    options={phoneNumberOptions}
                    value={
                      phoneNumberOptions.find((opt) => opt.value === sender) ||
                      ""
                    }
                    onChange={(e) => setSender(e.target.value)}
                    customClass="!m-0"
                  />
                </div>
                <img
                  src={arrowRight}
                  className="max-w-6 sm:rotate-0 rotate-90 my-2.5 sm:my-0"
                  alt=""
                />
                <div className="sm:flex block gap-1 items-center">
                  <h5 className="mb-2.5">To:</h5>
                  <input
                    type="text"
                    className="border-[1px] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
                    placeholder="Enter number"
                    value={receiver}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setReceiver(val);
                    }}
                  />
                </div>
                <button
                  className="text-sm bg-secondary !text-white sm:mt-0 mt-2.5 px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer"
                  onClick={() => setOpenNewChat(false)}
                >
                  Cancel
                </button>
              </div>
              {isMobileView && (
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                  onClick={() => setShowSidebar((prev) => !prev)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Chat area for new chat */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-chat-bg flex flex-col overflowScroll bg-[#f0f2f5]">
              <div className="flex flex-col justify-end items-center h-full">
                <img src={messageImg} alt="" className="max-w-[400px]" />
                <p>
                  Start a new conversation by selecting From and entering To
                  number.
                </p>
              </div>
            </div>
            <div
              className="p-4 flex flex-col gap-2 border-t-[1px] border-gray-200 bg-white"
              style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
            >
              {attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-secondary cursor-pointer !text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100 group-hover:scale-110 transition"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  className="w-[calc(100%-85px)] border-[1px] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
                  placeholder="Type a message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={!sender || !receiver}
                />
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    type="button"
                    className="cursor-pointer w-5 h-5 flex items-center justify-center"
                  >
                    <img src={smileIcon} className="max-w-5" alt="" />
                  </button>
                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-12 z-10 right-0"
                      ref={emojiPickerRef}
                    >
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <img
                    src={attachFile}
                    className="max-w-5 cursor-pointer w-5 h-5 flex items-center justify-center"
                    alt=""
                  />
                </label>
                <button
                  className="cursor-pointer w-5 h-5 flex items-center justify-center"
                  onClick={sendMessage}
                  disabled={
                    !sender ||
                    !receiver ||
                    receiver?.length !== 10 ||
                    input.trim() === ""
                  }
                >
                  <img src={sendMessageIcon} className="max-w-5" alt="" />
                </button>
              </div>
            </div>
          </>
        ) : !selectedContact ? (
          <div className="p-4 flex flex-col items-center justify-center bg-white border-b-[1px] border-gray-200 h-full">
            <img src={messageImg} alt="" className="max-w-[400px]" />
            <p className="text-center text-gray-500">
              Click on a contact to view your previous conversations or begin a
              new one.
            </p>
            {isMobileView && (
              <button
                className="mt-4 bg-secondary !text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
                onClick={() => setShowSidebar(true)}
              >
                Start New Chat
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="sticky top-0 z-10 bg-white border-b-[1px] border-gray-200 p-4 py-5 sm:flex block items-center justify-between gap-3"
              style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex sm:flex items-center justify-between gap-2.5 sm:m-0 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <h5>From: {formatUSPhone(sender)}</h5>
                  <img src={arrowRight} className="max-w-6" alt="" />
                  <h5>TO: {formatUSPhone(receiver)}</h5>
                </div>
                {isMobileView && (
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                    onClick={() => setShowSidebar((prev) => !prev)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="search"
                placeholder="Search messages..."
                className="flex border-[1px] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
              />
            </div>
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 space-y-2 overflow-y-auto bg-chat-bg flex flex-col overflowScroll bg-[#f0f2f5]"
            >
              <div className="flex flex-col justify-end">
                {messagesLoading ? (
                  <MessageSkeleton rows={8} />
                ) : dateKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  dateKeys.map((dateKey) => {
                    // Filter and highlight messages for this date
                    const filteredMsgs = filterAndHighlightMessages(
                      grouped[dateKey]
                    );
                    if (!filteredMsgs.length) return null;
                    return (
                      <div key={dateKey}>
                        <div className="flex justify-center my-8 relative border-b-[1px] border-gray-200">
                          <span className="bg-secondary text-xs !text-white px-3 py-1 rounded-full max-w-[110px] flex items-center justify-center absolute top-[-12px] right-0 left-0 mx-auto">
                            {format(new Date(dateKey), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {filteredMsgs.map((msg) => {
                          const isSender = msg.sendername ? true : false;
                          return (
                            <div
                              key={msg?.id || Math.random()}
                              className={`flex w-full ${
                                isSender ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div className="max-w-[80%]">
                                <MessageWindow
                                  message={{
                                    ...msg,
                                    // Pass highlighted content/message if search is active
                                    ...(debouncedMessageSearch && {
                                      content: msg.content
                                        ? highlightText(
                                            msg.content,
                                            debouncedMessageSearch
                                          )
                                        : undefined,
                                      message: msg.message
                                        ? highlightText(
                                            msg.message,
                                            debouncedMessageSearch
                                          )
                                        : undefined,
                                    }),
                                  }}
                                  isSender={isSender}
                                />
                                <div className="flex justify-between items-center mt-1">
                                  {isSender && (
                                    <span
                                      className={`text-xs block text-right text-primary`}
                                    >
                                      send by {msg.sendername}
                                    </span>
                                  )}
                                  {isSender && (
                                    <span
                                      className={`text-xs justify-end flex ${
                                        msg.read
                                          ? "text-gray-500"
                                          : "text-primary"
                                      }`}
                                    >
                                      <img
                                        src={
                                          msg.status !== "delivered"
                                            ? sent
                                            : delivered
                                        }
                                        alt=""
                                      />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div
              className="p-4 flex flex-col gap-2 border-t-[1px] border-gray-200 bg-white"
              style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
            >
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-secondary cursor-pointer !text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100 group-hover:scale-110 transition"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  className="w-[calc(100%-85px)] border-[1px] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
                  placeholder="Type a message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={!selectedContact}
                />
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    type="button"
                    className="cursor-pointer"
                  >
                    <img
                      src={smileIcon}
                      className="max-w-5 cursor-pointer w-5 h-5 flex items-center justify-center"
                      alt=""
                    />
                  </button>
                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-12 z-10 right-0"
                      ref={emojiPickerRef}
                    >
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <img
                    src={attachFile}
                    className="max-w-5 cursor-pointer w-5 h-5 flex items-center justify-center"
                    alt=""
                  />
                </label>
                <button
                  className="cursor-pointer w-5 h-5 flex items-center justify-center"
                  onClick={sendMessage}
                  disabled={!selectedContact || debouncedInput.trim() === ""}
                >
                  <img src={sendMessageIcon} className="max-w-5" alt="" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
