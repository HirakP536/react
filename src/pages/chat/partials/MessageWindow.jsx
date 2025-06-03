import { useState } from "react";

const MessageWindow = ({ message, isSender }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const formattedTime = new Date(
    message.created_at || Date.now()
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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
        {(message.content || message.message) && (
          <span
            className={`mb-0.5 ${isSender ? "!text-white" : "text-primary"}`}
          >
            {message.content || message.message}
          </span>
        )}
        {Array.isArray(message.attachments) &&
          message.attachments.length > 0 &&
          message.attachments.map((file, idx) => {
            const fullUrl = import.meta.env.VITE_API_BASE_URL + file.file_url;
            return (
              <div key={idx} className="mt-1 max-w-[500px]">
                <img
                  src={fullUrl}
                  alt={file.file_name || "attachment"}
                  className="max-w-full rounded-lg border cursor-pointer"
                  onClick={() => setPreviewUrl(fullUrl)}
                />
              </div>
            );
          })}
        {message.image && !message.attachments && (
          <div className="mt-1 max-w-[500px]">
            <img
              src={
                message.image.startsWith("data:image")
                  ? message.image
                  : `data:image/*;base64,${message.image}`
              }
              alt={message.imageName || "attachment"}
              className="max-w-full rounded-lg border cursor-pointer"
              onClick={() =>
                setPreviewUrl(
                  message.image.startsWith("data:image")
                    ? message.image
                    : `data:image/*;base64,${message.image}`
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
          {formattedTime}
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
