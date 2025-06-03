const DashboardSkeleton = ({ userRole }) => {
  return (
    <section className="w-[calc(100%-32px)] m-4">
      {/* Card Skeletons */}
      {userRole !== "user" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 animate-pulse flex items-center justify-between"
              style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-200 rounded mb-2"></div>
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Box Skeleton */}
      <div
        className="relative flex items-center justify-between bg-white rounded-2xl py-4 px-6 mb-4"
        style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex items-center gap-5">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex items-center gap-2 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="relative flex gap-5 w-full mb-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="relative flex w-full max-w-1/3 bg-white rounded-[12px] h-[300px] animate-pulse p-6"
            style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="w-full h-full bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div
        className="relative block w-full bg-white rounded-[12px] p-4 overflow-y-auto max-h-[500px]"
        style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
      >
        <table className="w-full border-collapse border border-gray-200 text-left text-sm">
          <thead className="sticky top-0 bg-secondary text-white z-10">
            <tr>
              <th className="border-b-[1px] border-gray-200 px-4 py-2">
                Extension
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2">
                Caller Name
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2">
                Caller Number
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                Receiver
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                Date & Time
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                Duration
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                Direction
              </th>
              <th className="border-b-[1px] border-gray-200 px-4 py-2 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {[...Array(8)].map((_, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b-[1px] border-gray-200 px-4 py-2"
                  >
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DashboardSkeleton;
