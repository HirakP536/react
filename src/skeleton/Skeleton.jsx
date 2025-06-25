const ContactSkeleton = ({ rows = 4 }) => (
  <div className="space-y-4">
    {[...Array(rows)].map((_, idx) => (
      <div key={idx} className="flex items-center gap-3 animate-pulse">
        <span className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
        <div className="w-10 h-4 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const MessageSkeleton = ({ rows = 4 }) => (
  <div className="flex flex-col gap-3">
    {[...Array(rows)].map((_, idx) => (
      <div
        key={idx}
        className={`flex ${idx % 2 === 0 ? "justify-end" : "justify-start"}`}
      >
        <div className="bg-gray-200 rounded-2xl p-4 w-40 h-6 animate-pulse" />
      </div>
    ))}
  </div>
);

const TableSkeleton = ({ rows, columns, thdata = [] }) => (
  <div className="w-full">
    <table className="w-full border-collapse border border-gray-200 text-left text-sm">
      <thead className="sticky top-0 bg-secondary text-white z-10">
        <tr>
          {thdata?.length > 0
            ? thdata.map((header, i) => (
                <th
                  key={i}
                  className={`border-b-[1px] border-gray-200 px-4 py-2${
                    i === 1
                      ? " text-center"
                      : i === 2 || i === 3 || i === 4 || i === 5
                      ? " text-right"
                      : ""
                  }`}
                >
                  {header}
                </th>
              ))
            : ["Number", "Status", "Date & Time"].map((text, i) => (
                <th
                  key={i}
                  className={`border-b-[1px] border-gray-200 px-4 py-2${
                    i === 1 ? " text-center" : i === 2 ? " text-right" : ""
                  }`}
                >
                  {text}
                </th>
              ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, idx) => (
          <tr key={idx} className="animate-pulse">
            {[...Array(columns)].map((__, colIdx) => (
              <td
                key={colIdx}
                className={`border-b-[1px] border-gray-200 px-4 py-2${
                  colIdx === 1
                    ? " text-center"
                    : colIdx === columns - 1
                    ? " text-right"
                    : ""
                }`}
              >
                <span
                  className={`block bg-gray-200 rounded ${
                    colIdx === 0
                      ? "w-24 h-4"
                      : colIdx === 1
                      ? "w-16 h-4 mx-auto"
                      : "w-28 h-4 ml-auto"
                  }`}
                ></span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Skeleton = ({ rows, columns, th, type = "table" }) => {
  if (type === "contact") {
    return <ContactSkeleton rows={rows} />;
  }
  if (type === "message") {
    return <MessageSkeleton rows={rows} />;
  }
  // Default: Table skeleton
  return <TableSkeleton rows={rows} columns={columns} th={th} />;
};

export { ContactSkeleton, MessageSkeleton, TableSkeleton };
export default Skeleton;
