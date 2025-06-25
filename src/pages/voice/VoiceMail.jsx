/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { deleteVoiceMail, readVoiceMail } from "../../api/callApi";
import waveGif from "../../assets/dashboard/Animation.gif";
import waveClose from "../../assets/dashboard/close.png";
import deleteIcon from "../../assets/dashboard/delete.png";
import playIcon from "../../assets/dashboard/play.png";
import searchIcon from "../../assets/layout/searchIcon.png";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import {
  errorToast,
  successToast,
} from "../../components/common/ToastContainer";
import useDebounce from "../../hooks/useDebounce";
import { TableSkeleton } from "../../skeleton/Skeleton";
import {
  fetchVoiceMail,
  markAsPlayed,
  updateVoicemailStatus,
} from "../../store/slices/voicemailSlice";
import { convertCSTToLocalTime } from "../../utils/common";

const VoiceMail = () => {
  const [voiceData, setVoiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioMsgId, setAudioMsgId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const audioRef = useRef(null);
  const extensionTenant = useSelector((state) => state.auth?.user?.data?.city);
  const extensionNumber = extensionTenant?.split("-")[0];
  const tenant = extensionTenant?.split("-")[1];
  const dispatch = useDispatch();

  const debouncedSearch = useDebounce(search);
  const voiceDataHandler = async () => {
    setIsLoading(true);
    try {
      const response = await dispatch(
        fetchVoiceMail({ tenant, extensionNumber })
      );
      setVoiceData(response?.payload?.allVoicemails || []);
      setFilteredData(response?.payload?.allVoicemails || []);
      return response;
    } catch (error) {
      console.error("Error", error);
      errorToast(error?.response?.data?.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant || !extensionNumber) return;
    voiceDataHandler();
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      setFilteredData(
        voiceData.filter((item) =>
          item.CallerID?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      );
    } else {
      setFilteredData(voiceData);
    }
  }, [debouncedSearch, voiceData]);

  const handleCloseAudio = () => {
    setAudioMsgId(null);
    setIsAudioPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Add a dedicated function to handle when audio playback ends
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioMsgId(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleReadAudio = async (msgId) => {
    try {
      const response = await readVoiceMail(tenant, msgId);
      setVoiceData((prevData) => {
        return prevData.map((item) => {
          if (item.Msgid === msgId) {
            // Mark this specific voicemail as played
            return {
              ...item,
              isPlayed: true,
              isUnplayed: false,
              Dir: item.Dir ? item.Dir.replace("/INBOX", "/Old") : item.Dir,
            };
          }
          return item;
        });
      });
      dispatch(markAsPlayed(msgId));
      dispatch(
        updateVoicemailStatus((prevData) => {
          return prevData.map((item) => {
            if (item.Msgid === msgId) {
              return {
                ...item,
                msgId: item.Msgid,
                isPlayed: item.isPlayed,
                isUnplayed: item.isUnplayed,
              };
            }
            return item;
          });
        })
      );

      // Also update filtered data to stay in sync
      setFilteredData((prevData) => {
        return prevData.map((item) => {
          if (item.Msgid === msgId) {
            return {
              ...item,
              isPlayed: true,
              isUnplayed: false,
              Dir: item.Dir ? item.Dir.replace("/INBOX", "/Old") : item.Dir,
            };
          }
          return item;
        });
      });

      return response;
    } catch (error) {
      console.log("error", error);
      errorToast(error?.response?.data?.error);
    }
  };

  const handleDeleteAudio = async (msgId) => {
    try {
      const response = await deleteVoiceMail(tenant, msgId);

      // Remove the deleted item from voiceData state
      setVoiceData((prevData) => {
        return prevData.filter((item) => item.Msgid !== msgId);
      });

      // Remove the deleted item from filteredData state
      setFilteredData((prevData) => {
        return prevData.filter((item) => item.Msgid !== msgId);
      });

      successToast("Voicemail deleted successfully");
      setShowDeleteConfirmation(false);
      setDeletingMsgId(null);
      return response;
    } catch (error) {
      console.log("error", error);
      errorToast(error?.response?.data?.error);
    }
  };

  const initiateDelete = (msgId) => {
    setDeletingMsgId(msgId);
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeletingMsgId(null);
  };

  return (
    <section className="w-[calc(100%-32px)] m-4 rounded-2xl">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={cancelDelete}
        onConfirm={() => handleDeleteAudio(deletingMsgId)}
        title="Delete Voicemail"
        message="Are you sure you want to delete this voicemail?."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <div className="relative block w-full">
        <div className="sticky pb-1 top-0 z-10 bg-[#f2f8ff] border-b-[1px] border-gray-200">
          <div className="relative flex items-center justify-between w-full max-w-96 my-4">
            <input
              type="search"
              placeholder="Search by Caller ID"
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-4 pl-10 py-2 bg-white rounded-lg text-sm focus:outline-none focus:border-secondary"
              style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
              value={search}
            />
            <img
              src={searchIcon}
              className="absolute inline-block w-4 left-3.5"
              alt=""
            />
          </div>
        </div>
        <div
          className="relative block w-full bg-white rounded-lg p-4 overflow-y-auto max-h-[calc(100vh-200px)] overflowScroll"
          style={{ boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" }}
        >
          {isLoading ? (
            <TableSkeleton
              rows={8}
              columns={4}
              thdata={["Caller ID", "Duration", "Date & Time", "Msgid"]}
            />
          ) : filteredData?.length > 0 ? (
            <table className="w-full border-collapse border border-gray-200 text-left text-sm">
              <thead className="sticky top-0 bg-secondary text-white z-10">
                <tr>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Caller ID
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Duration
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2">
                    Date
                  </th>
                  <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  // Clean CallerID: remove quotes and angle brackets
                  const cleanCallerID = item.CallerID
                    ? item.CallerID.replace(/["<>]/g, "").trim()
                    : "";

                  // Format duration
                  let durationValue = parseInt(item.Duration, 10) || 0;
                  let formattedDuration =
                    durationValue > 60
                      ? `${Math.floor(durationValue / 60)}min ${String(
                          durationValue % 60
                        ).padStart(2, "0")}sec`
                      : `${durationValue}sec`;
                  const isUnplayed = item.isUnplayed;
                  const isPlayed = item.isPlayed;
                  const isCurrentPlaying =
                    audioMsgId === item.Msgid && isAudioPlaying;

                  return (
                    <tr
                      key={item.Msgid || idx}
                      className={`hover:bg-gray-50 ${
                        isUnplayed ? "bg-blue-50 font-semibold" : ""
                      }`}
                    >
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        {isUnplayed && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        )}
                        {isPlayed && (
                          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        )}
                        {cleanCallerID}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        {formattedDuration}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2">
                        {convertCSTToLocalTime(item.DateTime)}
                      </td>
                      <td className="border-b-[1px] border-gray-200 px-4 py-2 text-right relative">
                        <span className="relative flex items-center justify-end">
                          {audioMsgId === item.Msgid && (
                            <audio
                              ref={audioRef}
                              controls
                              autoPlay
                              src={`${
                                import.meta.env.VITE_MIRTA_API_BASE_URL
                              }/proxyapi.php?key=${
                                import.meta.env.VITE_API_KEY
                              }&reqtype=VOICEMAIL&tenant=${tenant}&action=message&msgid=${audioMsgId}`}
                              onEnded={handleAudioEnded}
                              onPlay={() => {
                                setIsAudioPlaying(true);
                                handleReadAudio(item.Msgid);
                              }}
                              onPause={() => setIsAudioPlaying(false)}
                            />
                          )}
                          {isCurrentPlaying ? (
                            <>
                              <span className="inline-block align-middle">
                                <img
                                  src={waveGif}
                                  alt="wave"
                                  className="w-14 h-8"
                                />
                              </span>
                              <Link
                                to="#"
                                onClick={handleCloseAudio}
                                className="ml-2 align-middle"
                              >
                                <img
                                  src={waveClose}
                                  alt="close"
                                  className="w-4 h-4 inline-block"
                                  style={{ verticalAlign: "middle" }}
                                />
                              </Link>
                            </>
                          ) : (
                            <button
                              className="cursor-pointer"
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.pause();
                                  audioRef.current.currentTime = 0;
                                }
                                setAudioMsgId(item.Msgid);
                                setIsAudioPlaying(true);
                                handleReadAudio(item.Msgid);
                              }}
                            >
                              <span className="flex items-center justify-end">
                                <span className="inline-block align-middle w-16"></span>
                                <img src={playIcon} alt="Play" />
                              </span>
                            </button>
                          )}
                          <button
                            className="ml-2 cursor-pointer"
                            onClick={() => initiateDelete(item.Msgid)}
                          >
                            <img src={deleteIcon} alt="" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No Voicemail Found.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default VoiceMail;
