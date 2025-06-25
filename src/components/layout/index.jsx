/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { getCompanyList } from "../../api/dashboard";
import Logo from "../../assets/auth/logo.png";
import smallLogo from "../../assets/auth/smallLogo.png";
import ArrowChevron from "../../assets/layout/arrow-right.png";
import bellIcon from "../../assets/layout/bell.svg";
import chatLight from "../../assets/layout/chat-white.svg";
import chatDark from "../../assets/layout/chat.svg";
import contactBookLight from "../../assets/layout/contact-light.png";
import contactBookDark from "../../assets/layout/contact.png";
import dashboardLight from "../../assets/layout/dashboard-hover.png";
import dashboardDark from "../../assets/layout/dashboard.png";
import humberger from "../../assets/layout/hamburger2.svg";
import historydark from "../../assets/layout/history.png";
import historylight from "../../assets/layout/historylight.png";
import logout from "../../assets/layout/logout.png";
import organizationLight from "../../assets/layout/organization-light.png";
import organizationDark from "../../assets/layout/organization.png";
import contactDark from "../../assets/layout/phone.png";
import contactLight from "../../assets/layout/phonelight.png";
import userDark from "../../assets/layout/user.png";
import userLight from "../../assets/layout/userlight.png";
import voiceDark from "../../assets/layout/voicemail.png";
import voiceLight from "../../assets/layout/voicemaillight.png";
import useDebounce from "../../hooks/useDebounce";
import {
  clearAuth,
  setDialPad,
  setSelectedOrganization,
} from "../../store/slices/authSlice";
import {
  resetSessions,
  setIsDNDActive,
} from "../../store/slices/callFeatureSlice";
import { fetchChatList } from "../../store/slices/chatListSlice";
import { fetchVoiceMail } from "../../store/slices/voicemailSlice";
import { convertCSTToLocalTime, formatUSPhone } from "../../utils/common";
import NotificationPermissionHandler from "../common/NotificationPermissionHandler";

function Index() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [companyList, setCompanyList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showVoicemailDropdown, setShowVoicemailDropdown] = useState(false);
  const [searchCompany, setSearchCompany] = useState("");
  const [activeTab, setActiveTab] = useState("voicemail");
  const debouncedSearch = useDebounce(searchCompany, 300);
  const showDialpad = useSelector((state) => state.auth.dialPad);
  const userRole = useSelector((state) => state.auth.user?.data?.userType);
  const userName = useSelector((state) => state.auth.user?.data);
  const dialPadModal = useSelector((state) => state.auth.dialPadModal);
  const userCompanyName = useSelector(
    (state) => state.auth.user?.data?.company?.companyName
  );
  const isRegistered = useSelector((state) => state.sip.isRegistered);
  const userDid = useSelector(
    (state) => state.auth.user?.data?.extension[0]?.username
  );
  const extensionTenant = useSelector((state) => state.auth?.user?.data?.city);
  const extensionNumber = extensionTenant?.split("-")[0];
  const tenant = extensionTenant?.split("-")[1];
  const voicemailData = useSelector((state) => state.voiceMail);
  const totalUnread = useSelector((state) => state.chatList?.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dialpadRef = useRef(null);
  const dropdownRef = useRef(null);
  const voicemailDropdownRef = useRef(null);

  let filteredMenuPath = [];
  if (userRole === "superadmin") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      {
        menu: "Organizations",
        link: "/organizations",
        icondark: organizationDark,
        iconlight: organizationLight,
      },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "History",
        link: "/history",
        icondark: historydark,
        iconlight: historylight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
      {
        menu: "Users",
        link: "/users",
        icondark: userDark,
        iconlight: userLight,
      },
    ];
  } else if (userRole === "admin") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "History",
        link: "/history",
        icondark: historydark,
        iconlight: historylight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
      {
        menu: "Users",
        link: "/users",
        icondark: userDark,
        iconlight: userLight,
      },
    ];
  } else if (userRole === "user") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
    ];
  }

  // Find the active menu item based on current path
  const activeMenu =
    filteredMenuPath.find((item) => item.link === location.pathname)?.menu ||
    "";

  const handleRotate = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    dispatch(resetSessions());
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showDialpad || dialPadModal) return;
    function handleClickOutside(event) {
      if (dialpadRef.current && !dialpadRef.current.contains(event.target)) {
        dispatch(setDialPad(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDialpad, dialPadModal, dispatch]);

  // Close dialpad on page reload
  useEffect(() => {
    if (!showDialpad || dialPadModal) return;
    dispatch(setDialPad(false));
  }, []);

  // company list
  const fetchCompanyList = async () => {
    setIsLoading(true);
    try {
      const response = await getCompanyList();
      setCompanyList(response?.data?.success);
      return response;
    } catch (error) {
      console.error("Error fetching company list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyList();
  }, []);

  useEffect(() => {
    dispatch(fetchVoiceMail({ tenant, extensionNumber }));
    dispatch(fetchChatList({}));
  }, [dispatch, tenant, extensionNumber]);

  useEffect(() => {
    if (companyList && companyList.length > 0 && !selectedCompany) {
      setSelectedCompany(companyList[0]);
    }
    dispatch(setSelectedOrganization(selectedCompany));
  }, [companyList, selectedCompany]);

  // Optimized click-outside handler for React 19
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCompanyDropdown && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
        return;
      }
      
      if (showVoicemailDropdown && 
          voicemailDropdownRef.current && 
          !voicemailDropdownRef.current.contains(event.target)) {
        setShowVoicemailDropdown(false);
      }
    };
    if (showCompanyDropdown || showVoicemailDropdown) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true });
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, { passive: true });
      };
    }
  }, [showCompanyDropdown, showVoicemailDropdown]);

  const filteredCompanyList = useMemo(() => 
    companyList.filter(company => 
      (company.companyName || "")
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase())
    ), 
    [companyList, debouncedSearch]
  );

  return (
    <main className="relative flex w-full h-screen bg-[#f2f8ff]">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#00000033] backdrop-blur-sm bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen shadow-2xs z-[999] border-r-[1px] border-gray-100 bg-white p-4 transition-all duration-300 ease-linear 
          ${isCollapsed ? "w-20" : "w-56"}
          md:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-[110%]"}
        `}
      >
        <div className="relative w-full h-full block">
          <Link
            to="/"
            className={`relative block pb-3.5 mb-5 border-b-[1px] border-b-gray-400`}
          >
            <img
              src={smallLogo}
              alt="Login"
              className={`mix-blend-multiply h-auto w-[30px] absolute top-0 left-2 transition-opacity duration-300 delay-200 ${
                isCollapsed ? "opacity-100" : "opacity-0"
              }`}
            />
            <img
              src={Logo}
              alt="Login"
              className={`mix-blend-multiply max-w-28 h-auto transition-opacity duration-300 ${
                isCollapsed ? "opacity-0" : "opacity-100 delay-200"
              }`}
            />
          </Link>
          <button
            onClick={handleRotate}
            className={`absolute top-7 right-[-26px] w-7 h-7 flex items-center justify-center rounded-full shadow bg-white cursor-pointer transition-transform duration-300 ease-linear ${
              isCollapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            <img src={ArrowChevron} alt="Toggle" className="w-6 h-auto" />
          </button>
          <menu>
            {filteredMenuPath.map(({ menu, link, icondark, iconlight }) => {
              const path = link;
              const anchorText = menu;
              return (
                <div
                  key={menu}
                  className="relative"
                  onMouseEnter={() => setHoveredMenu(menu)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <NavLink
                    to={path}
                    className={`flex items-center gap-1.5 h-12 rounded-[30px] mb-2.5 p-[12px]`}
                    style={({ isActive }) => {
                      return {
                        backgroundColor: isActive ? "#67308F" : "",
                        boxShadow: isActive
                          ? "0px 4px 20px rgba(103, 48, 143, 0.1)"
                          : "",
                      };
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span className="inline-flex min-w-[24px] min-h-[24px] items-center justify-center">
                          <img
                            src={isActive ? iconlight : icondark}
                            alt={menu}
                            className="object-contain max-w-6 h-auto"
                          />
                        </span>
                        <span
                          className={`text-sm font-medium transition-opacity duration-300 ${
                            isCollapsed ? "opacity-0" : "opacity-100"
                          } ${isActive ? "!text-white" : ""}`}
                        >
                          {anchorText}
                        </span>
                      </>
                    )}
                  </NavLink>{" "}
                  {isCollapsed &&
                    hoveredMenu === menu &&
                    !isMobileMenuOpen &&
                    window.innerWidth >= 768 && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 bg-[#67308F] text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none">
                        {anchorText}
                      </div>
                    )}
                </div>
              );
            })}
          </menu>
          <Link
            to="#"
            className="absolute flex w-auto items-center bottom-3 left-0 gap-1.5 text-sm"
            onClick={handleLogout}
          >
            <img src={logout} alt="" className="" />
            <span
              className={`text-sm font-medium transition-opacity duration-300 ${
                isCollapsed ? "opacity-0" : "opacity-100"
              }`}
              style={{ color: "red" }}
            >
              LogOut
            </span>
          </Link>
        </div>
      </aside>
      <div
        className={`block transition-all duration-300 ease-linear ${
          isCollapsed ? "sm:w-[calc(100%-79px)]" : "sm:w-[calc(100%-223px)]"
        } ml-auto w-full`}
      >
        <header
          className="sticky top-0 z-30 p-4 flex items-center justify-between w-full h-[60px] bg-white border-b-[1px] border-gray-200"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="flex items-center gap-4">
            <h1 className="hidden sm:block">{activeMenu}</h1>
            {/* Company Dropdown */}
            {userRole !== "superadmin" && <h5>{userCompanyName}</h5>}
            {userRole === "superadmin" && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="ml-2 px-3 py-1 bg-gray-100 cursor-pointer rounded text-sm border border-gray-200 focus:outline-none min-w-[160px] text-left"
                  onClick={() => setShowCompanyDropdown((prev) => !prev)}
                >
                  {selectedCompany
                    ? selectedCompany.companyName
                    : "Select Company"}
                </button>
                {!isLoading && showCompanyDropdown && selectedCompany && (
                  <div className="absolute left-0 mt-1 w-64 max-h-80 bg-white border border-gray-200 rounded shadow-lg z-50 overflow-y-auto">
                    {/* Search Field */}
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <input
                        type="search"
                        value={searchCompany}
                        onChange={(e) => setSearchCompany(e.target.value)}
                        placeholder="Search company..."
                        className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none"
                      />
                    </div>
                    <ul>
                      {filteredCompanyList.map((company) => (
                        <li
                          key={company.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-secondary text-sm truncate ${
                            selectedCompany?.id === company.id
                              ? "bg-secondary !text-white"
                              : ""
                          }`}
                          style={{
                            ...(selectedCompany?.id === company.id
                              ? { color: "#fff" }
                              : {}),
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#fff")
                          }
                          onMouseLeave={(e) => {
                            if (selectedCompany?.id !== company.id) {
                              e.currentTarget.style.color = "";
                            }
                          }}
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowCompanyDropdown(false);
                          }}
                        >
                          {company.companyName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 relative">
            <div
              className="relative flex items-center"
              ref={voicemailDropdownRef}
            >
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
                      <ul className="max-h-[300px] m-0 p-0 overflow-y-auto w-full overflowScroll">
                        {voicemailData?.unplayedCount > 0 ? (
                          <>
                            {/* Convert object to array and slice first 4 items */}
                            {Object.values(
                              voicemailData?.unplayedVoicemails || {}
                            )
                              .slice(0, 4)
                              .map((item) => {
                                const cleanCallerID = item.CallerID
                                  ? item.CallerID.replace(/["<>]/g, "").trim()
                                  : "";
                                return (
                                  <li
                                    key={item.Msgid}
                                    className="border-b-[1px] border-gray-200 px-4 py-2 flex flex-col gap-1 cursor-pointer hover:bg-gray-100"
                                  >
                                    <h5 className="text-gray-500 text-sm">
                                      {cleanCallerID}
                                    </h5>
                                    <p className="text-gray-700 text-sm">
                                      {convertCSTToLocalTime(item.DateTime)}
                                    </p>
                                  </li>
                                );
                              })}
                            {/* Show "Show More" button if there are more than 4 items */}
                            {Object.keys(
                              voicemailData?.unplayedVoicemails || {}
                            ).length > 4 && (
                              <li className="border-t-[1px] border-gray-200">
                                <Link
                                  to="/voicemail"
                                  className="block w-full text-center py-3 !text-secondary hover:bg-gray-50 font-medium text-sm"
                                  onClick={() =>
                                    setShowVoicemailDropdown(false)
                                  }
                                >
                                  Show More (
                                  {Object.keys(
                                    voicemailData?.unplayedVoicemails || {}
                                  ).length - 4}{" "}
                                  more)
                                </Link>
                              </li>
                            )}
                          </>
                        ) : (
                          <li className="px-4 py-2 text-sm text-gray-500">
                            No voicemails available
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500 text-center">
                        <ul className="max-h-[300px] m-0 p-0 overflow-y-auto w-full text-left overflowScroll">
                          {totalUnread?.totalUnreadCount > 0 ? (
                            <>
                              {totalUnread?.unreadChats
                                ?.slice(0, 4)
                                ?.map((item, index) => {
                                  let displayName = "";

                                  if (item?.participants?.length > 0) {
                                    const participant = item.participants[0];
                                    const {
                                      firstName,
                                      lastName,
                                      formatcontact,
                                    } = participant;
                                    if (firstName?.trim() || lastName?.trim()) {
                                      displayName = `${firstName || ""} ${
                                        lastName || ""
                                      }`.trim();
                                    } else {
                                      displayName =
                                        formatUSPhone(formatcontact);
                                    }
                                  } else {
                                    displayName = item.room_name.split("_")[0];
                                  }

                                  const formattedTime = new Date(
                                    item.created_at || Date.now()
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                                  return (
                                    <>
                                      <li
                                        key={index}
                                        className="border-b-[1px] border-gray-200 px-4 py-2 flex justify-between gap-1 cursor-pointer hover:bg-gray-100"
                                      >
                                        <div className="flex flex-col gap-2">
                                          <h5 className="text-gray-500 text-sm">
                                            {displayName}
                                          </h5>
                                          <p className="text-sm">
                                            {item?.last_message_content}
                                          </p>
                                        </div>
                                        <p className="text-gray-700 text-sm">
                                          {formattedTime}
                                        </p>
                                      </li>
                                    </>
                                  );
                                })}
                                {totalUnread?.totalUnreadCount > 0 && (
                              <li className="border-t-[1px] border-gray-200">
                                <Link
                                  to="/chat"
                                  className="block w-full text-center py-3 !text-secondary hover:bg-gray-50 font-medium text-sm"
                                  onClick={() =>
                                    setShowVoicemailDropdown(false)
                                  }
                                > 
                                  {totalUnread?.totalUnreadCount < 4 ? `Go to Messages`: `${- 4} more Messages`}
                                </Link>
                              </li>
                            )}
                            </>
                          ) : (
                            <li className="px-4 py-2 text-sm text-gray-500">
                              No voicemails available
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* DND Toggle Switch */}
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSelector(
                    (state) => state?.callFeature?.isDNDActive
                  )}
                  className="sr-only peer border-0 focus:ring-0"
                  onChange={(e) => dispatch(setIsDNDActive(e.target.checked))}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-secondary-light dark:peer-focus:ring-secondary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-secondary"></div>
                <strong className="ms-2 text-sm text-primary">DND</strong>
              </label>
            </div>
            <button className="flex items-center gap-2 cursor-pointer">
              <span className="relative w-8 h-8 rounded-full bg-secondary items-center justify-center flex">
                <img src={userLight} alt="User Avatar" className="" />
              </span>
              <div className="text-left overflow-hidden hidden sm:block">
                <h5 className="text-sm font-medium text-gray-500">{`${userName?.firstName} ${userName?.lastName}`}</h5>
                <p className="text-xs font-bold block !text-green-700">
                  {isRegistered ? `${userDid} Register` : "Unregister"}
                </p>
              </div>
            </button>
            <button
              className="md:hidden flex items-center justify-center w-8 h-8"
              onClick={toggleMobileMenu}
            >
              <img
                src={humberger}
                alt="Toggle Menu"
                className={`w-6 h-6 transition-transform duration-300`}
              />
            </button>
          </div>
        </header>{" "}
        <div className="relative flex w-full h-[calc(100vh-60px)]">
          <div className={`relative block w-full`}>
            <NotificationPermissionHandler />
            <Outlet />
          </div>
          {/* {showDialpadModal && ( */}
          {/* <DialPadModal /> */}
          {/* )} */}
        </div>
      </div>
    </main>
  );
}

export default Index;
