import { useState } from "react";

const MessageWindow = ({ message, isSender }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  // Handle both socket and API response formats
  const messageContent = message.content || message.message || "";
  const messageAttachments = message.attachments || [];
  const messageImage = message.image || null;
  const messageTimestamp = message.created_at || new Date().toISOString();

  return (
    <>
      <div
        className={`max-w-xs md:max-w-md p-3 rounded-2xl mb-2 text-sm flex flex-col ${
          isSender
            ? "bg-secondary self-end text-right"
            : "bg-white self-start text-left"
        }`}
        style={{ boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)" }}
      >
        {messageContent && (
          <span
            className={`mb-0.5 break-words ${isSender ? "!text-white" : "text-primary"}`}
          >
            {messageContent}
          </span>
        )}
        {Array.isArray(messageAttachments) &&
          messageAttachments.length > 0 &&
          messageAttachments.map((file, idx) => {
            const fullUrl = import.meta.env.VITE_API_BASE_URL + file.file_url;
            return (
              <div key={idx} className="mt-1 max-w-[200px]">
                <img
                  src={fullUrl}
                  alt={file.file_name || "attachment"}
                  className="max-w-full rounded-lg border cursor-pointer"
                  onClick={() => setPreviewUrl(fullUrl)}
                />
              </div>
            );
          })}
        {messageImage && !messageAttachments.length && (
          <div className="mt-1 max-w-[200px]">
            <img
              src={
                messageImage.startsWith("data:image")
                  ? messageImage
                  : `data:image/*;base64,${messageImage}`
              }
              alt={message.imageName || "attachment"}
              className="max-w-full rounded-lg border cursor-pointer"
              onClick={() =>
                setPreviewUrl(
                  messageImage.startsWith("data:image")
                    ? messageImage
                    : `data:image/*;base64,${messageImage}`
                )
              }
            />
          </div>
        )}

        <span
          className={`mt-1 text-xs ${
            isSender ? "!text-white" : "text-gray-500"
          }`}
        >
          {new Date(messageTimestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        
      </div>
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg border-4 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default MessageWindow;
