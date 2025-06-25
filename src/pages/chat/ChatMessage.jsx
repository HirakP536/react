/* eslint-disable react-hooks/exhaustive-deps */
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router";
import { getChatMessages, getReadMessages } from "../../api/chatApi";
import userIcon from "../../assets/auth/user.png";
import contactLight from "../../assets/layout/phonelight.png";
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
import useSipSession from "../../hooks/useSipSession";
import Skeleton, { MessageSkeleton } from "../../skeleton/Skeleton";
import {
  resetDialedPhone,
  setDialedPhone,
  setModalOpenFlag,
} from "../../store/slices/callFeatureSlice";
import { fetchChatList } from "../../store/slices/chatListSlice";
import { fetchContactsList } from "../../store/slices/contactsManagementSlice";
import { formatUSPhone, normalizePhoneNumber } from "../../utils/common";
import AddContact from "./partials/AddContact";
import ContactDropdown from "./partials/ContactDropdown";
import MessageWindow from "./partials/MessageWindow";

const WhatsAppStyleChat = () => {
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedUserNumber, setSelectedUserNumber] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMessageSearch = useDebounce(messageSearch, 300);
  const emojiPickerRef = useRef(null);
  const sidebarRef = useRef(null);
  const abortControllerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userNumber = searchParams.get("phoneNumber");

  const selectedCallerId = useSelector(
    (state) => state.callFeature.selectedCallerId
  );
  const activeLineId = useSelector((state) => state.sip.activeLineId);
  const lines = useSelector((state) => state.sip.lines);
  const { makeCall, sessionRef } = useSipSession();

  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));
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
  const handleIncomingMessage = useCallback(
    (data) => {
      if (selectedContact && selectedContact.id === data.room) {
        setMessages((prev) => [...prev, data]);
        getReadMessages(data.room)
          .then(() => {
            getChatListhandler(true);
          })
          .catch((error) => {
            console.error("Error marking messages as read:", error);
          });
      }
      getChatListhandler(true);
    },
    [selectedContact]
  );

  const { sendMessage: sendViaSocket } = useChatWebSocket(
    uuid,
    handleIncomingMessage,
    setNewSocketData
  );

  const handleOpenNewChat = () => {
    setOpenNewChat(true);
    setSelectedContact(null);
    setRoomId("");
    setReceiver({});
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  const handleContactSelection = (room, displayName) => {
    if (!room?.room_name) return;
    setMessagesLoading(true);
    setMessages([]);
    setMessageSearch("");
    setInput("");
    navigate();

    // Handle mobile view state
    if (isMobileView) {
      setShowSidebar(false);
    }
    setOpenNewChat(false);
    const roomParts = room.room_name.split("_");
    const myNumbers = phoneNumber?.map((p) => p.formatedPhone);
    const myNumber =
      selectedUserNumber || roomParts.find((part) => myNumbers.includes(part));
    const otherNumber = roomParts.find((part) => part !== myNumber);
    const participant = room.participants[0];
    if (room?.participants?.length > 0) {
      setReceiver({
        formatcontact: participant.formatcontact,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        id: participant.id,
      });
    } else {
      setReceiver({
        formatcontact: otherNumber,
        firstName: "",
        lastName: "",
        email: "",
        id: "",
      });
    }

    if (myNumber && otherNumber) {
      setSender(myNumber);
      setSelectedContact({ ...room, displayName });
      setRoomId(room.id);
      setUnreadCount(room.unread_counts || 0);
      getReadMessages(room.id)
        .then(() => {
          getChatListhandler(true);
        })
        .catch((error) => {
          console.error("Error marking messages as read:", error);
        });
    } else {
      console.warn(
        "Could not identify sender/receiver from room name:",
        room.room_name
      );
      setMessagesLoading(false);
    }
  };

  // Fix: Use raw input value, not debouncedInput, to allow sending same message
  const sendMessage = useCallback(async () => {
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
      message: input.trim(),
      sender: sender,
      receiver: [receiver?.formatcontact],
      room: openNewChat ? "" : roomId || "",
      msgtype: import.meta.env.VITE_SOCKET_EXTERNAL,
    };
    const localMessage = {
      ...socketPayload,
      created_at: new Date().toISOString(),
      sendername: `${senderNameBy?.firstName} ${senderNameBy?.lastName}`,
    };

    try {
      // Add message to messages state
      setMessages((prev) => [...prev, localMessage]);

      // Update contacts list with new message
      setContacts((prevContacts) => {
        const updatedContacts = [...prevContacts];
        const contactIndex = updatedContacts.findIndex((c) => c.id === roomId);
        
        if (contactIndex !== -1) {
          // Update existing chat
          updatedContacts[contactIndex] = {
            ...updatedContacts[contactIndex],
            last_message_content: input.trim(),
            last_message_time: new Date().toISOString(),
            last_message_sender: sender
          };
        } else if (openNewChat) {
          // Add new chat to top of list
          updatedContacts.unshift({
            id: `temp_${Date.now()}`,
            room_name: `${sender}_${receiver?.formatcontact}`,
            last_message_content: input.trim(),
            last_message_time: new Date().toISOString(),
            last_message_sender: sender,
            participants: [{
              formatcontact: receiver?.formatcontact,
              firstName: receiver?.firstName || '',
              lastName: receiver?.lastName || ''
            }]
          });
        }
        return updatedContacts;
      });

      await sendViaSocket(socketPayload);
      setInput("");
      setAttachments([]);
    } catch (error) {
      console.error("Error sending message:", error);
      errorToast("Failed to send message");
      return;
    }

    if (openNewChat) {
      setOpenNewChat(false);
      setSelectedContact(null);
      setRoomId("");
      try {
        setSender("");
        setReceiver({});
        const response = await dispatch(fetchChatList({}));
        const chatList = response?.payload?.allChats;
        const sortedChatList = chatList
          ? [...chatList].sort((a, b) => {
              const timeA = new Date(a.last_message_time || 0).getTime();
              const timeB = new Date(b.last_message_time || 0).getTime();
              return timeB - timeA;
            })
          : [];

        setContacts(sortedChatList);

        if (sortedChatList && sortedChatList.length > 0) {
          const mostRecentChat = sortedChatList[0];
          let displayName = "";
          if (mostRecentChat?.participants?.length > 0) {
            const participant = mostRecentChat.participants[0];
            const { firstName, lastName, formatcontact } = participant;
            if (firstName?.trim() || lastName?.trim()) {
              displayName = `${firstName || ""} ${lastName || ""}`.trim();
            } else {
              displayName = formatUSPhone(formatcontact);
            }
          } else {
            const roomParts = mostRecentChat.room_name.split("_");
            displayName = formatUSPhone(roomParts[1] || roomParts[0]);
          }
          setTimeout(() => {
            handleContactSelection(mostRecentChat, displayName);
          }, 300);
        }
      } catch (error) {
        console.error(
          "Failed to fetch chat list after sending message:",
          error
        );
        errorToast("Failed to refresh chat list");
      }
    }
  }, [
    input,
    attachments,
    uuid,
    sender,
    receiver,
    roomId,
    openNewChat,
    sendViaSocket,
    senderNameBy,
    dispatch,
    fetchChatList,
    setContacts,
    handleContactSelection,
  ]);

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
      const sortedChatList = chatList
        ? [...chatList].sort((a, b) => {
            const timeA = new Date(a.last_message_time || 0).getTime();
            const timeB = new Date(b.last_message_time || 0).getTime();
            return timeB - timeA;
          })
        : [];

      setContacts(sortedChatList);
    } catch (error) {
      console.error("❌ Error fetching chat list:", error);
      errorToast(error?.response?.data?.message || "Failed to fetch chat list");
    } finally {
      if (!noLoading) {
        setLoading(false);
      }
      setFirstLoad(false);
    }
  };

  const fetchChatMessages = async (roomId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessagesLoading(true);
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
  useEffect(() => {
    if (
      messages.length > 0 &&
      !messagesLoading &&
      messagesContainerRef.current
    ) {
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      };
      scrollToBottom();
      const timeout = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(timeout);
    }
  }, [messages, messagesLoading]);

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

    const handleSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === "object") {
          if (data.room === roomId) {
            const hasMessageIdKey = "messageid" in data;
            const hasMessageStatusKey = "messagestatus" in data;

            const formattedSocketData = {
              id: data.messageid || Date.now(),
              sendername:
                hasMessageIdKey && hasMessageStatusKey
                  ? `${senderNameBy?.firstName} ${senderNameBy?.lastName}`
                  : null,
              sendernumber: data.sender,
              is_read: false,
              status: "received",
              sender:
                hasMessageIdKey && hasMessageStatusKey ? data.sender : null,
              content: data.message,
              created_at: new Date().toISOString(),
              message_type: "text",
              attachments:
                data.image && data.imageName
                  ? [
                      {
                        file_url: data.image,
                        file_name: data.imageName,
                      },
                    ]
                  : [],
            };

            setNewSocketData(formattedSocketData);
            if (!(hasMessageIdKey && hasMessageStatusKey)) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages, formattedSocketData];
                return newMessages;
              });

              // Mark messages as read immediately when we're actively viewing this chat
              getReadMessages(roomId)
                .then(() => {
                  getChatListhandler(true);
                })
                .catch((error) => {
                  console.error("Error marking messages as read:", error);
                });
            }
            if (data.messagestatus === "chat_delivered") {
              setMessages((prevMessages) =>
                prevMessages.map((msg) => {
                  if (msg.room && msg.room === data.room) {
                    return {
                      ...msg,
                      status: "delivered",
                    };
                  }
                  return msg;
                })
              );
            }
          }
          // getChatListhandler(true);
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };
    socket.addEventListener("message", handleSocketMessage);
    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [roomId, senderNameBy]);

  useEffect(() => {
    getChatListhandler();
  }, []);

  const chatListFilteredContacts = useMemo(() => {
    return contacts
      ? contacts.filter((room) => {
          const roomParts = room?.room_name?.split("_") || [];
          let currentUserNumberInRoom = "";

          if (selectedUserNumber) {
            if (!roomParts.includes(selectedUserNumber)) {
              return false;
            }
            currentUserNumberInRoom = selectedUserNumber;
          } else {
            const myNumbers = phoneNumber?.map((p) => p.formatedPhone);
            currentUserNumberInRoom = roomParts.find((part) =>
              myNumbers?.includes(part)
            );
            if (!currentUserNumberInRoom) {
              return false;
            }
          }
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
            if (firstName?.trim() || lastName?.trim()) {
              displayName = `${firstName} ${lastName}`.trim();
            } else {
              displayName = formatUSPhone(formatcontact);
            }
          } else {
            displayName =
              roomParts.find((num) => num !== currentUserNumberInRoom) || "";
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
  }, [contacts, debouncedSearch, selectedUserNumber, phoneNumber]);

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

  const grouped = useMemo(() => {
    return groupMessagesByDate(
      [...messages].sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return aTime - bTime;
      })
    );
  }, [messages]);

  const dateKeys = useMemo(() => Object.keys(grouped).sort(), [grouped]);

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

  useEffect(() => {
    if (!sessionRef.current) {
      dispatch(resetDialedPhone());
      dispatch(setModalOpenFlag(false));
    }
  }, [sessionRef.current, dispatch]);

  // make call from chat
  const handleCall = (receiver) => {
    let numberToCall = normalizePhoneNumber(selectedCallerId);
    let dialedPhone = receiver?.formatcontact;
    const hasActiveCallThatWillBeHeld =
      activeLineId !== null &&
      lines[activeLineId] &&
      !lines[activeLineId].onHold &&
      !lines[activeLineId].ringing;
    const lineId = makeCall({
      phone: dialedPhone,
      selectedNumber: numberToCall,
    });

    if (lineId) {
      dispatch(setDialedPhone(dialedPhone));
      if (hasActiveCallThatWillBeHeld) {
        console.warn(
          `Previous call on line ${activeLineId} was automatically put on hold`
        );
      }
    } else {
      console.warn("Could not make call - all lines may be in use");
    }
    dispatch(setModalOpenFlag(true));
  };

  const handleOpenContactModal = () => {
    if (!receiver) {
      errorToast("Please select a contact or enter a phone number first");
      return;
    }
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
  };

  const handleContactUpdate = (updatedContact) => {
    // Update receiver info with the updated contact details
    if (updatedContact) {
      setReceiver(updatedContact);
    }
    
    // Refresh the chat list
    getChatListhandler(true);
  };

  const { contactsList: allContacts } = useSelector(
    (state) => state.contactsManagement
  );

  useEffect(() => {
    dispatch(fetchContactsList());
  }, [dispatch]);

  useEffect(() => {
    if (!receiver?.formatcontact || receiver?.formatcontact?.length < 1) {
      setFilteredContacts([]);
      setShowContactDropdown(false);
      return;
    }

    if (!allContacts || allContacts.length === 0) {
      return;
    }

    const normalizedInput = receiver?.formatcontact?.replace(/\D/g, "");
    const matching = allContacts.filter((contact) => {
      if (!contact.contactPhone) return false;

      const contactPhone = contact.contactPhone || "";
      const normalizedPhone = contactPhone.replace(/\D/g, "");
      return normalizedPhone.includes(normalizedInput);
    });

    setFilteredContacts(matching);
    setShowContactDropdown(matching.length > 0);
  }, [receiver, allContacts]);

  const handleContactSelect = (contact) => {
    if (!contact.contactPhone) return;

    const normalizedPhone = contact.contactPhone
      .replace(/\D/g, "")
      .slice(0, 10);

    // Set receiver as an object with proper fields
    setReceiver({
      formatcontact: normalizedPhone,
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      id: contact.id || "",
    });

    if (normalizedPhone && contacts.length > 0) {
      const existingChat = contacts.find((room) => {
        const roomParts = room.room_name?.split("_") || [];
        return roomParts.some((part) => part.includes(normalizedPhone));
      });

      if (existingChat) {
        let displayName = `${contact.firstName || ""} ${
          contact.lastName || ""
        }`.trim();
        handleContactSelection(existingChat, displayName);
      }
    }
  };

  useEffect(() => {
    if (userNumber && contacts && contacts.length > 0) {
      const matchedRoom = contacts.find((room) => {
        if (room?.participants?.length > 0) {
          return room.participants.some(
            (p) =>
              p.formatcontact &&
              p.formatcontact.replace(/\D/g, "") ===
                userNumber.replace(/\D/g, "")
          );
        }
        return false;
      });
      if (matchedRoom) {
        let displayName = "";
        const participant = matchedRoom.participants.find(
          (p) =>
            p.formatcontact &&
            p.formatcontact.replace(/\D/g, "") === userNumber.replace(/\D/g, "")
        );
        if (participant) {
          if (
            (participant.firstName && participant.firstName.trim()) ||
            (participant.lastName && participant.lastName.trim())
          ) {
            displayName = `${participant.firstName || ""} ${
              participant.lastName || ""
            }`.trim();
          } else {
            displayName = formatUSPhone(participant?.formatcontact);
          }
        }
        handleContactSelection(matchedRoom, displayName);
      } else {
        setOpenNewChat(true);
        setSelectedContact(null);
        setRoomId("");
        // Set receiver as object with formatcontact
        setReceiver({
          formatcontact: userNumber,
          firstName: "",
          lastName: "",
          email: "",
          id: "",
        });
      }
    }
  }, [contacts, userNumber]);

  useEffect(() => {
    if (
      phoneNumber?.length > 0 &&
      !selectedUserNumber &&
      phoneNumberOptions.length > 0
    ) {
      setSelectedUserNumber(phoneNumberOptions[0].value);
      if (!sender && openNewChat) {
        setSender(phoneNumberOptions[0].value);
      }
    }
  }, [
    phoneNumber,
    phoneNumberOptions,
    selectedUserNumber,
    sender,
    openNewChat,
  ]);

  return (
    <section
      className="relative w-[calc(100%-32px)] m-4 bg-white rounded-2xl overflow-hidden flex"
      style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
    >
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`bg-white p-4 border-[1px] border-gray-200 overflow-y-auto rounded-l-2xl transition-transform duration-300 ${
          isMobileView
            ? "absolute left-0 top-0 bottom-0 z-50 sm:w-[80%] w-full"
            : "w-full 2xl:max-w-[450px] max-w-[400px]"
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
        <div className="flex items-center mb-4 justify-between">
          <CustomDropdown
            name="userNumber"
            options={phoneNumberOptions}
            value={selectedUserNumber}
            onChange={(e) => {
              setSelectedUserNumber(e.target.value);
              if (openNewChat) {
                setSender(e.target.value);
              }
            }}
            customClass="w-full"
          />
        </div>
        <div className="h-[calc(100vh-250px)] overflow-y-auto overflowScroll">
          {loading && firstLoad ? (
            <Skeleton type="contact" rows={10} />
          ) : (
            chatListFilteredContacts.map((room) => {
              let displayName = "";
              let currentUserNumber = "";
              let avatarName = "";
              const roomParts = room?.room_name?.split("_") || [];
              const participant = room?.participants?.[0];

              if (participant) {
                const participant = room.participants[0];
                const { firstName, lastName, formatcontact } = participant;
                if (firstName?.trim() || lastName?.trim()) {
                  displayName = `${firstName || ""} ${lastName || ""}`.trim();
                  avatarName = `${firstName || ""} ${lastName || ""}`.trim();
                } else {
                  displayName = formatUSPhone(formatcontact);
                  avatarName = "";
                }
                currentUserNumber =
                  selectedUserNumber ||
                  roomParts.find((num) => num !== displayName) ||
                  "";
              } else {
                const roomParts = room.room_name.split("_");
                currentUserNumber =
                  selectedUserNumber ||
                  roomParts.find((num) => num !== displayName) ||
                  "";

                displayName =
                  formatUSPhone(roomParts.find((num) => num !== currentUserNumber)) || "";
                avatarName = "";
              }

              const formattedTime = (() => {
                const date = new Date(room.last_message_time || Date.now());
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const timeString = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                if (date.toDateString() === today.toDateString()) {
                  return `Today, ${timeString}`;
                } else if (date.toDateString() === yesterday.toDateString()) {
                  return `Yesterday, ${timeString}`;
                } else {
                  const dateString = date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                  return `${dateString}, ${timeString}`;
                }
              })();

              return (
                <button
                  key={room.id}
                  className={`sm:flex block w-[calc(100%-10px)] ml-1 justify-between items-center py-4 p-2 cursor-pointer ${
                    selectedContact?.id === room.id
                      ? "bg-secondary font-semibold rounded-[8px]"
                      : "boxShaodWrap border-b-[1px] border-gray-200"
                  }`}
                  onClick={() => {
                    handleContactSelection(room, displayName);
                  }}
                >
                  <div className="sm:flex block items-center gap-3">
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
                        className={`text-sm flex items-center gap-2.5 ${
                          selectedContact?.id === room.id
                            ? "!text-white"
                            : "text-primary"
                        }`}
                      >
                        {displayName}
                      </h5>
                      <p
                        className={`text-xs whitespace-nowrap overflow-hidden max-w-[180px] overflow-ellipsis ${
                          selectedContact?.id === room.id
                            ? "!text-white"
                            : "text-primary"
                        }`}
                      >
                        {room?.last_message_content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center flex-col gap-0.5">
                    {room?.unread_counts > 0 ? (
                      <p
                        className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
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
                    <p
                      className={`text-[12px] ${
                        selectedContact?.id === room.id
                          ? "!text-white"
                          : "text-primary"
                      }`}
                    >
                      {formattedTime}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-[calc(100vh-80px)]">
        {openNewChat ? (
          <>
            <div
              className="sticky top-0 z-10 bg-white border-b-[1px] border-gray-200 p-4 py-5 sm:flex block items-start justify-between gap-3 rounded-r-2xl"
              style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="relative sm:flex block items-center justify-start gap-2.5">
                <div className="sm:flex block gap-1 items-center">
                  <h5 className="sm:mb-0 mb-2.5">From:</h5>
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
                  className="max-w-6 sm:rotate-0 rotate-90 my-2.5 sm:my-0 sm:inline-block hidden"
                  alt=""
                />
                <div className="sm:flex block gap-1 items-center relative">
                  <h5 className="mb-2.5 sm:mb-0">To:</h5>
                  <div className="relative">
                    <input
                      type="text"
                      className="border-[1px] px-3 py-2 text-sm sm:text rounded-[6px] focus:outline-none border-gray-200"
                      placeholder="Enter number"
                      value={formatUSPhone(receiver?.formatcontact || "")}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setReceiver({
                          ...receiver,
                          formatcontact: val,
                        });
                        if (val.length > 0) {
                          const normalizedInput = val.replace(/\D/g, "");
                          const matching = allContacts.filter((contact) => {
                            if (!contact.contactPhone) return false;
                            const normalizedPhone =
                              contact.contactPhone.replace(/\D/g, "");
                            return normalizedPhone.includes(normalizedInput);
                          });

                          setFilteredContacts(matching);
                          setShowContactDropdown(matching.length > 0);
                        } else {
                          setFilteredContacts([]);
                          setShowContactDropdown(false);
                        }
                      }}
                      onFocus={() => {
                        if (filteredContacts.length > 0) {
                          setShowContactDropdown(true);
                        } else if (receiver.length > 0) {
                          const normalizedInput = receiver.replace(/\D/g, "");
                          const matching = allContacts.filter((contact) => {
                            if (!contact.contactPhone) return false;
                            const normalizedPhone =
                              contact.contactPhone.replace(/\D/g, "");
                            return normalizedPhone.includes(normalizedInput);
                          });

                          setFilteredContacts(matching);
                          setShowContactDropdown(matching.length > 0);
                        }
                      }}
                    />
                    <ContactDropdown
                      contacts={filteredContacts}
                      onSelect={handleContactSelect}
                      isOpen={showContactDropdown}
                      setIsOpen={setShowContactDropdown}
                    />
                  </div>
                </div>
                <button
                  className="text-sm sm:mb-0 mb-2.5 bg-secondary !text-white sm:mt-0 mt-2.5 px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer"
                  onClick={() => setOpenNewChat(false)}
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCall(receiver);
                  }}
                  className="flex items-center bg-secondary justify-center w-10 h-10 rounded-full cursor-pointer"
                >
                  <img src={contactLight} alt="" />
                </Link>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenContactModal();
                  }}
                  className="flex items-center bg-secondary justify-center w-10 h-10 rounded-full cursor-pointer"
                >
                  <img src={userIcon} className="w-5" alt="" />
                </Link>
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
              <div className="flex flex-col justify-center items-center h-full">
                <img src={messageImg} alt="" className="max-w-[300px] w-full" />
                <p className="text-center mt-4 text-gray-600">
                  Start a new conversation by selecting From and entering To
                  number.
                </p>
              </div>
            </div>

            {/* Message input area */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
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
                  type="button"
                  className="cursor-pointer w-5 h-5 flex items-center justify-center"
                  onClick={sendMessage}
                  disabled={
                    !sender ||
                    !receiver?.formatcontact ||
                    receiver?.formatcontact?.length !== 10 ||
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
            <img src={messageImg} alt="" className="max-w-[300px] w-full" />
            <p className="text-center mt-4 text-gray-600">
              Click on a contact to view your previous conversations or begin a
              new one.
            </p>
            {isMobileView && (
              <button
                className="mt-6 bg-secondary !text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
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
              <div className="flex items-center justify-between gap-2.5 sm:m-0 mb-2.5">
                <div className="sm:flex block items-center gap-2.5">
                  <h5 className="sm:text-base text-sm">
                    {receiver?.firstName || receiver?.lastName
                      ? `${receiver.firstName || ""} ${
                          receiver.lastName || ""
                        }`.trim()
                      : formatUSPhone(receiver?.formatcontact || "")}
                  </h5>
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
              <div className="sm:flex block items-center gap-2.5">
                <div className="flex items-center gap-2.5 sm:mb-0 mb-2.5">
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCall(receiver);
                    }}
                    className="flex items-center bg-secondary justify-center w-10 h-10 rounded-full cursor-pointer"
                  >
                    <img src={contactLight} alt="" />
                  </Link>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenContactModal();
                    }}
                    className="flex items-center bg-secondary justify-center w-10 h-10 rounded-full cursor-pointer"
                  >
                    <img src={userIcon} className="w-5" alt="" />
                  </Link>
                </div>
                <input
                  type="search"
                  placeholder="Search messages..."
                  className="flex border-[1px] px-3 py-2 rounded-[6px] focus:outline-none border-gray-200"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                />
              </div>
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
                                  // Add a prop to MessageWindow to handle image onLoad
                                  onImageLoad={() => {
                                    if (messagesContainerRef.current) {
                                      messagesContainerRef.current.scrollTop =
                                        messagesContainerRef.current.scrollHeight;
                                    }
                                  }}
                                />
                                <div className="flex justify-end items-center gap-1.5 my-1.5">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
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
                  type="button"
                  className="cursor-pointer w-5 h-5 flex items-center justify-center"
                  onClick={sendMessage}
                  disabled={!selectedContact || input.trim() === ""}
                >
                  <img src={sendMessageIcon} className="max-w-5" alt="" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-[99]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          onClick={handleCloseContactModal}
        />
      )}
      <AddContact
        isOpen={showContactModal}
        setIsOpen={setShowContactModal}
        contactHandler={handleContactUpdate}
        editContact={receiver}
        onClose={handleCloseContactModal}
      />
    </section>
  );
};

export default WhatsAppStyleChat;
